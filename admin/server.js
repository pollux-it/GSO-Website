const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { generateWordCertificate } = require("./word-generator");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve the entire public folder (for CSS, JS, and certificate files)
// This makes relative paths like ../../../static.gso.org.sa/ work correctly
app.use(express.static(path.join(__dirname, "..", "public")));

// Path to the certificates folder
const CERTIFICATES_PATH = path.join(
  __dirname,
  "..",
  "public",
  "www.gso.org.sa",
  "cc",
  "v"
);

// Template files (original GSO files)
const TEMPLATE_EN = path.join(CERTIFICATES_PATH, "546883.html");
const TEMPLATE_AR = path.join(CERTIFICATES_PATH, "546883d6cc.html");

// Ensure the certificates directory exists
if (!fs.existsSync(CERTIFICATES_PATH)) {
  fs.mkdirSync(CERTIFICATES_PATH, { recursive: true });
}

// Arabic translations
const translations = {
  category: {
    'Passenger Car': 'سيارة ركاب',
    'Truck': 'شاحنة',
    'SUV': 'سيارة دفع رباعي',
    'Van': 'فان',
    'Multipurpose Vehicle': 'مركبة متعددة الأغراض',
    'Motorcycle': 'دراجة نارية',
    'Bus': 'حافلة'
  },
  engineType: {
    'Petrol': 'بنزين',
    'Diesel': 'ديزل',
    'Hybrid': 'هجين',
    'Electric': 'كهربائي',
    'Plug-in Hybrid': 'هجين قابل للشحن'
  },
  transmission: {
    'Automatic': 'أوتوماتيك',
    'Manual': 'يدوي',
    'CVT': 'CVT',
    'DCT': 'DCT'
  },
  airIntake: {
    'Naturally Aspirated': 'سحب طبيعي',
    'Turbo': 'توربو',
    'Supercharged': 'سوبر تشارجر',
    'Twin Turbo': 'توربو مزدوج'
  },
  chassisType: {
    'Monocoque': 'متكامل',
    'Body-on-frame': 'هيكل منفصل',
    'Space frame': 'هيكل فضائي',
    'Backbone': 'هيكل عمود فقري'
  },
  serviceBrakes: {
    'Hydraulic': 'هيدروليكية',
    'Pneumatic': 'هوائية',
    'Electric': 'كهربائية',
    'Mechanical': 'ميكانيكية'
  },
  emergencyBrakes: {
    'Combined with the service brake': 'مدمجة مع مكابح الخدمة',
    'Combined with service brake': 'مدمجة مع مكابح الخدمة',
    'Separate system': 'نظام منفصل',
    'Electronic parking brake': 'فرامل كهربائية'
  },
  fuelEconomyRating: {
    'Excellent': 'ممتاز',
    'Very Good': 'جيد جداً',
    'Good': 'جيد',
    'Acceptable': 'مقبول',
    'Average': 'متوسط',
    'Poor': 'ضعيف'
  },
  vehicleClass: {
    'Light Truck': 'شاحنة خفيفة',
    'Passenger Car': 'سيارة ركاب',
    'SUV': 'سيارة رياضية',
    'Multipurpose Vehicle': 'مركبة متعددة الأغراض',
    'Heavy Truck': 'شاحنة ثقيلة'
  },
  eCallSystem: {
    'Provided': 'متوفر',
    'Not Provided': 'غير متوفر'
  },
  countryOfProduction: {
    'JAPAN': 'اليابان',
    'GERMANY': 'ألمانيا',
    'USA': 'الولايات المتحدة',
    'KOREA': 'كوريا',
    'CHINA': 'الصين',
    'UK': 'المملكة المتحدة',
    'FRANCE': 'فرنسا',
    'ITALY': 'إيطاليا',
    'SPAIN': 'إسبانيا',
    'SWEDEN': 'السويد',
    'CZECH REPUBLIC': 'التشيك',
    'INDIA': 'الهند',
    'THAILAND': 'تايلاند',
    'MEXICO': 'المكسيك',
    'CANADA': 'كندا',
    'BRAZIL': 'البرازيل',
    'SOUTH AFRICA': 'جنوب أفريقيا',
    'TURKEY': 'تركيا'
  }
};

function translate(category, value) {
  return translations[category]?.[value] || value;
}

