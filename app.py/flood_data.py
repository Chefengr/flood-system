from flask import Blueprint, request, jsonify
from models import get_db_connection

flood_bp = Blueprint('flood_data', __name__)

@flood_bp.route('/api/flood-data', methods=['POST'])
def receive_data():
    data = request.get_json()
    print("Received Data:", data)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO flood_data 
        (node_id, latitude, longitude, temperature, humidity, water_level, severity, flood_severity)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            data['node_id'],
            data['latitude'],
            data['longitude'],
            data['temperature'],
            data['humidity'],
            data['water_level'],
            data['severity'],
            data['flood_severity']
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success"}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500
