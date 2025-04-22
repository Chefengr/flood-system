from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import mysql.connector
from datetime import datetime, timedelta
import logging
import time
import os
# app_flood/app.py
from app_flood import app  # Import the app from __init__.py

@app.route("/")
def home():
    return "Hello, Render!"
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("floodsafe_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='static', template_folder='templates')

# Configure CORS
CORS(app, resources={
    r"/api/device-data": {"origins": ["http://192.168.93.4"]},  # NodeMCU IP
    r"/api/*": {"origins": "*"}  # Frontend access
})

# Database configuration from environment variables
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'flood_detection')
}

def get_db():
    retry_count = 0
    max_retries = 3
    while retry_count < max_retries:
        try:
            conn = mysql.connector.connect(**db_config)
            return conn
        except mysql.connector.Error as err:
            retry_count += 1
            logger.error(f"Database connection failed (attempt {retry_count}/{max_retries}): {err}")
            if retry_count >= max_retries:
                raise
            time.sleep(2)

# ==============================================
# NEW ADDITION: Dashboard Metrics Helper Functions
# ==============================================
def get_dashboard_metrics():
    """Get summary metrics for dashboard"""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Get active nodes count
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
        
        # Get recent alerts
        cursor.execute("""
            SELECT COUNT(*) as active_alerts
            FROM flood_alerts
            WHERE status = 'ACTIVE'
            AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """)
        alerts = cursor.fetchone()
        
        return {**metrics, **alerts}
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {str(e)}")
        return None
    finally:
        if conn and conn.is_connected():
            conn.close()

def get_recent_sensor_data(limit=50):
    """Get recent sensor data for dashboard"""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(f"""
            SELECT 
                node_id, 
                ROUND(water_level, 2) as water_level,
                ROUND(temperature, 1) as temperature,
                ROUND(humidity, 1) as humidity,
                severity, 
                flood_status,
                DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp
            FROM sensor_data
            ORDER BY timestamp DESC
            LIMIT {limit}
        """)
        return cursor.fetchall()
        
    except Exception as e:
        logger.error(f"Error getting sensor data: {str(e)}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()
# ==============================================

@app.route('/')
def home():
    return render_template('dj_index.html')

@app.route('/navigation')
def navigation():
    return render_template('dj_navigation.html')

# ===== ROUTE 1: Original endpoint =====
@app.route('/api/device-data', methods=['POST'])
def receive_device_data():
    """Process sensor data (now identical to submit_device_data)"""
    conn = None
    try:
        # Debugging
        logger.info(f"Request received at /api/device-data")
        logger.info(f"Headers: {request.headers}")
        logger.info(f"Raw data: {request.data}")

        # Validation
        if not request.is_json:
            return jsonify({"error": "Content-Type must be JSON"}), 415

        data = request.get_json()
        
        # Required fields check
        required = ['node_id', 'water_level', 'latitude', 'longitude']
        if missing := [field for field in required if field not in data]:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        # Numeric conversion
        try:
            water_level = float(data['water_level'])
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
        except ValueError:
            return jsonify({"error": "Numeric fields invalid"}), 400

        # Process enums
        severity = data.get('severity', 'LOW').upper()
        flood_status = data.get('flood_status', 'NORMAL').upper()

        # Database operation
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sensor_data (
                node_id,
                water_level,
                latitude,
                longitude,
                temperature,
                humidity,
                severity,
                flood_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['node_id'],
            water_level,
            latitude,
            longitude,
            float(data.get('temperature', 0.0)),
            float(data.get('humidity', 0.0)),
            severity,
            flood_status
        ))
        conn.commit()

        # ==============================================
        # NEW ADDITION: Create alert if conditions are met
        # ==============================================
        if flood_status in ['WARNING', 'DANGER']:
            cursor.execute("""
                INSERT INTO flood_alerts (
                    node_id,
                    message,
                    status
                ) VALUES (%s, %s, %s)
            """, (
                data['node_id'],
                f"Flood {flood_status.lower()} detected at node {data['node_id']}",
                'ACTIVE'
            ))
            conn.commit()
        # ==============================================

        return jsonify({"status": "success"}), 201

    except mysql.connector.Error as e:
        logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# ===== ROUTE 2: New endpoint for NodeMCU =====
