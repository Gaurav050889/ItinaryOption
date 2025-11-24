const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'itinerary.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      destinations TEXT NOT NULL,
      budget REAL NOT NULL,
      days INTEGER NOT NULL,
      food_preferences TEXT,
      stay_preferences TEXT,
      sightseeing TEXT,
      permissions TEXT,
      special_requests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Database table ready');
      }
    });
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Submit itinerary request
app.post('/api/itinerary', (req, res) => {
  const {
    name,
    email,
    phone,
    destinations,
    budget,
    days,
    foodPreferences,
    stayPreferences,
    sightseeing,
    permissions,
    specialRequests
  } = req.body;

  // Validation
  if (!name || !email || !destinations || !budget || !days) {
    return res.status(400).json({
      error: 'Missing required fields: name, email, destinations, budget, and days are required'
    });
  }

  const sql = `INSERT INTO itineraries 
    (name, email, phone, destinations, budget, days, food_preferences, stay_preferences, sightseeing, permissions, special_requests)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    name,
    email,
    phone || null,
    Array.isArray(destinations) ? destinations.join(', ') : destinations,
    budget,
    days,
    foodPreferences || null,
    stayPreferences || null,
    sightseeing || null,
    permissions || null,
    specialRequests || null
  ], function(err) {
    if (err) {
      console.error('Error inserting itinerary:', err.message);
      return res.status(500).json({ error: 'Failed to save itinerary request' });
    }
    res.json({
      success: true,
      message: 'Itinerary request submitted successfully',
      id: this.lastID
    });
  });
});

// Get all itineraries (for admin/viewing purposes)
app.get('/api/itineraries', (req, res) => {
  db.all('SELECT * FROM itineraries ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching itineraries:', err.message);
      return res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
    res.json(rows);
  });
});

// Get single itinerary by ID
app.get('/api/itinerary/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM itineraries WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching itinerary:', err.message);
      return res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    res.json(row);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

