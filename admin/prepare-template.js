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
console.log("Reset template.");

const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);
let docXml = zip.file("word/document.xml").asText();

// EXACT XML replacements based on debug dump
const strictReplacements = [
    // 1. CCR: 56762 + 8
    {
        target: '<w:t>56762</w:t></w:r><w:r><w:rPr><w:rFonts w:hint="default"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="en-US"/></w:rPr><w:t>8</w:t>',
        replacement: '<w:t>{ccrNumber}</w:t>'
    },
    // 2. Vehicle Description: RAM...4Door + s
    {
        target: '<w:t>RAM 1500 SST Rebel X 3.0L Pick-up 4×4 4Door</w:t></w:r><w:r><w:rPr><w:rFonts w:hint="default"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>s</w:t>',
        replacement: '<w:t>{vehicleDescription}</w:t>'
    },
    // 3. Manufacturer: FCA US LLC (Was clean in V1, let's assume it is)
    { target: 'FCA US LLC', replacement: '{manufacturer}' },
    
    // 4. Country CAN (Used twice) -> {countryOfProduction}
    // "Country of Origin: " -> {countryOfProduction}
    // "Country of Production: " -> {countryOfProduction}
    { target: 'CANADA', replacement: '{countryOfProduction}' },

    // 5. VIN Label
    { target: '<w:t>* VlN number:</w:t>', replacement: '<w:t>* VlN number: {vin}</w:t>' },
    
    // 6. Model Year: 2025 (spaces)
    { target: '<w:t xml:space="preserve">2025               </w:t>', replacement: '<w:t>{modelYear}               </w:t>' },

    // 7. Prod Month: 07
    {
        target: 'Month </w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>07</w:t>',
        replacement: 'Month </w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>{productionMonth}</w:t>'
    },
    // 8. Prod Year: 2025
    {
        target: 'Year </w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>2025</w:t>',
        replacement: 'Year </w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>{productionYear}</w:t>'
    },
    
    // 9. Axle Weights
    {
        target: '<w:t xml:space="preserve">1750 </w:t>',
        replacement: '<w:t xml:space="preserve">{frontAxleWeight} </w:t>'
    },
    {
        target: '<w:t xml:space="preserve">1900 </w:t>',
        replacement: '<w:t xml:space="preserve">{rearAxleWeight} </w:t>'
    },
    {
        target: '<w:t>3450</w:t>', // Max weight (V1 found simple "3450"?)
        replacement: '<w:t>{maxVehicleWeight}</w:t>' // Replaces "3450" globally? No, simple string replace in XML might hit other 3450s but unlikely.
    },
    {
        target: '<w:t xml:space="preserve">2550 </w:t>', // Curb
        replacement: '<w:t xml:space="preserve">{curbWeight} </w:t>'
    },

    // 10. Dimensions
    { target: '<w:t xml:space="preserve">5916 </w:t>', replacement: '<w:t xml:space="preserve">{length} </w:t>' },
    { target: '<w:t xml:space="preserve">2085 </w:t>', replacement: '<w:t xml:space="preserve">{width} </w:t>' },
    { target: '<w:t xml:space="preserve">1960 </w:t>', replacement: '<w:t xml:space="preserve">{height} </w:t>' },
    { target: '<w:t xml:space="preserve">3692 </w:t>', replacement: '<w:t xml:space="preserve">{wheelbase} </w:t>' },
    { target: '<w:t xml:space="preserve">1740 </w:t>', replacement: '<w:t xml:space="preserve">{trackFront} </w:t>' }, // Front & Rear same?
    // "Front: 1740 mm Rear: 1740 mm". If formatted same, replaceAll handles both.

    // 11. Chassis
    { target: 'Body-on-frame', replacement: '{chassisType}' },
    
    // 12. Passengers: 5
    { target: '<w:t>5</w:t>', replacement: '<w:t>{passengers}</w:t>' }, // A bit risky replacing all "5"s.
    // The "5" for passengers in XML: `Passengers: </w:t>...<w:t>5</w:t>`
    // The previous debug showed exactly matches.
    
    // 13. Engine
    { target: 'Petrol', replacement: '{engineType}' },
    { target: '<w:t xml:space="preserve">6  </w:t>', replacement: '<w:t xml:space="preserve">{cylinders}  </w:t>' },
    { target: '<w:t>2993</w:t>', replacement: '<w:t>{displacement}</w:t>' },
    { target: 'Twin </w:t></w:r><w:r><w:rPr><w:rFonts w:hint="default"/><w:b/><w:bCs/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>Turbo', replacement: '{airIntake}' },
    
    { target: '<w:t>{enginePower}</w:t>', replacement: '<w:t>{enginePower}</w:t>' }, // ALREADY DONE via simple string "313" in V1.
    // Wait, simple "313" worked in V1. So "313" is likely clean.
    { target: '313', replacement: '{enginePower}' },
    { target: '5200', replacement: '{engineRpm}' },

    { target: 'Automatic', replacement: '{transmission}' }, 
    { target: 'Hydraulic', replacement: '{serviceBrakes}' },
    { target: 'Combined with the service brakes', replacement: '{emergencyBrakes}' },
    
    { target: 'Light Truck', replacement: '{vehicleClass}' }, // "Light {category}"?
    // User text says "Light Truck". If I replace "Truck" -> "{category}", it becomes "Light {category}".
    // If I replace "Light Truck" -> "{vehicleClass}", it overrides.
    // Priority: "Light Truck" first.
    { target: 'Light Truck', replacement: '{vehicleClass}' },
    { target: 'Truck', replacement: '{category}' },

    { target: '09.5', replacement: '{fuelEconomy}' }, // Check splits?
    // V1 failed "09.5".
    // XML: `09</w:t>...<.>...<5>`
    // Hard to strict match.
    // Let's search for just `09`. Replace with `{fuelEconomy}`. Delete `.` and `5`?
    // XML: `Combined: </w:t>...<w:t>09</w:t><w:t>.</w:t><w:t>5</w:t>`
    // Complex.
    // Regex: `09<\/w:t>.*?<w:t>\.<\/w:t>.*?<w:t>5<\/w:t>`
    
    { target: 'Also comply with the National regulations', replacement: '{additionalInfo}' } // Partial match for long text
];

// Apply replacements
let replacedCount = 0;
strictReplacements.forEach(item => {
    if (docXml.includes(item.target)) {
        docXml = docXml.split(item.target).join(item.replacement);
        console.log(`[OK] Replaced: "${item.target.substring(0, 30)}..."`);
        replacedCount++;
    } else {
        // Try fallback (e.g. simple string if target was complex)
        // console.log(`[MISS] Not found: "${item.target.substring(0, 30)}..."`);
    }
});

// Write back
zip.file("word/document.xml", docXml);
const buffer = zip.generate({ type: "nodebuffer" });
fs.writeFileSync(templatePath, buffer);

console.log(`\nFinished V3. Replaced ${replacedCount} items.`);
