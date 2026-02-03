const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

// 1. Reset template from original user file
const originalFile = path.join(__dirname, "..", "GSO WORD FILE.docx");
const templatePath = path.join(__dirname, "templates", "certificate-template.docx");

if (!fs.existsSync(originalFile)) {
    console.error("Original file not found.");
    process.exit(1);
}
fs.copyFileSync(originalFile, templatePath);
console.log("Reset template from GSO WORD FILE.docx");

const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);
let docXml = zip.file("word/document.xml").asText();

// Simple text replacements that work regardless of XML tags
const replacements = [
    // CCR Number
    { target: '<w:t>530361</w:t>', replacement: '<w:t>{ccrNumber}</w:t>' },
    
    // Manufacturer (appears twice)
    { target: '<w:t>Toyota Motor Corporation</w:t>', replacement: '<w:t>{manufacturer}</w:t>' },
    
    // Vehicle Description
    { target: '<w:t>TOYOTA LAND CRUISER GXR V6 4.0L SUV 4WD 5Doors</w:t>', replacement: '<w:t>{vehicleDescription}</w:t>' },
    
    // Brand name in header
    { target: '<w:t>TOYOTA</w:t>', replacement: '<w:t>{brandName}</w:t>' },
    
    // Country - JAPAN (multiple occurrences)
    { target: '<w:t>JAPAN</w:t>', replacement: '<w:t>{countryOfProduction}</w:t>' },
    
    // VIN
    { target: '<w:t>JTMAUCBJ*S*******</w:t>', replacement: '<w:t>{vin}</w:t>' },
    
    // Category: SUV (first occurrence after "Category:")
    { target: '<w:t>SUV</w:t></w:r></w:p><w:p w14:paraId="7260BFC1"', replacement: '<w:t>{category}</w:t></w:r></w:p><w:p w14:paraId="7260BFC1"' },
    
    // Model Year - need to find with xml:space attribute
    { target: '<w:t>2025</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/>', replacement: '<w:t>{modelYear}</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/>' },
    
    // Production Month: 6
    { target: '<w:t>6</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve"> Year </w:t>', 
      replacement: '<w:t>{productionMonth}</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve"> Year </w:t>' },
    
    // Production Year: 2025 (after "Year ")
    { target: '<w:t>{productionYear}</w:t>', replacement: '<w:t>{productionYear}</w:t>' },
    
    // Weights
    { target: '<w:t>3350</w:t>', replacement: '<w:t>{maxVehicleWeight}</w:t>' },
    { target: '<w:t xml:space="preserve">2580 </w:t>', replacement: '<w:t xml:space="preserve">{curbWeight} </w:t>' },
    { target: '<w:t xml:space="preserve">1580 </w:t>', replacement: '<w:t xml:space="preserve">{frontAxleWeight} </w:t>' },
    { target: '<w:t xml:space="preserve">1950 </w:t>', replacement: '<w:t xml:space="preserve">{rearAxleWeight} </w:t>' },
    
    // Dimensions
    { target: '<w:t xml:space="preserve">5145 </w:t>', replacement: '<w:t xml:space="preserve">{length} </w:t>' },
    { target: '<w:t xml:space="preserve">1980 </w:t>', replacement: '<w:t xml:space="preserve">{width} </w:t>' },
    { target: '<w:t xml:space="preserve">1890 </w:t>', replacement: '<w:t xml:space="preserve">{height} </w:t>' },
    { target: '<w:t xml:space="preserve">2850 </w:t>', replacement: '<w:t xml:space="preserve">{wheelbase} </w:t>' },
    { target: '<w:t xml:space="preserve">1665 </w:t>', replacement: '<w:t xml:space="preserve">{trackFront} </w:t>' },
    
    // Chassis Type
    { target: 'Body-on-frame', replacement: '{chassisType}' },
    
    // Passengers: 7
    { target: '<w:t>7</w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="18"', replacement: '<w:t>{passengers}</w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="18"' },
    
    // Engine Type
    { target: 'Petrol', replacement: '{engineType}' },
    
    // Cylinders: 6  (with spaces)
    { target: '<w:t xml:space="preserve">6  </w:t>', replacement: '<w:t xml:space="preserve">{cylinders}  </w:t>' },
    
    // Displacement: 3982
    { target: '<w:t>3982</w:t>', replacement: '<w:t>{displacement}</w:t>' },
    
    // Air Intake
    { target: 'Naturally Aspirated', replacement: '{airIntake}' },
    
    // Engine Power: 202
    { target: '<w:t>202</w:t>', replacement: '<w:t>{enginePower}</w:t>' },
    
    // Engine RPM: 5600
    { target: '<w:t>5600</w:t>', replacement: '<w:t>{engineRpm}</w:t>' },
    
    // Pollutant Limit
    { target: 'Euro 6B standards', replacement: '{pollutantLimit}' },
    
    // Transmission
    { target: 'Automatic', replacement: '{transmission}' },
    
    // Service Brakes
    { target: 'Hydraulic', replacement: '{serviceBrakes}' },
    
    // Emergency Brakes
    { target: 'Combined with the service brake', replacement: '{emergencyBrakes}' },
    
    // Vehicle Class (second SUV in fuel economy section)
    { target: '<w:t>SUV</w:t></w:r><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="18"', 
      replacement: '<w:t>{vehicleClass}</w:t></w:r><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="18"' },
    
    // Fuel Economy: 09.7 (split: 09 . 7)
    { target: '<w:t>09</w:t>', replacement: '<w:t>{fuelEconomy}</w:t>' },
    
    // Fuel Economy Rating: Good
    { target: '<w:t>Good</w:t>', replacement: '<w:t>{fuelEconomyRating}</w:t>' },
    
    // Additional Info (partial)
    { target: 'Also comply with the National regulations', replacement: '{additionalInfo}' },
    
    // Approved Date: 11 OCT 2025 (text box content)
    { target: '<w:t xml:space="preserve">11 OCT </w:t>', replacement: '<w:t xml:space="preserve">{approvedOn}</w:t>' },
];

// Apply replacements
let replacedCount = 0;
replacements.forEach(item => {
    if (docXml.includes(item.target)) {
        docXml = docXml.split(item.target).join(item.replacement);
        console.log(`[OK] ${item.replacement.match(/\{([^}]+)\}/)?.[1] || 'custom'}`);
        replacedCount++;
    }
});

// Write back
zip.file("word/document.xml", docXml);
const buffer = zip.generate({ type: "nodebuffer" });
fs.writeFileSync(templatePath, buffer);

console.log(`\nFinished. Replaced ${replacedCount} items.`);

// Verify placeholders
const verifyContent = fs.readFileSync(templatePath, "binary");
const verifyZip = new PizZip(verifyContent);
const verifyXml = verifyZip.file("word/document.xml").asText();
const placeholders = verifyXml.match(/\{[a-zA-Z]+\}/g) || [];
console.log("Placeholders in template:", [...new Set(placeholders)]);
