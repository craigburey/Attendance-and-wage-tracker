// server.js
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // parse JSON body

// --- SQLite connection ---
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// --- Initialize tables ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    payType TEXT NOT NULL,
    rate REAL NOT NULL,
    openingBalance REAL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workerId INTEGER NOT NULL,
    weekStart TEXT NOT NULL,
    day INTEGER NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(workerId) REFERENCES workers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workerId INTEGER NOT NULL,
    date TEXT NOT NULL,
    totalOwed REAL NOT NULL,
    paid REAL NOT NULL,
    carried REAL NOT NULL,
    FOREIGN KEY(workerId) REFERENCES workers(id)
  )`);
});

// --- API ROUTES ---

// Get all workers
app.get('/api/workers', (req, res) => {
  db.all('SELECT * FROM workers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add or update worker
app.post('/api/workers', (req, res) => {
  const { id, name, payType, rate, openingBalance } = req.body;
  if (id) {
    // Update existing
    db.run(
      'UPDATE workers SET name=?, payType=?, rate=?, openingBalance=? WHERE id=?',
      [name, payType, rate, openingBalance, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  } else {
    // Insert new
    db.run(
      'INSERT INTO workers (name, payType, rate, openingBalance) VALUES (?,?,?,?)',
      [name, payType, rate, openingBalance],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  }
});

// Get attendance by week
app.get('/api/attendance/:weekStart', (req, res) => {
  const week = req.params.weekStart;
  db.all('SELECT * FROM attendance WHERE weekStart=?', [week], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add or update attendance
app.post('/api/attendance', (req, res) => {
  const { workerId, weekStart, day, status } = req.body;
  // Check if record exists
  db.get(
    'SELECT id FROM attendance WHERE workerId=? AND weekStart=? AND day=?',
    [workerId, weekStart, day],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        // Update
        db.run(
          'UPDATE attendance SET status=? WHERE id=?',
          [status, row.id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
          }
        );
      } else {
        // Insert
        db.run(
          'INSERT INTO attendance (workerId, weekStart, day, status) VALUES (?,?,?,?)',
          [workerId, weekStart, day, status],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
          }
        );
      }
    }
  );
});

// Get payroll history
app.get('/api/payroll', (req, res) => {
  db.all('SELECT * FROM payroll', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add payroll record
app.post('/api/payroll', (req, res) => {
  const { workerId, date, totalOwed, paid, carried } = req.body;
  db.run(
    'INSERT INTO payroll (workerId, date, totalOwed, paid, carried) VALUES (?,?,?,?,?)',
    [workerId, date, totalOwed, paid, carried],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SERVE STATIC FILES FROM 'public' ---
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNECT TO SQLITE ---
const db = new sqlite3.Database('attendance.db', (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to SQLite database');
});

// --- TEST ENDPOINT ---
app.get('/ping', (req, res) => {
  res.send('Server is running!');
});

// --- START SERVER ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