// Generate English certificate by modifying template
function generateEnglishCertificate(data) {
  let template = fs.readFileSync(TEMPLATE_EN, 'utf8');
  
  // Replace title CCR number
  template = template.replace(/Certificate 546883/g, `Certificate ${data.ccrNumber}`);
  
  // Replace Arabic link with correct CCR
  template = template.replace(/546883d6cc\.html/g, `${data.ccrNumber}d6cc.html`);
  
  // Replace CCR Number value
  template = template.replace(
    /<span class="spec-value en-text">546883<\/span>/,
    `<span class="spec-value en-text">${data.ccrNumber}</span>`
  );
  
  // Replace Approved On
  template = template.replace(
    /<span class="spec-value en-text">16 APR 2025<\/span>/,
    `<span class="spec-value en-text">${data.approvedOn}</span>`
  );
  
  // Replace Manufacturer
  template = template.replace(
    /<span class="spec-value en-text">Toyota Motor Corporation<\/span>/,
    `<span class="spec-value en-text">${data.manufacturer}</span>`
  );
  
  // Replace Vehicle Description
  template = template.replace(
    /TOYOTA HIACE \(GDH322\) 2\.8L Van RWD 5Doors/g,
    data.vehicleDescription
  );
  
  // Replace Category
  template = template.replace(
    /<span class="spec-label">Category<\/span><span class="spec-value">Truck<\/span>/,
    `<span class="spec-label">Category</span><span class="spec-value">${data.category}</span>`
  );
  
  // Replace Model Year
  template = template.replace(
    /<span class="spec-label">Model Year<\/span><span class="spec-value en-text">2026<\/span>/,
    `<span class="spec-label">Model Year</span><span class="spec-value en-text">${data.modelYear}</span>`
  );
  
  // Replace Country of Production
  template = template.replace(
    /<span class="spec-label">Country of Production<\/span><span class="spec-value">JAPAN<\/span>/,
    `<span class="spec-label">Country of Production</span><span class="spec-value">${data.countryOfProduction}</span>`
  );
  
  // Replace Production date
  template = template.replace(
    /<span class="unit pr-2">Month<\/span>5<span class="unit pl-2 pr-2">Year<\/span>2025/,
    `<span class="unit pr-2">Month</span>${data.productionMonth}<span class="unit pl-2 pr-2">Year</span>${data.productionYear}`
  );
  
  // Replace VIN
  template = template.replace(
    /JTGHB9CP\*T\*\*\*\*\*\*\*/g,
    data.vin
  );
  
  // Weights
  template = template.replace(
    /<span class="spec-label">Max Vehicle Weight<\/span><span class="spec-value">3500/,
    `<span class="spec-label">Max Vehicle Weight</span><span class="spec-value">${data.maxVehicleWeight}`
  );
  template = template.replace(
    /<span class="spec-label">Curb<\/span><span class="spec-value">2340/,
    `<span class="spec-label">Curb</span><span class="spec-value">${data.curbWeight}`
  );
  template = template.replace(
    /<span class="spec-label">Front<\/span><span class="spec-value">1750/,
    `<span class="spec-label">Front</span><span class="spec-value">${data.frontAxleWeight}`
  );
  template = template.replace(
    /<span class="spec-label">Rear<\/span><span class="spec-value ">2000/,
    `<span class="spec-label">Rear</span><span class="spec-value ">${data.rearAxleWeight}`
  );
  
  // Dimensions
  template = template.replace(
    /<span class="spec-label">Length<\/span><span class="spec-value ">5915/,
    `<span class="spec-label">Length</span><span class="spec-value ">${data.length}`
  );
  template = template.replace(
    /<span class="spec-label">Width<\/span><span class="spec-value ">1950/,
    `<span class="spec-label">Width</span><span class="spec-value ">${data.width}`
  );
  template = template.replace(
    /<span class="spec-label">Height<\/span><span class="spec-value ">2280/,
    `<span class="spec-label">Height</span><span class="spec-value ">${data.height}`
  );
  template = template.replace(
    /<span class="spec-label">\(F1-R1\)<\/span><span class="spec-value ">3860/,
    `<span class="spec-label">(F1-R1)</span><span class="spec-value ">${data.wheelbase}`
  );
  
  // Track - front and rear (after Track header)
  template = template.replace(
    /Track<\/li>\s*<li><span class="spec-label">Front<\/span><span class="spec-value ">1680/,
    `Track</li>\n                               <li><span class="spec-label">Front</span><span class="spec-value ">${data.trackFront}`
  );
  template = template.replace(
    /<span class="spec-label">Rear<\/span><span class="spec-value ">1670/,
    `<span class="spec-label">Rear</span><span class="spec-value ">${data.trackRear}`
  );
  
  // Body and Seating
  template = template.replace(
    /<span class="spec-label">Type of chassis and body<\/span><span class="spec-value">Monocoque<\/span>/,
    `<span class="spec-label">Type of chassis and body</span><span class="spec-value">${data.chassisType}</span>`
  );
  template = template.replace(
    /<span class="spec-label">Number of Passengers<\/span><span class="spec-value">3/,
    `<span class="spec-label">Number of Passengers</span><span class="spec-value">${data.passengers}`
  );
  
  // Engine
  template = template.replace(
    /<span class="spec-label">Engine Type<\/span><span class="spec-value">Diesel<\/span>/,
    `<span class="spec-label">Engine Type</span><span class="spec-value">${data.engineType}</span>`
  );
  template = template.replace(
    /<span class="spec-label">Cylinders<\/span><span class="spec-value en-text">4<\/span>/,
    `<span class="spec-label">Cylinders</span><span class="spec-value en-text">${data.cylinders}</span>`
  );
  template = template.replace(
    /<span class="spec-label">Displacement<\/span><span class="spec-value ">2755/,
    `<span class="spec-label">Displacement</span><span class="spec-value ">${data.displacement}`
  );
  template = template.replace(
    /<span class="spec-label">Air Intake<\/span><span class="spec-value">Turbo<\/span>/,
    `<span class="spec-label">Air Intake</span><span class="spec-value">${data.airIntake}</span>`
  );
  template = template.replace(
    /<span class="spec-label">Net Engine Power<\/span><span class="spec-value ">130<span class="unit">kW<\/span><span class="unit pl-1 pr-1">at<\/span>3400/,
    `<span class="spec-label">Net Engine Power</span><span class="spec-value ">${data.enginePower}<span class="unit">kW</span><span class="unit pl-1 pr-1">at</span>${data.engineRpm}`
  );
  template = template.replace(
    /<span class="spec-label">Pollutant Limit<\/span><span class="spec-value">Does Not Comply with Euro4<\/span>/,
    `<span class="spec-label">Pollutant Limit</span><span class="spec-value">${data.pollutantLimit}</span>`
  );
  
  // Transmission
  template = template.replace(
    /<span class="spec-label">Transmission<\/span><span class="spec-value">Manual<\/span>/,
    `<span class="spec-label">Transmission</span><span class="spec-value">${data.transmission}</span>`
  );
  
  // eCall
  template = template.replace(
    /<span class="spec-label">e Call \(SOS\) System<\/span><span class="spec-value">Not Provided<\/span>/,
    `<span class="spec-label">e Call (SOS) System</span><span class="spec-value">${data.eCallSystem}</span>`
  );
  
  // Brakes
  template = template.replace(
    /<span class="spec-label">Service Brakes<\/span><span class="spec-value">Hydraulic<\/span>/,
    `<span class="spec-label">Service Brakes</span><span class="spec-value">${data.serviceBrakes}</span>`
  );
  template = template.replace(
    /<span class="spec-label">Emergency Brakes<\/span><span class="spec-value">Combined with the service brake<\/span>/,
    `<span class="spec-label">Emergency Brakes</span><span class="spec-value">${data.emergencyBrakes}</span>`
  );
  
  // Fuel Economy
  template = template.replace(
    /<span class="spec-label">Motor Vehicle Class<\/span><span class="spec-value">Light Truck<\/span>/,
    `<span class="spec-label">Motor Vehicle Class</span><span class="spec-value">${data.vehicleClass}</span>`
  );
  template = template.replace(
    /<span class="spec-label">FE \(CAFE\) Combined<\/span><span class="spec-value ">13\.7<span class="unit pr-1">km\/L<\/span>\s*—\s*Excellent/,
    `<span class="spec-label">FE (CAFE) Combined</span><span class="spec-value ">${data.fuelEconomy}<span class="unit pr-1">km/L</span>\n                                     —\n                                     ${data.fuelEconomyRating}`
  );
  
  // Additional Info
  if (data.additionalInfo) {
    template = template.replace(
      /Also comply with the National regulations[\s\S]*?This certificate is not valid for Saudi Arabia market\./,
      data.additionalInfo
    );
  }
  
  return template;
}

