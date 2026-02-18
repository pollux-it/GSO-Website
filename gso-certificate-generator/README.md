# 🚗 GSO Certificate Generator

An AI-powered web application that generates Gulf Standard Organization (GSO) Conformity Certificates for vehicles using Google's Gemini API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)

## 🌟 Features

- **AI-Powered Data Generation**: Uses Google Gemini to synthesize technical vehicle specifications
- **Professional Certificate Layout**: Mimics official GSO conformity certificate format
- **VIN-Based Estimation**: Extracts vehicle info from VIN and model name
- **Print-Ready Output**: CSS optimized for printing or saving as PDF
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Prerequisites

- Python 3.8 or higher
- A Google Gemini API Key ([Get one from Google AI Studio](https://aistudio.google.com/))

## 📦 Installation

1. **Clone or navigate to the project directory:**

   ```bash
   cd gso-certificate-generator
   ```

2. **Create a virtual environment (recommended):**

   ```bash
   python -m venv venv

   # On Windows:
   venv\Scripts\activate

   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up your API key:**

   Option 1 - Environment Variable (Recommended):

   ```bash
   # On Windows (PowerShell):
   $env:GEMINI_API_KEY = "your-api-key-here"

   # On Windows (CMD):
   set GEMINI_API_KEY=your-api-key-here

   # On macOS/Linux:
   export GEMINI_API_KEY="your-api-key-here"
   ```

   Option 2 - Edit `app.py` directly (not recommended for production):
   Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key.

## 🚀 Running the Application

1. **Start the Flask server:**

   ```bash
   python app.py
   ```

2. **Open your browser and go to:**

   ```
   http://127.0.0.1:5000
   ```

3. **Enter vehicle details:**
   - Vehicle Name (e.g., "Toyota Land Cruiser 2025 VXR")
   - VIN (17-character Vehicle Identification Number)

4. **Generate and print your certificate!**

## 📁 Project Structure

```
gso-certificate-generator/
├── app.py                 # Flask backend with Gemini API integration
├── requirements.txt       # Python dependencies
├── README.md             # This file
└── templates/
    ├── index.html        # Input form page
    └── certificate.html  # Certificate display page
```

## ⚠️ Important Notes

- **AI Estimation**: Gemini provides estimates based on publicly known specifications. It cannot decode unique VINs to find exact factory dates.
- **For Reference Only**: Generated certificates are for informational purposes and should not be used as official documents.
- **API Limits**: Be mindful of Google Gemini API rate limits and quotas.

## 🎨 Customization

### Focusing on Specific Brands

You can modify the prompt in `app.py` to focus on specific brands:

```python
prompt = f"""
You are a TOYOTA vehicle specialist and GSO expert...
"""
```

### Adding More Fields

Add additional fields to the JSON structure in the prompt and update `certificate.html` to display them.

## 📄 License

MIT License - feel free to use and modify for your projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 💡 Future Enhancements

- [ ] Add QR code generation with certificate data
- [ ] Database storage for generated certificates
- [ ] Multi-language support (Arabic/English)
- [ ] Export to Word/PDF directly
- [ ] Batch processing for multiple VINs
