require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'flood_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'flood_detection',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get sensor data with pagination
app.get('/api/sensor-data', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [data] = await pool.query(`
      SELECT 
        id,
        node_id,
        temperature,
        humidity,
        water_level,
        severity,
        flood_status,
        timestamp,
        latitude,
        longitude
      FROM sensor_data
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [count] = await pool.query('SELECT COUNT(*) as total FROM sensor_data');
    
    res.json({
      success: true,
      data,
      pagination: {
        total: count[0].total,
        page,
        limit,
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Report new flood data
app.post('/api/sensor-data', async (req, res) => {
  try {
    const { node_id, temperature, humidity, water_level, severity, flood_status, latitude, longitude } = req.body;
    
    if (!node_id || water_level === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    const [result] = await pool.query(`
      INSERT INTO sensor_data (
        node_id,
        temperature,
        humidity,
        water_level,
        severity,
        flood_status,
        latitude,
        longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        temperature = VALUES(temperature),
        humidity = VALUES(humidity),
        water_level = VALUES(water_level),
        severity = VALUES(severity),
        flood_status = VALUES(flood_status),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        timestamp = CURRENT_TIMESTAMP
    `, [node_id, temperature, humidity, water_level, severity, flood_status, latitude, longitude]);

    res.status(201).json({ 
      success: true,
      data: { id: result.insertId } 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save sensor data' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something broke!' 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});