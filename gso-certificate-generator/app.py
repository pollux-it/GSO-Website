import os
import json
from flask import Flask, render_template, request
import google.generativeai as genai

app = Flask(__name__)

# Configure your API Key here - Replace with your actual Gemini API key
GENAI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAOFVDJYUgephHwNTLeCLD4P8FEqXBaj18")
genai.configure(api_key=GENAI_API_KEY)

# We use a model that is good at structured data
model = genai.GenerativeModel('gemini-flash-lite-latest')

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        car_name = request.form.get('car_name')
        vin = request.form.get('vin')
        
        # Get data from Gemini
        certificate_data = get_specs_from_gemini(car_name, vin)
        
        if certificate_data:
            return render_template('certificate.html', data=certificate_data)
        else:
            return render_template('index.html', error="Failed to generate certificate. Please try again.")
    
    return render_template('index.html')

def get_specs_from_gemini(car_name, vin):
    # This prompt instructs Gemini to act as a vehicle expert and output ONLY JSON
    prompt = f"""
    You are a technical vehicle expert and GSO Conformity specialist. 
    I will give you a Vehicle Name and a VIN. 
    You must generate a JSON object containing technical specifications for this vehicle standard to the GCC/GSO region.
    
    Input Vehicle: {car_name}
    Input VIN: {vin}

    Rules:
    1. Infer the Model Year, Country of Production, and Engine specs from the input Name and VIN.
    2. If exact data (like exact axle weight) is unknown, provide the most accurate standard specification for this model trim.
    3. Output PURE JSON only. No markdown formatting.
    
    Required JSON Structure (fill with relevant data):
    {{
        "ccr_number": "—",
        "approved_on": "—",
        "manufacturer": "Name of Manufacturer",
        "vehicle_name": "Full Technical Name (e.g., TOYOTA LAND CRUISER...)",
        "category": "e.g. Multipurpose Vehicle",
        "model_year": "YYYY",
        "country": "Country Name",
        "production_date": "Month YYYY",
        "vin": "{vin}",
        "weight_max": "XXXX kg",
        "weight_curb": "Approx. XXXX kg",
        "axle_front": "XXXX kg",
        "axle_rear": "XXXX kg",
        "dim_length": "XXXX mm",
        "dim_width": "XXXX mm",
        "dim_height": "XXXX mm",
        "wheelbase": "XXXX mm",
        "track_front": "XXXX mm",
        "track_rear": "XXXX mm",
        "chassis_type": "e.g. Chassis Frame",
        "passengers": "X (Including Driver)",
        "engine_type": "Petrol/Diesel",
        "cylinders": "X",
        "displacement": "XXXX cc",
        "air_intake": "e.g. Twin Turbocharged",
        "power": "XXX kW @ XXXX rpm",
        "torque": "XXX Nm @ XXXX rpm",
        "pollutant_limit": "Comply with Euro 4 / GCC",
        "transmission": "e.g. Automatic 10-Speed",
        "drive_type": "e.g. Full-Time 4WD",
        "ecall": "Provided",
        "brakes_service": "Hydraulic",
        "brakes_emergency": "Combined with service brake",
        "fuel_tank": "XXX Liters",
        "cafe_combined": "Approx. X.X - X.X km/L",
        "extra_notes": "Any other technical notes regarding engine or safety."
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean up code blocks if Gemini adds them
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text_response)
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == '__main__':
    app.run(debug=True, port=5000)
