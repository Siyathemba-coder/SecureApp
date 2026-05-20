# SecureApp — Full Stack Setup Guide
# Node.js + Express + MySQL + Groq AI + React

## What You Need Installed First
- Node.js (v18+)  → https://nodejs.org
- MySQL (v8+)     → https://dev.mysql.com/downloads/mysql/
- A Groq API key  → https://console.groq.com 

---

## STEP 1 — Create the MySQL Database

Open MySQL Workbench or your terminal and run:

    mysql -u root -p

Then inside MySQL:

    source /path/to/secureapp/backend/db/schema.sql

This creates the `secureapp` database, both tables, and seeds 3 demo users.

---

## STEP 2 — Configure the Backend

    cd backend
    cp .env.example .env

Open `.env` and fill in your values
---

## STEP 3 — Install & Start the Backend

    cd backend
    npm install
    npm run dev

You should see:
     MySQL connected: localhost:3306 → secureapp
     Server running on http://localhost:5000

---

## STEP 4 — Install & Start the Frontend

Open a NEW terminal tab:

    cd frontend
    npm install
    npm run dev

You should see:
    - Local: http://localhost:5173

---

## STEP 5 — Open the App

Go to: http://localhost:5173

Use the demo accounts (already in MySQL from the seed):
    admin  / Admin@123   → full access
    editor / Edit@123    → chat + content editor
    viewer / View@123    → chat + dashboard only

Or click "Sign up" to create your own account.

---

## Project Structure

    secureapp/
    ├── backend/
    │   ├── config/
    │   │   └── db.js            ← MySQL connection pool
    │   ├── db/
    │   │   └── schema.sql       ← Run this once to create tables
    │   ├── middleware/
    │   │   └── auth.js          ← JWT verify + role check
    │   ├── routes/
    │   │   ├── auth.js          ← POST /api/auth/login  signup
    │   │   ├── chat.js          ← POST /api/chat/message (calls Groq)
    │   │   └── users.js         ← GET/PATCH/DELETE /api/users
    │   ├── server.js            ← Express entry point       
    │   └── package.json
    │
    └── frontend/
        ├── src/
        │   ├── App.jsx          ← Full React app
        │   └── main.jsx         ← Entry point
        ├── index.html
        ├── vite.config.js       ← Proxies /api → backend
        └── package.json

---

## API Endpoints

    POST   /api/auth/signup        Register new user
    POST   /api/auth/login         Login, returns JWT
    GET    /api/auth/me            Get current user (protected)

    GET    /api/chat/history       Load chat history from MySQL
    POST   /api/chat/message       Send message → Groq → save to MySQL
    DELETE /api/chat/history       Clear your chat history

    GET    /api/users              List all users (admin only)
    PATCH  /api/users/:id/role     Change user role (admin only)
    DELETE /api/users/:id          Delete user (admin only)
    GET    /api/users/profile      Your profile

---
@Siyathemba Msimang
