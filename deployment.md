# Startup Works — Setup & Deployment Guide (For Developer)

This document explains how to set up, run locally, and deploy the Startup Works
landing page + admin leads dashboard application.

**Stack:** Node.js (Express), MySQL, EJS (server-rendered views), Tailwind CSS

---

## 1. Project Structure

```
emirates-landing/
├── public/            # Static files, Tailwind landing page (index.html)
├── routes/
│   ├── admin.js        # Admin login, dashboard, delete lead (/admin)
│   └── form.js          # Public lead submission API (/api)
├── views/
│   ├── dashboard.ejs     # Admin dashboard (leads list, export)
│   └── login.ejs          # Admin login page
├── db.js               # MySQL connection setup
├── server.js            # App entry point
├── .env.example          # Environment variable template
└── database/
    └── emirates_first.sql  # DB schema/data dump
```

---

## 2. Prerequisites

Install on the server/local machine before starting:

- **Node.js** (v18 or newer recommended) + npm
- **MySQL** (v8 recommended)
- **PM2** (or any process manager) — for running the app persistently
- **Nginx** (if reverse proxy needed) — optional for local run

---

## 3. Local Setup (Run on Developer's Machine)

### Step 1 — Extract project & install dependencies
```bash
cd emirates-landing
npm install
```

### Step 2 — Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in real values:

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host (usually `localhost`) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (`emirates_first`) |
| `SESSION_SECRET` | Any random secret string for session encryption |
| `ADMIN_USERNAME` | Admin panel login username |
| `ADMIN_PASSWORD` | Admin panel login password |
| `PORT` | Port app runs on (e.g. `3000`) |

### Step 3 — Set up the database
```bash
mysql -u root -p -e "CREATE DATABASE emirates_first;"
mysql -u root -p emirates_first < database/emirates_first.sql
```
This creates the database and imports the existing schema + any sample data.

### Step 4 — Run the app locally
```bash
npm start
```
Or directly:
```bash
node server.js
```
- Visit `http://localhost:<PORT>` → landing page
- Visit `http://localhost:<PORT>/admin` → admin login (use `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`)

If this loads correctly, local setup is working.

---

## 4. Production Deployment (On Their Server)

### Step 1 — Transfer project to server
Upload the project folder (excluding `node_modules` and `.env`) to the server via Git, SFTP, or their preferred method.

### Step 2 — Install dependencies on server
```bash
cd emirates-landing
npm install --production
```

### Step 3 — Configure `.env` on the server
Repeat Step 2 from local setup, but with **production** DB credentials and a **strong** admin password (do not reuse local/dev values).

### Step 4 — Import database on server
```bash
mysql -u root -p -e "CREATE DATABASE emirates_first;"
mysql -u root -p emirates_first < database/emirates_first.sql
```

### Step 5 — Run app with a process manager (recommended: PM2)
```bash
npm install -g pm2
pm2 start server.js --name startup-works
pm2 save
pm2 startup   # enables auto-start on server reboot
```

### Step 6 — Set up reverse proxy (Nginx) — if serving on a domain
Example config (`/etc/nginx/sites-available/startupworks`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;   # match PORT from .env
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Then:
```bash
sudo ln -s /etc/nginx/sites-available/startupworks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7 — Point domain DNS
- Add an **A record** pointing the domain to the server's IP
- Wait for DNS propagation (can take a few minutes to a few hours)

### Step 8 — Enable SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 5. Post-Deployment Checklist

- [ ] Landing page loads correctly on the live domain
- [ ] Lead form submits and saves to the database
- [ ] `/admin` login works with production credentials
- [ ] Dashboard shows submitted leads
- [ ] Excel/PDF export works from dashboard
- [ ] SSL certificate active (https:// with no warnings)
- [ ] PM2 process set to auto-restart on server reboot (`pm2 startup` + `pm2 save`)

---

## 6. Notes for the Developer

- The app runs on the port set in `.env` — change this if it conflicts with another app on the server.
- Admin credentials should be changed from any defaults before going live.
- If using a different server panel (cPanel, Plesk, etc.) instead of raw Nginx, the reverse proxy step will differ — the Node app itself doesn't need any changes, only how it's exposed via a domain.