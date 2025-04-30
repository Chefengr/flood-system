from flask import Flask
import os
from flask_sqlalchemy import SQLAlchemy

# Initialize the app
app = Flask(__name__)

# Database configuration
# You can use the DATABASE_URL environment variable if you have it set or fallback to local PostgreSQL configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/flood_detection')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Optional, to disable the modification tracking feature

# Initialize the database
db = SQLAlchemy(app)

# If you want to use this file directly, you can remove `create_app()` and configure the app here.
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
