const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve your HTML/JS/CSS
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// --- Initialize SQLite ---
const db = new sqlite3.Database('./attendance.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// --- Create tables ---
db.serialize(() => {
  // Workers
  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pay_type TEXT NOT NULL,
      rate REAL NOT NULL,
      opening_balance REAL DEFAULT 0
    )
  `);

  // Attendance (one row per worker per week)
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      mon TEXT DEFAULT 'Absent',
      tue TEXT DEFAULT 'Absent',
      wed TEXT DEFAULT 'Absent',
      thu TEXT DEFAULT 'Absent',
      fri TEXT DEFAULT 'Absent',
      sat TEXT DEFAULT 'Absent',
      sun TEXT DEFAULT 'Absent',
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    )
  `);

  // Payroll history
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      total_owed REAL,
      paid REAL,
      carried REAL,
      deductions REAL,
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    )
  `);
});
