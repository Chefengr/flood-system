import psycopg2
import os

# Use your actual Render PostgreSQL URL or your environment-configured values
DATABASE_URL = 'postgresql://chefengr:YCREdgJEa9HTb2dTQa7ehDbbveTDLK19@dpg-d098h4adbo4c73buoe7g-a/flood_system'
# Connect to the PostgreSQL database
conn = psycopg2.connect(DATABASE_URL)

# Create a cursor object
cur = conn.cursor()

# Create the table
create_table_query = """
CREATE TABLE IF NOT EXISTS device_data (
    id SERIAL PRIMARY KEY,
    temperature REAL,
    humidity REAL,
    water_level REAL,
    severity VARCHAR(20),
    status VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

try:
    cur.execute(create_table_query)
    conn.commit()
    print("✅ Table 'device_data' created successfully!")
except Exception as e:
    print("❌ Failed to create table:", e)
finally:
    cur.close()
    conn.close()
