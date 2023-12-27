# app.py
import torch
from ultralytics import YOLO
from PIL import Image
from io import BytesIO
from flask import Flask, request, jsonify

app = Flask(__name__)

# Set the device to CPU
device = torch.device('cpu')
model = YOLO(r"C:\Users\ASUS\OneDrive - Naresuan University\งาน\ลอง API\best.pt").to(device)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if the request contains an image
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        # Get the image file from the request
        image_file = request.files['image']

        # Read the image
        image = Image.open(image_file)

        # Run prediction on the image
        results = model.predict(image, save=True, show=True, device=device)

        # If you want to save the results, you can use results.save("output_folder")

        return jsonify({'success': True, 'results': 'Prediction completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
