const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "templates", "certificate-template.docx");
const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);
const docXml = zip.file("word/document.xml").asText();

fs.writeFileSync("debug-template.xml", docXml);
console.log("Dumped word/document.xml to debug-template.xml");
