const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_jwt_key_123';


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads

let db;

async function setupDatabase() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      type TEXT,
      price REAL,
      location TEXT,
      distance TEXT,
      amenities TEXT,
      image TEXT,
      target TEXT,
      ownerId TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      propertyId INTEGER,
      status TEXT,
      date TEXT,
      FOREIGN KEY(propertyId) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      propertyId INTEGER,
      userName TEXT,
      avatar TEXT,
      rating INTEGER,
      text TEXT,
      date TEXT,
      FOREIGN KEY(propertyId) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      type TEXT,
      read BOOLEAN
    );
  `);

  // Seed data if empty
  const count = await db.get('SELECT COUNT(*) as count FROM properties');
  if (count.count === 0) {
    await db.run(`
      INSERT INTO properties (title, type, price, location, distance, amenities, image, target, ownerId)
      VALUES 
      ('Modern Studio Apartment', 'Room', 800, 'Downtown Tech District', '2.5 km', '["WiFi", "AC", "Furnished"]', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', '["Bachelor", "Business User"]', 'me'),
      ('Spacious 3BHK Family Home', 'House', 2500, 'Suburban Hills', '10 km', '["Parking", "Garden", "Security"]', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', '["Family"]', 'me'),
      ('Prime Commercial Shop space', 'Shop', 5000, 'Main Market Square', '1.2 km', '["High Footfall", "Ground Floor", "Water Supply"]', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', '["Business User"]', 'me')
    `);

    await db.run(`
      INSERT INTO notifications (title, message, type, read)
      VALUES ('Welcome!', 'Welcome to Rental Hub.', 'info', 0)
    `);
  }
}

// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ================= API ENDPOINTS =================

// AUTH
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'Tenant']
    );
    res.status(201).json({ success: true, userId: result.lastID });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// PROPERTIES
app.get('/api/properties', async (req, res) => {
  const properties = await db.all('SELECT * FROM properties');
  // Parse JSON strings back to arrays
  properties.forEach(p => {
    try { p.amenities = JSON.parse(p.amenities); } catch(e) { p.amenities = []; }
    try { p.target = JSON.parse(p.target); } catch(e) { p.target = []; }
  });
  res.json(properties);
});

app.post('/api/properties', async (req, res) => {
  const { title, type, price, location, distance, amenities, image, target, ownerId } = req.body;
  const result = await db.run(
    'INSERT INTO properties (title, type, price, location, distance, amenities, image, target, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, type, price, location, distance, JSON.stringify(amenities || []), image, JSON.stringify(target || []), ownerId || 'me']
  );
  
  const newProperty = await db.get('SELECT * FROM properties WHERE id = ?', result.lastID);
  try { newProperty.amenities = JSON.parse(newProperty.amenities); } catch(e) { newProperty.amenities = []; }
  try { newProperty.target = JSON.parse(newProperty.target); } catch(e) { newProperty.target = []; }
  
  res.json(newProperty);
});

app.delete('/api/properties/:id', async (req, res) => {
  await db.run('DELETE FROM properties WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// BOOKINGS
app.get('/api/bookings', async (req, res) => {
  // Join with properties table
  const bookings = await db.all(`
    SELECT b.*, 
           p.title as p_title, p.type as p_type, p.price as p_price, 
           p.location as p_location, p.image as p_image, p.ownerId as p_ownerId
    FROM bookings b
    JOIN properties p ON b.propertyId = p.id
  `);
  
  // Format nested property object
  const formatted = bookings.map(b => ({
    id: b.id,
    status: b.status,
    date: b.date,
    property: {
      id: b.propertyId,
      title: b.p_title,
      type: b.p_type,
      price: b.p_price,
      location: b.p_location,
      image: b.p_image,
      ownerId: b.p_ownerId
    }
  }));
  res.json(formatted);
});

app.post('/api/bookings', async (req, res) => {
  const { propertyId } = req.body;
  const date = new Date().toLocaleDateString();
  const result = await db.run(
    'INSERT INTO bookings (propertyId, status, date) VALUES (?, ?, ?)',
    [propertyId, 'Pending', date]
  );
  res.json({ success: true, id: result.lastID });
});

app.patch('/api/bookings/:id', async (req, res) => {
  const { status } = req.body;
  await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true });
});

// REVIEWS
app.get('/api/reviews', async (req, res) => {
  const reviews = await db.all('SELECT * FROM reviews');
  res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
  const { propertyId, userName, avatar, rating, text } = req.body;
  const date = new Date().toLocaleDateString();
  const result = await db.run(
    'INSERT INTO reviews (propertyId, userName, avatar, rating, text, date) VALUES (?, ?, ?, ?, ?, ?)',
    [propertyId, userName, avatar, rating, text, date]
  );
  res.json({ success: true, id: result.lastID });
});

// NOTIFICATIONS
app.get('/api/notifications', async (req, res) => {
  const notifications = await db.all('SELECT * FROM notifications ORDER BY id DESC');
  // convert sqlite 1/0 to true/false
  notifications.forEach(n => n.read = n.read === 1);
  res.json(notifications);
});

app.post('/api/notifications', async (req, res) => {
  const { title, message, type } = req.body;
  const result = await db.run(
    'INSERT INTO notifications (title, message, type, read) VALUES (?, ?, ?, ?)',
    [title, message, type || 'info', 0]
  );
  res.json({ success: true, id: result.lastID });
});

app.patch('/api/notifications/read', async (req, res) => {
  await db.run('UPDATE notifications SET read = 1');
  res.json({ success: true });
});

// INIT
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server", err);
});
