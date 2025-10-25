from flask import Flask, request, jsonify
import pickle
import numpy as np
from joblib import load

app = Flask(__name__)

# Load your model (ensure the file path is correct)
model = pickle.load(open("C:\\project1\\p1\\model.pkl", "rb"))

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = np.array(data["features"]).reshape(1, -1)
    prediction = model.predict(features)
    return jsonify({"prediction": float(prediction[0])})

if __name__ == "__main__":
    app.run(port=5001, debug=True)

  