// Generate Arabic certificate by modifying template
function generateArabicCertificate(data) {
  let template = fs.readFileSync(TEMPLATE_AR, 'utf8');
  
  // Replace title CCR number
  template = template.replace(/Certificate 546883/g, `Certificate ${data.ccrNumber}`);
  template = template.replace(/شهادة 546883/g, `شهادة ${data.ccrNumber}`);
  
  // Replace English link with correct CCR
  template = template.replace(/546883\.html/g, `${data.ccrNumber}.html`);
  
  // Replace CCR Number value
  template = template.replace(
    /<span class="spec-value en-text">546883<\/span>/,
    `<span class="spec-value en-text">${data.ccrNumber}</span>`
  );
  
  // Replace Approved On
  template = template.replace(
    /<span class="spec-value en-text">16 APR 2025<\/span>/,
    `<span class="spec-value en-text">${data.approvedOn}</span>`
  );
  
  // Replace Manufacturer
  template = template.replace(
    /<span class="spec-value en-text">Toyota Motor Corporation<\/span>/,
    `<span class="spec-value en-text">${data.manufacturer}</span>`
  );
  
  // Replace Vehicle Description
  template = template.replace(
    /TOYOTA HIACE \(GDH322\) 2\.8L Van RWD 5Doors/g,
    data.vehicleDescription
  );
  
  // Replace Category with Arabic translation
  template = template.replace(
    /<span class="spec-label">الصنف<\/span><span class="spec-value">شاحنة<\/span>/,
    `<span class="spec-label">الصنف</span><span class="spec-value">${translate('category', data.category)}</span>`
  );
  
  // Replace Model Year
  template = template.replace(
    /<span class="spec-label">سنة الطراز \(الموديل\)<\/span><span class="spec-value en-text">2026<\/span>/,
    `<span class="spec-label">سنة الطراز (الموديل)</span><span class="spec-value en-text">${data.modelYear}</span>`
  );
  
  // Replace Country with Arabic
  template = template.replace(
    /<span class="spec-label">بلد الانتاج<\/span><span class="spec-value">اليابان<\/span>/,
    `<span class="spec-label">بلد الانتاج</span><span class="spec-value">${translate('countryOfProduction', data.countryOfProduction)}</span>`
  );
  
  // Replace Production date
  template = template.replace(
    /<span class="unit pr-2">الشهر<\/span>5<span class="unit pl-2 pr-2">السنة<\/span>2025/,
    `<span class="unit pr-2">الشهر</span>${data.productionMonth}<span class="unit pl-2 pr-2">السنة</span>${data.productionYear}`
  );
  
  // Replace VIN
  template = template.replace(
    /JTGHB9CP\*T\*\*\*\*\*\*\*/g,
    data.vin
  );
  
  // Weights (Arabic)
  template = template.replace(
    /<span class="spec-label">الوزن الأقصى للمركبة<\/span><span class="spec-value">3500/,
    `<span class="spec-label">الوزن الأقصى للمركبة</span><span class="spec-value">${data.maxVehicleWeight}`
  );
  template = template.replace(
    /<span class="spec-label"> الوزن الفارغ للمركبة<\/span><span class="spec-value">2340/,
    `<span class="spec-label"> الوزن الفارغ للمركبة</span><span class="spec-value">${data.curbWeight}`
  );
  template = template.replace(
    /<span class="spec-label">الأمامية<\/span><span class="spec-value">1750/,
    `<span class="spec-label">الأمامية</span><span class="spec-value">${data.frontAxleWeight}`
  );
  template = template.replace(
    /<span class="spec-label">الخلفية<\/span><span class="spec-value ">2000/,
    `<span class="spec-label">الخلفية</span><span class="spec-value ">${data.rearAxleWeight}`
  );
  
  // Dimensions (Arabic)
  template = template.replace(
    /<span class="spec-label">الطول<\/span><span class="spec-value ">5915/,
    `<span class="spec-label">الطول</span><span class="spec-value ">${data.length}`
  );
  template = template.replace(
    /<span class="spec-label">العرض<\/span><span class="spec-value ">1950/,
    `<span class="spec-label">العرض</span><span class="spec-value ">${data.width}`
  );
  template = template.replace(
    /<span class="spec-label">الارتفاع<\/span><span class="spec-value ">2280/,
    `<span class="spec-label">الارتفاع</span><span class="spec-value ">${data.height}`
  );
  template = template.replace(
    /\(F1-R1\)<\/span><span class="spec-value ">3860/,
    `(F1-R1)</span><span class="spec-value ">${data.wheelbase}`
  );
  
  // Track (Arabic)
  template = template.replace(
    /المسافة بين العجلات<\/li>\s*<li><span class="spec-label">الأمامية<\/span><span class="spec-value ">1680/,
    `المسافة بين العجلات</li>\n                               <li><span class="spec-label">الأمامية</span><span class="spec-value ">${data.trackFront}`
  );
  template = template.replace(
    /<span class="spec-label">الخلفية<\/span><span class="spec-value ">1670/,
    `<span class="spec-label">الخلفية</span><span class="spec-value ">${data.trackRear}`
  );
  
  // Body and Seating (Arabic)
  template = template.replace(
    /<span class="spec-label">نوع الهيكل والجسم<\/span><span class="spec-value">متكامل<\/span>/,
    `<span class="spec-label">نوع الهيكل والجسم</span><span class="spec-value">${translate('chassisType', data.chassisType)}</span>`
  );
  template = template.replace(
    /<span class="spec-label">عدد الركاب<\/span><span class="spec-value">3/,
    `<span class="spec-label">عدد الركاب</span><span class="spec-value">${data.passengers}`
  );
  
  // Engine (Arabic)
  template = template.replace(
    /<span class="spec-label">نوع المحرك<\/span><span class="spec-value">ديزل<\/span>/,
    `<span class="spec-label">نوع المحرك</span><span class="spec-value">${translate('engineType', data.engineType)}</span>`
  );
  template = template.replace(
    /<span class="spec-label">عدد الاسطوانات<\/span><span class="spec-value en-text">4<\/span>/,
    `<span class="spec-label">عدد الاسطوانات</span><span class="spec-value en-text">${data.cylinders}</span>`
  );
  template = template.replace(
    /<span class="spec-label">سعة المحرك<\/span><span class="spec-value ">2755/,
    `<span class="spec-label">سعة المحرك</span><span class="spec-value ">${data.displacement}`
  );
  template = template.replace(
    /<span class="spec-label">مدخل الهواء<\/span><span class="spec-value">توربو<\/span>/,
    `<span class="spec-label">مدخل الهواء</span><span class="spec-value">${translate('airIntake', data.airIntake)}</span>`
  );
  template = template.replace(
    /<span class="spec-label">قدرة المحرك الصافية<\/span><span class="spec-value ">130<span class="unit">كيلو واط<\/span><span class="unit pl-1 pr-1"> عند<\/span>3400/,
    `<span class="spec-label">قدرة المحرك الصافية</span><span class="spec-value ">${data.enginePower}<span class="unit">كيلو واط</span><span class="unit pl-1 pr-1"> عند</span>${data.engineRpm}`
  );
  template = template.replace(
    /<span class="spec-label">حدود الملوثات<\/span><span class="spec-value">Does Not Comply with Euro4<\/span>/,
    `<span class="spec-label">حدود الملوثات</span><span class="spec-value">${data.pollutantLimit}</span>`
  );
  
  // Transmission (Arabic)
  template = template.replace(
    /<span class="spec-label">ناقل الحركة<\/span><span class="spec-value">يدوي<\/span>/,
    `<span class="spec-label">ناقل الحركة</span><span class="spec-value">${translate('transmission', data.transmission)}</span>`
  );
  
  // eCall (Arabic)
  template = template.replace(
    /<span class="spec-label">e Call \(SOS\) System<\/span><span class="spec-value">Not Provided<\/span>/,
    `<span class="spec-label">e Call (SOS) System</span><span class="spec-value">${translate('eCallSystem', data.eCallSystem)}</span>`
  );
  
  // Brakes (Arabic)
  template = template.replace(
    /<span class="spec-label">مكابح الخدمة<\/span><span class="spec-value">هيدروليكية<\/span>/,
    `<span class="spec-label">مكابح الخدمة</span><span class="spec-value">${translate('serviceBrakes', data.serviceBrakes)}</span>`
  );
  template = template.replace(
    /<span class="spec-label">مكابح الطوارئ<\/span><span class="spec-value">مدمجة مع مكابح الخدمة<\/span>/,
    `<span class="spec-label">مكابح الطوارئ</span><span class="spec-value">${translate('emergencyBrakes', data.emergencyBrakes)}</span>`
  );
  
  // Fuel Economy (Arabic)
  template = template.replace(
    /<span class="spec-label">فئة المركبة<\/span><span class="spec-value">شاحنة خفيفة<\/span>/,
    `<span class="spec-label">فئة المركبة</span><span class="spec-value">${translate('vehicleClass', data.vehicleClass)}</span>`
  );
  template = template.replace(
    /<span class="spec-label">اقتصاد الوقود المدمج<\/span><span class="spec-value ">13\.7<span class="unit pr-1">كم\/لتر<\/span>\s*—\s*ممتاز/,
    `<span class="spec-label">اقتصاد الوقود المدمج</span><span class="spec-value ">${data.fuelEconomy}<span class="unit pr-1">كم/لتر</span>\n                                     —\n                                     ${translate('fuelEconomyRating', data.fuelEconomyRating)}`
  );
  
  // Additional Info
  if (data.additionalInfo) {
    template = template.replace(
      /Also comply with the National regulations[\s\S]*?This certificate is not valid for Saudi Arabia market\./,
      data.additionalInfo
    );
  }
  
  return template;
}

