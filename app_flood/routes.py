from flask import Blueprint, jsonify, request, render_template, current_app
import mysql.connector
from datetime import datetime
import os
import time

bp = Blueprint('routes', __name__)

# ===== DATABASE CONFIG =====
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'flood_detection')
}

# ===== DATABASE HELPER =====
def get_db():
    retry_count = 0
    max_retries = 3
    while retry_count < max_retries:
        try:
            conn = mysql.connector.connect(**db_config)
            return conn
        except mysql.connector.Error as err:
            retry_count += 1
            current_app.logger.error(f"DB connection failed (attempt {retry_count}): {err}")
            time.sleep(2)
    raise Exception("DB connection failed after retries.")

# ===== DASHBOARD METRICS HELPER =====
def get_dashboard_metrics():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                COUNT(DISTINCT node_id) AS active_nodes,
                MAX(water_level) AS highest_reading,
                AVG(water_level) AS average_level,
                MAX(timestamp) AS last_update,
                SUM(CASE WHEN flood_status = 'DANGER' THEN 1 ELSE 0 END) AS danger_nodes,
                SUM(CASE WHEN flood_status = 'WARNING' THEN 1 ELSE 0 END) AS warning_nodes
            FROM (
                SELECT node_id, water_level, flood_status, timestamp
                FROM sensor_data
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY timestamp DESC
            ) AS recent_data;
        """)
        metrics = cursor.fetchone()

        cursor.execute("""
            SELECT COUNT(*) AS active_alerts
            FROM flood_alerts
            WHERE status = 'ACTIVE'
            AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """)
        alerts = cursor.fetchone()

        return {**metrics, **alerts}
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard metrics: {str(e)}")
        return None
    finally:
        if conn and conn.is_connected():
            conn.close()

# ===== STATIC PAGE ROUTES =====
@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/about.html')
def about():
    return render_template('about.html')

@bp.route('/contact.html')
def contact():
    return render_template('contact.html')

@bp.route('/data.html')
def data():
    return render_template('data.html')

@bp.route('/navigation.html')
def navigation():
    return render_template('navigation.html')

# ===== API ROUTE FOR DEVICE DATA =====
@bp.route('/api/device-data', methods=['POST'])
def receive_device_data():
    conn = None
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be JSON"}), 415

        data = request.get_json()
        required_fields = ['node_id', 'water_level', 'latitude', 'longitude']
        missing = [f for f in required_fields if f not in data]

        if missing:
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
        current_app.logger.error(f"Error saving data: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()
