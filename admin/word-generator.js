const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");

function generateWordCertificate(data) {
    try {
        // Load the template
        const templatePath = path.join(__dirname, "templates", "certificate-template.docx");
        
        if (!fs.existsSync(templatePath)) {
            throw new Error("Template file not found at " + templatePath);
        }

        const content = fs.readFileSync(templatePath, "binary");

        // Unzip the content of the file
        const zip = new PizZip(content);

        // Parse the template
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Render the document (replace {placeholder} with values)
        doc.render(data);

        // Get the zip document and generate it as a nodebuffer
        const buf = doc.getZip().generate({
            type: "nodebuffer",
            // compression: DEFLATE adds a compression step.
            // For a 50MB output document, expect 500ms additional CPU time
            compression: "DEFLATE",
        });

        return buf;
    } catch (error) {
        console.error("Error generating Word certificate from template:", error);
        throw error;
    }
}

module.exports = { generateWordCertificate };
