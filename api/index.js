const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL && !process.env.POSTGRES_URL.includes('localhost') ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
  if (!process.env.POSTGRES_URL) {
    console.log("No POSTGRES_URL provided. Cannot setup Postgres.");
    return;
  }
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT
      );
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title TEXT,
        type TEXT,
        price REAL,
        location TEXT,
        distance TEXT,
        amenities TEXT,
        image TEXT,
        target TEXT,
        "ownerId" TEXT
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        "propertyId" INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        status TEXT,
        date TEXT
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        "propertyId" INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        "userName" TEXT,
        avatar TEXT,
        rating INTEGER,
        text TEXT,
        date TEXT
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title TEXT,
        message TEXT,
        type TEXT,
        read BOOLEAN DEFAULT FALSE
      );
    `);

    const countRes = await client.query('SELECT COUNT(*) as count FROM properties');
    if (parseInt(countRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO properties (title, type, price, location, distance, amenities, image, target, "ownerId")
        VALUES 
        ('Modern Studio Apartment', 'Room', 800, 'Downtown Tech District', '2.5 km', '["WiFi", "AC", "Furnished"]', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', '["Bachelor", "Business User"]', 'me'),
        ('Spacious 3BHK Family Home', 'House', 2500, 'Suburban Hills', '10 km', '["Parking", "Garden", "Security"]', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', '["Family"]', 'me'),
        ('Prime Commercial Shop space', 'Shop', 5000, 'Main Market Square', '1.2 km', '["High Footfall", "Ground Floor", "Water Supply"]', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', '["Business User"]', 'me')
      `);
      await client.query(`
        INSERT INTO notifications (title, message, type, read)
        VALUES ('Welcome!', 'Welcome to Rental Hub.', 'info', false)
      `);
    }
  } finally {
    client.release();
  }
}

// Ensure DB is setup on cold start
setupDatabase().catch(console.error);

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

// AUTH
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, role || 'Tenant']
    );
    res.status(201).json({ success: true, userId: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'User not found' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// PROPERTIES
app.get('/api/properties', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties');
    const properties = result.rows;
    properties.forEach(p => {
      try { p.amenities = JSON.parse(p.amenities); } catch(e) { p.amenities = []; }
      try { p.target = JSON.parse(p.target); } catch(e) { p.target = []; }
    });
    res.json(properties);
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/properties', async (req, res) => {
  try {
    const { title, type, price, location, distance, amenities, image, target, ownerId } = req.body;
    const result = await pool.query(
      'INSERT INTO properties (title, type, price, location, distance, amenities, image, target, "ownerId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, type, price, location, distance, JSON.stringify(amenities || []), image, JSON.stringify(target || []), ownerId || 'me']
    );
    const newProperty = result.rows[0];
    try { newProperty.amenities = JSON.parse(newProperty.amenities); } catch(e) { newProperty.amenities = []; }
    try { newProperty.target = JSON.parse(newProperty.target); } catch(e) { newProperty.target = []; }
    res.json(newProperty);
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/properties/:id', async (req, res) => {
  await pool.query('DELETE FROM properties WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// BOOKINGS
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, 
             p.title as p_title, p.type as p_type, p.price as p_price, 
             p.location as p_location, p.image as p_image, p."ownerId" as p_ownerId
      FROM bookings b
      JOIN properties p ON b."propertyId" = p.id
    `);
    const formatted = result.rows.map(b => ({
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
        ownerId: b.p_ownerid
      }
    }));
    res.json(formatted);
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/bookings', async (req, res) => {
  const { propertyId } = req.body;
  const date = new Date().toLocaleDateString();
  const result = await pool.query(
    'INSERT INTO bookings ("propertyId", status, date) VALUES ($1, $2, $3) RETURNING id',
    [propertyId, 'Pending', date]
  );
  res.json({ success: true, id: result.rows[0].id });
});

app.patch('/api/bookings/:id', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ success: true });
});

// REVIEWS
app.get('/api/reviews', async (req, res) => {
  const result = await pool.query('SELECT * FROM reviews');
  res.json(result.rows);
});

app.post('/api/reviews', async (req, res) => {
  const { propertyId, userName, avatar, rating, text } = req.body;
  const date = new Date().toLocaleDateString();
  const result = await pool.query(
    'INSERT INTO reviews ("propertyId", "userName", avatar, rating, text, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [propertyId, userName, avatar, rating, text, date]
  );
  res.json({ success: true, id: result.rows[0].id });
});

// NOTIFICATIONS
app.get('/api/notifications', async (req, res) => {
  const result = await pool.query('SELECT * FROM notifications ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/notifications', async (req, res) => {
  const { title, message, type } = req.body;
  const result = await pool.query(
    'INSERT INTO notifications (title, message, type, read) VALUES ($1, $2, $3, $4) RETURNING id',
    [title, message, type || 'info', false]
  );
  res.json({ success: true, id: result.rows[0].id });
});

app.patch('/api/notifications/read', async (req, res) => {
  await pool.query('UPDATE notifications SET read = true');
  res.json({ success: true });
});

// Export the app for Vercel Serverless
module.exports = app;
