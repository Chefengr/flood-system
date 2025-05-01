import psycopg2
import os

# Get the PostgreSQL URL from the environment variable
DATABASE_URL = os.getenv('DATABASE_URL')

# If the DATABASE_URL environment variable is not set, raise an error
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL environment variable not set. Please set it with your PostgreSQL URL.")

# Connect to the PostgreSQL database
try:
    conn = psycopg2.connect(DATABASE_URL)
    print("✅ Connected to the database successfully!")

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

    # Try to create the table
    try:
        cur.execute(create_table_query)
        conn.commit()
        print("✅ Table 'device_data' created successfully!")
    except Exception as e:
        print("❌ Failed to create table:", e)

finally:
    if conn:
        cur.close()
        conn.close()
        print("✅ Database connection closed.")
