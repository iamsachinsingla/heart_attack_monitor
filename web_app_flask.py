from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import requests
import datetime
import logging

app = Flask(__name__)

# Load trained model
model_path = "heart_disease_model.pkl"
best_model = joblib.load(model_path)

# Power BI Push URL
POWER_BI_URL = "https://api.powerbi.com/beta/55bafdc5-83e2-4e9d-a7e9-2320d9455b5a/datasets/1d6f910f-c238-44fd-a19f-529e5d4c5a94/rows?experience=power-bi&key=iGn9Xl8NldDezbdcDMpuKsKpQrZvONKPeDnmepf0ovzX7LUlNqlA1Pz1ri4qp6IJlXzbkR1pbHx6hIJ9aq5lRA%3D%3D"

# Initialize serial number counter
serial_number = 0

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    global serial_number
    try:
        # Get JSON data from the interview process
        data = request.json
        logging.debug(f"Raw data received: {data}")
        
        # Convert all values to numeric (float/int) and handle missing values
        processed_data = {}
        for key in data:
            try:
                processed_data[key] = float(data[key])
            except (ValueError, TypeError):
                processed_data[key] = 0
                logging.warning(f"Could not convert {key} value '{data[key]}' to float, defaulting to 0")

        # Define expected features matching the model's training data
        expected_features = ["HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke", "Diabetes", 
                            "PhysActivity", "Fruits", "Veggies", "HvyAlcoholConsump", "AnyHealthcare", 
                            "NoDocbcCost", "GenHlth", "MentHlth", "PhysHlth", "DiffWalk", "Sex", 
                            "Age", "Education", "Income"]
        
        # Ensure all expected features are present
        for feature in expected_features:
            if feature not in processed_data:
                processed_data[feature] = 0
                logging.debug(f"Feature {feature} missing in input, defaulting to 0")

        # Convert to DataFrame
        input_df = pd.DataFrame([processed_data])
        input_df = input_df.reindex(columns=expected_features, fill_value=0)
        logging.debug(f"Input DataFrame for prediction: {input_df.to_dict()}")

        # Get probability and prediction
        probability = best_model.predict_proba(input_df)[:, 1][0]
        prediction = 1 if probability >= 0.5 else 0

        # Increment serial number
        serial_number += 1

        # Get current timestamp
        timestamp = datetime.datetime.utcnow().isoformat()

        # Prepare response
        result = {
            "prediction": prediction,
            "probability": float(probability),
            "timestamp": timestamp,
            "serial_number": serial_number
        }
        logging.debug(f"Prediction result: {result}")

        # Prepare data for Power BI (only including features present in the original Power BI push)
        power_bi_data = [{
            "SerialNumber": serial_number,
            "Timestamp": timestamp,
            "HighBP": processed_data.get("HighBP", 0),
            "HighChol": processed_data.get("HighChol", 0),
            "BMI": processed_data.get("BMI", 0),
            "CholCheck": processed_data.get("CholCheck", 0),
            "Diabetes": processed_data.get("Diabetes", 0),
            "DiffWalk": processed_data.get("DiffWalk", 0),
            "Education": processed_data.get("Education", 0),
            "Fruits": processed_data.get("Fruits", 0),
            "GenHlth": processed_data.get("GenHlth", 0),
            "HvyAlcoholConsump": processed_data.get("HvyAlcoholConsump", 0),
            "NoDocbcCost": processed_data.get("NoDocbcCost", 0),
            "PhysActivity": processed_data.get("PhysActivity", 0),
            "Smoker": processed_data.get("Smoker", 0),
            "Stroke": processed_data.get("Stroke", 0),
            "Veggies": processed_data.get("Veggies", 0),
            "Sex": processed_data.get("Sex", 0),
            "Age": processed_data.get("Age", 0),
            "Probability": float(probability),
            "Prediction": prediction
        }]

        # Send data to Power BI
        logging.debug(f"Sending data to Power BI: {power_bi_data}")
        response = requests.post(POWER_BI_URL, json=power_bi_data)
        logging.debug(f"Power BI Response: {response.status_code}, {response.text}")

        return jsonify(result)
    
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)