from flask import Blueprint, jsonify, request, render_template, current_app
import psycopg2
from datetime import datetime
import os
import time

bp = Blueprint('routes', __name__)

# ===== DATABASE CONFIG =====
DATABASE_URL = os.getenv("postgresql://chefengr:YCREdgJEa9HTb2dTQa7ehDbbveTDLK19@dpg-d098h4adbo4c73buoe7g-a/flood_system
")  # Use the DATABASE_URL from your .env

# ===== DATABASE HELPER =====
def get_db():
    retry_count = 0
    max_retries = 3
    while retry_count < max_retries:
        try:
            conn = psycopg2.connect(DATABASE_URL, sslmode='require')  # Connect using psycopg2
            return conn
        except psycopg2.Error as err:
            retry_count += 1
            current_app.logger.error(f"DB connection failed (attempt {retry_count}): {err}")
            time.sleep(2)
    raise Exception("DB connection failed after retries.")

# ===== DATABASE CONNECTION TEST ROUTE =====
@bp.route('/test-db')
def test_db():
    try:
        # Try connecting to the database
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')  # A simple query to test connection
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        # If successful, return success response
        return jsonify({
            'success': True,
            'message': 'Database connected successfully',
            'result': result
        })
    except Exception as err:
        current_app.logger.error(f"Database connection failed: {err}")
        return jsonify({
            'success': False,
            'message': 'Database connection failed',
            'error': str(err)
        }), 500

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
                WHERE timestamp >= NOW() - INTERVAL '1 hour'
                ORDER BY timestamp DESC
            ) AS recent_data;
        """)
        metrics = cursor.fetchone()

        cursor.execute("""
            SELECT COUNT(*) AS active_alerts
            FROM flood_alerts
            WHERE status = 'ACTIVE'
            AND timestamp >= NOW() - INTERVAL '24 hour'
        """)
        alerts = cursor.fetchone()

        return {**metrics, **alerts}
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard metrics: {str(e)}")
        return None
    finally:
        if conn:
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
        if conn:
            conn.close()
