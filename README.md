# Textit
TextIT - Real-Time Chat Application
TextIT is a real-time chat web application built using Node.js, Express, Socket.IO, SQLite, and Tailwind CSS. It supports user registration, secure login with hashed passwords, real-time messaging, dark mode toggle, and responsive UI inspired by Discord’s look and feel.

Features
User Authentication
Secure registration and login with bcrypt password hashing stored in SQLite database.

Real-Time Chat
Private messaging between online users powered by Socket.IO.

User Presence
Displays a live list of online users.

Dark Mode
Toggle between light and dark themes with user preference saved in localStorage.

Responsive Design
Clean, minimal UI with Tailwind CSS, optimized for desktop and mobile.

SQLite Database
Lightweight and fast local database for storing users and messages.

Technologies Used
Backend: Node.js, Express, Socket.IO, bcrypt, better-sqlite3

Frontend: HTML, CSS, Tailwind CSS, JavaScript

Database: SQLite

Deployment: Local server (can be deployed on platforms like Render)

Project Structure
bash
Copy
Edit
/public
  ├── index.html          # Login page
  ├── register.html       # Registration page
  ├── mainpage.html       # Chat interface
  ├── script.js           # JS for login/register page (dark mode + auth)
  ├── chat.js             # JS for chat UI + socket client
/server.js                # Backend server with API and socket handling
/textit.db                # SQLite database file (auto-generated)
