const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "templates", "certificate-template.docx");
const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);
const text = zip.file("word/document.xml").asText();

// Checks
const checks = [
    { label: "Contains {ccrNumber}", test: text.includes("{ccrNumber}") },
    { label: "Contains {manufacturer}", test: text.includes("{manufacturer}") },
    { label: "Contains {vehicleDescription}", test: text.includes("{vehicleDescription}") },
    { label: "Contains {vin}", test: text.includes("{vin}") },
    { label: "Contains {fuelEconomy}", test: text.includes("{fuelEconomy}") },
    { label: "Does NOT contain 'RAM 1500'", test: !text.includes("RAM 1500") },
    { label: "Does NOT contain '567628'", test: !text.includes("567628") },
    { label: "Does NOT contain 'FCA US LLC'", test: !text.includes("FCA US LLC") }
];

console.log("Verification Results:");
let allPas = true;
checks.forEach(c => {
    console.log(`[${c.test ? "PASS" : "FAIL"}] ${c.label}`);
    if (!c.test) allPas = false;
});

if (allPas) {
    console.log("\nSUCCESS: Template is fully prepared.");
} else {
    console.log("\nWARNING: Some checks failed.");
}