@app.route('/api/submit-data', methods=['POST'])
def submit_device_data():
    """Endpoint for NodeMCU data submission"""
    conn = None
    try:
        # Debug raw input
        logger.info(f"Raw request: {request.data}")
        
        # Validate JSON
        if not request.is_json:
            return jsonify({"error": "Content-Type must be JSON"}), 415
            
        data = request.get_json()
        logger.info(f"Parsed JSON: {data}")
        
        # Validate required fields
        required = ['node_id', 'water_level', 'latitude', 'longitude']
        if not all(field in data for field in required):
            return jsonify({"error": f"Missing required fields: {required}"}), 400
            
        # Convert numeric fields
        try:
            water_level = float(data['water_level'])
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
        except ValueError:
            return jsonify({"error": "Numeric fields must be valid numbers"}), 400
            
        # Database operation
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sensor_data (
                node_id,
                water_level,
                latitude,
                longitude,
                temperature,
                humidity,
                severity,
                flood_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['node_id'],
            water_level,
            latitude,
            longitude,
            float(data.get('temperature', 0.0)),
            float(data.get('humidity', 0.0)),
            data.get('severity', 'LOW'),
            data.get('flood_status', 'NORMAL')
        ))
        conn.commit()
        
        return jsonify({"status": "success"}), 201
        
    except mysql.connector.Error as db_err:
        logger.error(f"Database error: {str(db_err)}")
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    """API endpoint for frontend with pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        node_id = request.args.get('node_id')
        hours = request.args.get('hours', type=int)
        
        # Build query conditions
        conditions = []
        params = []
        
        if hours:
            conditions.append("timestamp >= %s")
            params.append((datetime.now() - timedelta(hours=hours)).strftime('%Y-%m-%d %H:%M:%S'))
        
        if node_id:
            conditions.append("node_id = %s")
            params.append(node_id)
            
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Get paginated data
        query = f"""
            SELECT 
                id,
                node_id,
                ROUND(water_level, 2) as water_level,
                ROUND(temperature, 1) as temperature,
                ROUND(humidity, 1) as humidity,
                severity,
                flood_status,
                DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp,
                latitude,
                longitude
            FROM sensor_data
            {where_clause}
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, (page - 1) * per_page])
        data = cursor.fetchall()
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM sensor_data {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Frontend API error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/flood-data', methods=['GET'])
def get_flood_data():
    """Endpoint for map visualization"""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                node_id, 
                ROUND(water_level, 2) as water_level, 
                ROUND(temperature, 1) as temperature, 
                ROUND(humidity, 1) as humidity,
                severity, 
                flood_status, 
                DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp, 
                latitude, 
                longitude
            FROM sensor_data
            WHERE (node_id, timestamp) IN (
                SELECT node_id, MAX(timestamp)
                FROM sensor_data
                GROUP BY node_id
            )
        """)
        
        nodes = cursor.fetchall()
        
        return jsonify({'nodes': nodes})
        
    except Exception as e:
        logger.error(f"Error retrieving flood data: {str(e)}")
        return jsonify({'error': 'Could not retrieve flood data'}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()

# ==============================================
# ENHANCED DASHBOARD ROUTE WITH NEW METRICS
# ==============================================
@app.route('/data')
def show_data():
    """Render enhanced data dashboard page"""
    try:
        # Get all dashboard data
        metrics = get_dashboard_metrics()
        sensor_data = get_recent_sensor_data()
        alerts = get_recent_alerts()
        
        return render_template('data.html', 
                            metrics=metrics,
                            sensor_data=sensor_data,
                            flood_alerts=alerts,
                            last_updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return render_template('data.html', 
                            metrics=None,
                            sensor_data=[],
                            flood_alerts=[],
                            error=str(e))

def get_recent_alerts(limit=5):
    """Get recent flood alerts"""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(f"""
            SELECT 
                id,
                node_id,
                message,
                status,
                DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp
            FROM flood_alerts
            ORDER BY timestamp DESC
            LIMIT {limit}
        """)
        return cursor.fetchall()
        
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()
# ==============================================

@app.route('/api/status')
def status_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if get_db() else "disconnected"
    })

def initialize_database():
    """Create database tables if they don't exist"""
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
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (node_id),
                INDEX (timestamp),
                INDEX (flood_status)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flood_alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                node_id VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('ACTIVE', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (status),
                INDEX (timestamp)
            )
        """)
        
        # ==============================================
        # NEW ADDITION: Create view for dashboard metrics
        # ==============================================
        cursor.execute("""
            CREATE OR REPLACE VIEW dashboard_metrics AS
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
        # ==============================================
        
        conn.commit()
        logger.info("Database tables initialized")
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    initialize_database()
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
