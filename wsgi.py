from app_flood import app  # Imports the Flask app from app_flood/__init__.py

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)  # Optional: Set explicit host/port