// API Endpoints

// Generate and save certificate (English + Arabic)
app.post("/api/generate", async (req, res) => {
  try {
    const data = req.body;

    if (!data.ccrNumber) {
      return res.status(400).json({ error: "CCR Number is required" });
    }

    // Check if templates exist
    if (!fs.existsSync(TEMPLATE_EN)) {
      return res.status(500).json({ error: "English template file not found (546883.html)" });
    }
    if (!fs.existsSync(TEMPLATE_AR)) {
      return res.status(500).json({ error: "Arabic template file not found (546883d6cc.html)" });
    }

    // Generate English version
    const htmlEn = generateEnglishCertificate(data);
    const filenameEn = `${data.ccrNumber}.html`;
    const filepathEn = path.join(CERTIFICATES_PATH, filenameEn);
    fs.writeFileSync(filepathEn, htmlEn, "utf8");

    // Generate Arabic version with d6cc suffix
    const htmlAr = generateArabicCertificate(data);
    const filenameAr = `${data.ccrNumber}d6cc.html`;
    const filepathAr = path.join(CERTIFICATES_PATH, filenameAr);
    fs.writeFileSync(filepathAr, htmlAr, "utf8");

    // Save JSON data for robust editing
    const filepathJson = path.join(CERTIFICATES_PATH, `${data.ccrNumber}.json`);
    fs.writeFileSync(filepathJson, JSON.stringify(data, null, 2), "utf8");

    // Generate Word version
    let wordErrorWarning = null;
    try {
      const buffer = await generateWordCertificate(data);
      
      // Save to "word files" directory in the project root
      const WORD_FILES_PATH = path.join(__dirname, "../word files");
      if (!fs.existsSync(WORD_FILES_PATH)) {
        fs.mkdirSync(WORD_FILES_PATH, { recursive: true });
      }

      // Sanitize filename: remove invalid chars, keep it reasonable length
      const safeManufacturer = (data.manufacturer || "").replace(/[^a-z0-9]/gi, '_').trim();
      const safeDesc = (data.vehicleDescription || "").replace(/[^a-z0-9]/gi, '_').trim().substring(0, 30);
      
      const filenameWord = `${safeManufacturer}_${safeDesc}_GSO.docx`;
      const filepathWord = path.join(WORD_FILES_PATH, filenameWord);
      
      fs.writeFileSync(filepathWord, buffer);
      console.log(`Word certificate generated: ${filenameWord} at ${filepathWord}`);
    } catch (wordError) {
      console.error("Error generating Word certificate:", wordError);
      if (wordError.code === 'EBUSY') {
          wordErrorWarning = "Word file is open in another program. Please close it and update again.";
      } else {
          wordErrorWarning = "Failed to generate Word file: " + wordError.message;
      }
    }

    res.json({
      success: true,
      message: "Certificate generated successfully (English + Arabic)",
      warning: wordErrorWarning,
      files: {
        english: filenameEn,
        arabic: filenameAr
      },
      path: filepathEn,
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ error: "Failed to generate certificate: " + error.message });
  }
});

