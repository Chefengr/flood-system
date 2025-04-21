-- Enable strict mode
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Create database
CREATE DATABASE IF NOT EXISTS flood_detection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE flood_detection;

-- Sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2) COMMENT 'Temperature in Celsius',
    humidity DECIMAL(5,2) COMMENT 'Relative humidity percentage',
    water_level DECIMAL(5,2) NOT NULL COMMENT 'Water level in centimeters',
    severity ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE') NOT NULL DEFAULT 'LOW',
    flood_status VARCHAR(50) COMMENT 'Current flood status',
    latitude DECIMAL(10, 8) COMMENT 'GPS latitude',
    longitude DECIMAL(11, 8) COMMENT 'GPS longitude',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_node_id (node_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity),
    CONSTRAINT uc_node_id UNIQUE (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensor nodes metadata
CREATE TABLE IF NOT EXISTS sensor_nodes (
    node_id VARCHAR(50) PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL,
    installation_date DATE NOT NULL,
    last_maintenance DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    FOREIGN KEY (node_id) REFERENCES sensor_data(node_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flood alerts history
CREATE TABLE IF NOT EXISTS flood_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL,
    alert_level ENUM('WARNING', 'SEVERE', 'CRITICAL') NOT NULL,
    alert_message TEXT,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (node_id) REFERENCES sensor_data(node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data
INSERT INTO sensor_data (
    node_id, temperature, humidity, water_level, severity, flood_status, latitude, longitude
) VALUES 
    ('SENSOR_001', 28.5, 78.2, 15.0, 'LOW', 'NORMAL', 14.343512, 121.083612),
    ('SENSOR_002', 27.8, 82.5, 45.0, 'MODERATE', 'WARNING', 14.345000, 121.085000),
    ('SENSOR_003', 29.1, 75.8, 65.0, 'HIGH', 'FLOODING', 14.340000, 121.090000);