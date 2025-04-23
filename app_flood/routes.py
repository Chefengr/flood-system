from flask import Blueprint, jsonify, request, render_template, current_app
from datetime import datetime, timedelta
import mysql.connector
import logging
import time
import os

bp = Blueprint('routes', __name__)

# Database configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'flood_detection')
}

# ======================
# HELPER FUNCTIONS
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
                FROM water_data
                WHERE timestamp > NOW() - INTERVAL 24 HOUR
            ) recent_data;
        """)
        result = cursor.fetchone()
        return result
    finally:
        if conn:
            conn.close()

# ======================
# FRONTEND ROUTES
# ======================

@bp.route('/')
def home():
    return render_template('index.html')

@bp.route('/about')
def about():
    return render_template('about.html')

@bp.route('/contact')
def contact():
    return render_template('contact.html')

@bp.route('/navigation')
def navigation():
    return render_template('navigation.html')

@bp.route('/data')
def data():
    return render_template('data.html')

# ======================
# API ROUTES for NodeMCU or JS Clients
# ======================

@bp.route('/api/water-data', methods=['POST'])
def receive_data():
    data = request.get_json()
    node_id = data.get('node_id')
    water_level = data.get('water_level')
    flood_status = data.get('flood_status')
    timestamp = datetime.now()

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO water_data (node_id, water_level, flood_status, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (node_id, water_level, flood_status, timestamp))
        conn.commit()
        return jsonify({'message': 'Data received successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error inserting data: {e}")
        return jsonify({'error': 'Failed to save data'}), 500
    finally:
        conn.close()

@bp.route('/api/dashboard-metrics')
def dashboard_metrics():
    try:
        metrics = get_dashboard_metrics()
        return jsonify(metrics)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch dashboard metrics: {e}")
        return jsonify({'error': 'Unable to retrieve metrics'}), 500
