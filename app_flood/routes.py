from flask import Blueprint, jsonify, request, render_template, current_app
from datetime import datetime, timedelta
import mysql.connector
import logging
import time
import os

bp = Blueprint('routes', __name__)

# Database configuration (identical to your original)
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'flood_detection')
}

# ======================
# HELPER FUNCTIONS (identical to your original)
# ======================
def get_db():
    retry_count = 0
    max_retries = 3
    while retry_count < max_retries:
        try:
            conn = mysql.connector.connect(**db_config)
            return conn
        except mysql.connector.Error as err:
            retry_count += 1
            current_app.logger.error(f"Database connection failed (attempt {retry_count}/{max_retries}): {err}")
            if retry_count >= max_retries:
                raise
            time.sleep(2)

def get_dashboard_metrics():
    """Identical to your original implementation"""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT node_id) as active_nodes,
                MAX(water_level) as highest_reading,
                AVG(water_level) as average_level,
                MAX(timestamp) as last_update,
                SUM(CASE WHEN flood_status = 'DANGER' THEN 1 ELSE 0 END) as danger_nodes,
                SUM(CASE WHEN flood_status = 'WARNING' THEN 1 ELSE 0 END) as warning_nodes
            FROM (
                SELECT node_id, water_level, flood_status, timestamp
                FROM sensor_data
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY timestamp DESC
            ) as recent_data
        """)
        metrics = cursor.fetchone()
        
        cursor.execute("""
            SELECT COUNT(*) as active_alerts
            FROM flood_alerts
            WHERE status = 'ACTIVE'
            AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """)
        alerts = cursor.fetchone()
        
        return {**metrics, **alerts}
    except Exception as e:
        current_app.logger.error(f"Error getting dashboard metrics: {str(e)}")
        return None
    finally:
        if conn and conn.is_connected():
            conn.close()

# ======================
# ROUTES (identical functionality, only @bp.route changed)
# ======================
@bp.route('/')
def home():
    return render_template('index.html')

@bp.route('/navigation')
def navigation():
    return render_template('navigation.html')

@bp.route('/api/device-data', methods=['POST'])
def receive_device_data():
    """Identical to your original endpoint"""
    conn = None
    try:
        current_app.logger.info(f"Request received at /api/device-data")
        current_app.logger.info(f"Headers: {request.headers}")
        
        if not request.is_json:
            return jsonify({"error": "Content-Type must be JSON"}), 415

        data = request.get_json()
        required = ['node_id', 'water_level', 'latitude', 'longitude']
        if missing := [field for field in required if field not in data]:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sensor_data (
                node_id, water_level, latitude, longitude,
                temperature, humidity, severity, flood_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['node_id'],
            float(data['water_level']),
            float(data['latitude']),
            float(data['longitude']),
            float(data.get('temperature', 0.0)),
            float(data.get('humidity', 0.0)),
            data.get('severity', 'LOW'),
            data.get('flood_status', 'NORMAL')
        ))
        conn.commit()
        
        return jsonify({"status": "success"}), 201
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# Include ALL other routes from your original app.py here...
# @bp.route(...) 
# def ...():
#     ...
@bp.route('/debug-config')
def debug_config():
    return jsonify({
        "template_folder": current_app.template_folder,
        "static_folder": current_app.static_folder,
        "root_path": current_app.root_path
    })
# ======================
# LEGACY SUPPORT (if needed)
# ======================
def initialize_database():
    """Call this from wsgi.py"""
    with current_app.app_context():
        conn = None
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    node_id VARCHAR(50) NOT NULL,
                    water_level FLOAT NOT NULL,
                    temperature FLOAT,
                    humidity FLOAT,
                    severity ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE') NOT NULL,
                    flood_status ENUM('NORMAL', 'WARNING', 'DANGER') NOT NULL,
                    latitude DECIMAL(9,6) NOT NULL,
                    longitude DECIMAL(9,6) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
        except Exception as e:
            current_app.logger.error(f"DB init error: {str(e)}")
        finally:
            if conn and conn.is_connected():
                conn.close()