// List all certificates
app.get("/api/certificates", (req, res) => {
  try {
    const files = fs
      .readdirSync(CERTIFICATES_PATH)
      .filter((file) => file.endsWith(".html") && !file.includes("d6cc") && file !== "546883.html")
      .map((file) => {
        const stats = fs.statSync(path.join(CERTIFICATES_PATH, file));
        const ccrNumber = file.replace(".html", "");
        const arabicExists = fs.existsSync(path.join(CERTIFICATES_PATH, `${ccrNumber}d6cc.html`));
        return {
          ccrNumber: ccrNumber,
          filename: file,
          arabicFile: arabicExists ? `${ccrNumber}d6cc.html` : null,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt);

    res.json(files);
  } catch (error) {
    console.error("Error listing certificates:", error);
    res.status(500).json({ error: "Failed to list certificates" });
  }
});

// Get certificate data by reading HTML file
app.get("/api/certificates/:ccrNumber", (req, res) => {
  try {
    const { ccrNumber } = req.params;
    
    // Security: Validate CCR number format (alphanumeric only, no path traversal)
    if (!/^[a-zA-Z0-9]+$/.test(ccrNumber)) {
      return res.status(400).json({ error: "Invalid CCR number format" });
    }
    
    // Protect template files
    if (ccrNumber === "546883") {
      return res.status(400).json({ error: "Cannot read template file" });
    }
    
    const filepathEn = path.join(CERTIFICATES_PATH, `${ccrNumber}.html`);

    // 1. Try to read JSON data first (best for editing)
    const filepathJson = path.join(CERTIFICATES_PATH, `${ccrNumber}.json`);
    if (fs.existsSync(filepathJson)) {
        try {
            const jsonData = JSON.parse(fs.readFileSync(filepathJson, 'utf8'));
            return res.json(jsonData);
        } catch (jsonErr) {
            console.error("Error reading JSON file, falling back to HTML parsing:", jsonErr);
        }
    }

    // 2. Fallback: Read the English certificate file and parse HTML
    if (!fs.existsSync(filepathEn)) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Read the English certificate file
    let htmlContent;
    try {
      htmlContent = fs.readFileSync(filepathEn, 'utf8');
    } catch (readError) {
      console.error("Error reading file:", readError);
      return res.status(500).json({ error: "Failed to read certificate file: " + readError.message });
    }
    
    // Helper function to extract value between tags
    const extractValue = (pattern, defaultValue = '') => {
      try {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
        return defaultValue;
      } catch (err) {
        console.error("Error in regex pattern:", pattern, err);
        return defaultValue;
      }
    };

    // Extract all fields - using more specific patterns with better error handling
    const data = {
      ccrNumber: extractValue(/Certificate (\d+)/) || ccrNumber,
      approvedOn: extractValue(/<span class="spec-value en-text">(\d+ [A-Z]{3} \d{4})<\/span>/) || '',
      manufacturer: extractValue(/<span class="spec-value en-text">([^<]+(?:Corporation|Company|Inc|Ltd|LLC|GmbH|Motors?)[^<]*)<\/span>/) || 
                    extractValue(/<span class="spec-value en-text">([A-Z][A-Za-z\s&]+)<\/span>/) || '',
      vehicleDescription: extractValue(/TOYOTA[^<]+|([A-Z][A-Z\s\d\.\(\)]+(?:Van|Car|Truck|SUV|Bus|Motorcycle)[^<]*)/) || '',
      category: extractValue(/<span class="spec-label">Category<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      modelYear: extractValue(/<span class="spec-label">Model Year<\/span><span class="spec-value en-text">(\d+)<\/span>/) || '',
      countryOfProduction: extractValue(/<span class="spec-label">Country of Production<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      productionMonth: extractValue(/<span class="unit pr-2">Month<\/span>(\d+)/) || '',
      productionYear: extractValue(/<span class="unit pl-2 pr-2">Year<\/span>(\d+)/) || '',
      vin: extractValue(/([A-Z0-9\*]{10,17})/) || '',
      maxVehicleWeight: extractValue(/<span class="spec-label">Max Vehicle Weight<\/span><span class="spec-value">(\d+)/) || '',
      curbWeight: extractValue(/<span class="spec-label">Curb<\/span><span class="spec-value">(\d+)/) || '',
      frontAxleWeight: extractValue(/<span class="spec-label">Front<\/span><span class="spec-value">(\d+)/) || '',
      rearAxleWeight: extractValue(/<span class="spec-label">Rear<\/span><span class="spec-value ">(\d+)/) || '',
      length: extractValue(/<span class="spec-label">Length<\/span><span class="spec-value ">(\d+)/) || '',
      width: extractValue(/<span class="spec-label">Width<\/span><span class="spec-value ">(\d+)/) || '',
      height: extractValue(/<span class="spec-label">Height<\/span><span class="spec-value ">(\d+)/) || '',
      wheelbase: extractValue(/<span class="spec-label">\(F1-R1\)<\/span><span class="spec-value ">(\d+)/) || '',
      trackFront: extractValue(/Track<\/li>\s*<li><span class="spec-label">Front<\/span><span class="spec-value ">(\d+)/) || '',
      trackRear: extractValue(/<span class="spec-label">Rear<\/span><span class="spec-value ">(\d+)/) || '',
      chassisType: extractValue(/<span class="spec-label">Type of chassis and body<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      passengers: extractValue(/<span class="spec-label">Number of Passengers<\/span><span class="spec-value">(\d+)/) || '',
      engineType: extractValue(/<span class="spec-label">Engine Type<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      cylinders: extractValue(/<span class="spec-label">Cylinders<\/span><span class="spec-value en-text">(\d+)<\/span>/) || '',
      displacement: extractValue(/<span class="spec-label">Displacement<\/span><span class="spec-value ">([\d\.]+)/) || '',
      airIntake: extractValue(/<span class="spec-label">Air Intake<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      enginePower: extractValue(/<span class="spec-label">Net Engine Power<\/span><span class="spec-value ">(\d+)/) || '',
      engineRpm: extractValue(/<span class="unit pl-1 pr-1">at<\/span>(\d+)/) || '',
      pollutantLimit: extractValue(/<span class="spec-label">Pollutant Limit<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      transmission: extractValue(/<span class="spec-label">Transmission<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      eCallSystem: extractValue(/<span class="spec-label">e Call \(SOS\) System<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      serviceBrakes: extractValue(/<span class="spec-label">Service Brakes<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      emergencyBrakes: extractValue(/<span class="spec-label">Emergency Brakes<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      vehicleClass: extractValue(/<span class="spec-label">Motor Vehicle Class<\/span><span class="spec-value">([^<]+)<\/span>/) || '',
      fuelEconomy: extractValue(/<span class="spec-label">FE \(CAFE\) Combined<\/span><span class="spec-value ">([\d\.]+)/) || '',
      fuelEconomyRating: extractValue(/<span class="spec-value ">[\d\.]+<span[^>]*>km\/L<\/span>\s*—\s*([^<]+)/) || '',
      additionalInfo: extractValue(/Also comply with the National regulations([\s\S]*?)This certificate is not valid for Saudi Arabia market\./) || '',
    };

    // Log for debugging (can be removed later)
    console.log(`Extracted certificate data for CCR ${ccrNumber}:`, {
      ccrNumber: data.ccrNumber,
      manufacturer: data.manufacturer,
      category: data.category,
      modelYear: data.modelYear
    });

    res.json(data);
  } catch (error) {
    console.error("Error reading certificate:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Failed to read certificate: " + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete certificate (both English and Arabic versions)
app.delete("/api/certificates/:ccrNumber", (req, res) => {
  try {
    const { ccrNumber } = req.params;
    
    // Security: Validate CCR number format (alphanumeric only, no path traversal)
    if (!/^[a-zA-Z0-9]+$/.test(ccrNumber)) {
      return res.status(400).json({ error: "Invalid CCR number format" });
    }
    
    // Protect template files
    if (ccrNumber === "546883") {
      return res.status(400).json({ error: "Cannot delete template file" });
    }
    
    const filepathEn = path.join(CERTIFICATES_PATH, `${ccrNumber}.html`);
    const filepathAr = path.join(CERTIFICATES_PATH, `${ccrNumber}d6cc.html`);

    if (!fs.existsSync(filepathEn)) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Delete English version
    fs.unlinkSync(filepathEn);
    
    // Delete Arabic version if exists
    if (fs.existsSync(filepathAr)) {
      fs.unlinkSync(filepathAr);
    }
    
    // Delete JSON data if exists
    const filepathJson = path.join(CERTIFICATES_PATH, `${ccrNumber}.json`);
    if (fs.existsSync(filepathJson)) {
        fs.unlinkSync(filepathJson);
    }
    
    // Delete Word file if exists (using new path logic? No, old logic was different depending on when it was made)
    // We try to delete from CERTIFICATES_PATH (old) and WORD_FILES_PATH (new)
    
    // Old word path
    const filepathWordOld = path.join(CERTIFICATES_PATH, `${ccrNumber}.docx`);
    if (fs.existsSync(filepathWordOld)) {
        fs.unlinkSync(filepathWordOld);
    }
    
    // We can't easily delete the "New" word file because it's named by Manufacturer_Desc. 
    // We would need to know the manufacturer/desc to find it, or search the dir.
    // For now, let's leave the labeled Word file as backup or manual cleanup.
    // Or we could read the JSON before deleting to know the filename.
    
    res.json({ success: true, message: "Certificate deleted successfully (English + Arabic)" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ error: "Failed to delete certificate" });
  }
});

// Deploy to Firebase (localhost only for security)
app.post("/api/deploy", (req, res) => {
  // Security: Only allow deployment from localhost
  const clientIP = req.ip || req.connection.remoteAddress;
  const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
  
  if (!isLocalhost) {
    console.warn(`Deploy attempt blocked from non-localhost IP: ${clientIP}`);
    return res.status(403).json({ 
      success: false, 
      error: "Deploy is only allowed from localhost for security reasons" 
    });
  }
  
  const publicPath = path.join(__dirname, "..", "public");
  
  console.log("Starting Firebase deployment...");
  console.log("Deploy path:", publicPath);
  
  // Run firebase deploy from the public folder
  exec('firebase deploy', { cwd: publicPath }, (error, stdout, stderr) => {
    if (error) {
      console.error("Deploy error:", error.message);
      console.error("stderr:", stderr);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        stderr: stderr,
        stdout: stdout
      });
    }
    
    console.log("Deploy stdout:", stdout);
    if (stderr) console.log("Deploy stderr:", stderr);
    
    res.json({ 
      success: true, 
      message: "Deployment completed successfully!",
      output: stdout
    });
  });
});

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`========================================`);
  console.log(`GSO Admin Server is running!`);
  console.log(`========================================`);
  console.log(`Local access:    http://localhost:${PORT}`);
  console.log(`Network access:  http://${localIP}:${PORT}`);
  console.log(`========================================`);
  console.log(`Certificates will be saved to: ${CERTIFICATES_PATH}`);
  console.log(`Using templates: 546883.html (EN) and 546883d6cc.html (AR)`);
  console.log(`========================================`);
});
