import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const db = new sqlite3('textit.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Tables ---
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT,
    to_user TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// --- Routes ---

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.json({ success: false, message: 'User not found' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  
  if (isMatch) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid password' });
  }
});

// REGISTER
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: 'Username and password are required.' });
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.json({ success: false, message: 'Username already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);

  res.json({ success: true, message: 'User registered successfully.' });
});

// GET MESSAGES
app.get('/api/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY timestamp ASC').all();
  res.json(messages);
});

// POST MESSAGE
app.post('/api/messages', (req, res) => {
  const { from, to, text } = req.body;
  db.prepare('INSERT INTO messages (from_user, to_user, text) VALUES (?, ?, ?)').run(from, to, text);
  res.json({ success: true });
});

// --- Socket.io ---
let onlineUsers = new Map();

io.on('connection', (socket) => {
  const username = socket.handshake.query.username;
  if (!username) return;

  onlineUsers.set(username, socket.id);
  io.emit('user-list', Array.from(onlineUsers.keys()));

  socket.on('disconnect', () => {
    onlineUsers.delete(username);
    io.emit('user-list', Array.from(onlineUsers.keys()));
  });

  socket.on('private-message', ({ from, to, text }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('receive-message', {
        from,
        text,
        time: new Date().toISOString(),
      });
    }
  });

  socket.on('typing', ({ from, to }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('typing', from);
    }
  });
});

// --- Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
