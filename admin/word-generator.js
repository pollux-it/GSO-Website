const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

async function generateWordCertificate(data) {
    try {
        // Validate required data fields
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid data: expected an object with certificate data");
        }
        
        const requiredFields = ['ccrNumber', 'manufacturer', 'vehicleDescription'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Generate QR code for the certificate URL
        const verifyUrl = `https://gso.org.sa/cc/v/${data.ccrNumber}d6cc.html`;
        const qrBuffer = await qrcode.toBuffer(verifyUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 150
        });
        
        // Pass the buffer into the data object
        data.qrCode = qrBuffer;

        // Load the template
        const templatePath = path.join(__dirname, "templates", "certificate-template.docx");
        
        if (!fs.existsSync(templatePath)) {
            throw new Error("Template file not found at " + templatePath);
        }

        const content = fs.readFileSync(templatePath, "binary");

        // Unzip the content of the file
        const zip = new PizZip(content);

        // Setup image module for docxtemplater
        const imageOpts = {
            centered: false,
            getImage: function(tagValue, tagName) {
                if (Buffer.isBuffer(tagValue)) {
                    return tagValue; // Use predefined buffer (e.g., qrCode)
                }
                if (typeof tagValue === 'string' && tagValue.trim() !== '') {
                    // Try to load local file from "cars logos"
                    const logoPath = path.resolve(__dirname, 'cars logos', tagValue);
                    if (fs.existsSync(logoPath)) {
                        return fs.readFileSync(logoPath);
                    }
                }
                // Return a transparent 1x1 image if no valid image is provided
                return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
            },
            getSize: function(img, tagValue, tagName) {
                // Return explicitly defined sizes based on the tag name
                if (tagName === "qrCode") {
                    return [120, 120]; // 120x120 pixels for QR Code
                }
                if (tagName === "carLogo") {
                    return [150, 100]; // 150x100 pixels for Car Logo
                }
                return [100, 100]; // fallback
            }
        };

        const imageModule = new ImageModule(imageOpts);

        // Parse the template with the image module
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            modules: [imageModule]
        });

        // Render the document (replace {placeholder} and {%imagePlaceholder} with values)
        doc.render(data);

        // Get the zip document and generate it as a nodebuffer
        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        return buf;
    } catch (error) {
        console.error("Error generating Word certificate from template:", error);
        throw error;
    }
}

module.exports = { generateWordCertificate };
