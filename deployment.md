# Fitness Extreme International — Setup & Deployment Guide

This guide covers local setup and production deployment for the `gym_hydrabad`
project: the Fitness Extreme International gym website for Banjara Hills,
Hyderabad, and its lead enquiry/admin dashboard.

## 1. Application overview

- **Runtime:** Node.js and Express
- **Database:** MySQL, accessed through `mysql2`
- **Website:** Static files in `public/`; the landing page is `public/index.html`
- **Admin UI:** EJS templates in `views/`
- **Lead API:** `POST /api/submit`
- **Admin:** `/admin` (login, lead dashboard, and Excel/PDF export)
- **Default port:** `2000` (override with `PORT`)

### Project structure

```text
gym_hydrabad/
├── database/
│   └── schema.sql       # Creates the leads database and table
├── public/
│   ├── index.html       # Public gym landing page
│   └── img/             # Website images and logo
├── routes/
│   ├── admin.js         # Admin login and lead dashboard routes
│   └── form.js          # Public lead submission API
├── views/
│   ├── dashboard.ejs    # Leads dashboard and exports
│   └── login.ejs        # Admin login page
├── db.js                # MySQL connection pool
├── server.js            # Express application entry point
├── package.json
└── package-lock.json
```

## 2. Prerequisites

- Node.js 18 or newer and npm
- MySQL 8 recommended
- For production: a process manager such as PM2 and, when hosting on a domain,
  a reverse proxy such as Nginx with HTTPS

## 3. Local setup

### Install dependencies

From the project directory:

```bash
npm install
```

### Configure environment variables

There is no `.env.example` in this repository. Create a private `.env` file in
the project root with the following values:

```dotenv
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=emirates_first
SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_USERNAME=choose_an_admin_username
ADMIN_PASSWORD=choose_a_strong_admin_password
PORT=2000
```

Do not commit `.env` or use development credentials in production. `.env` is
excluded by `.gitignore`.

**Database name note:** `database/schema.sql` currently creates and selects a
database named `emirates_first`. Set `DB_NAME` to that value unless you also
update the schema to use a different database name.

### Create the database and leads table

Run this from the project directory in a Bash-compatible shell with MySQL
available:

```bash
mysql -u root -p < database/schema.sql
```

The schema creates the database if it does not exist and creates the `leads`
table. If using a restricted MySQL account, grant it access to the database
before starting the app.

### Start and open the application

The project does not define an `npm start` script. Start it with:

```bash
node server.js
```

- Website: `http://localhost:2000` (or the configured `PORT`)
- Admin login: `http://localhost:2000/admin`
- Lead submission endpoint: `POST http://localhost:2000/api/submit`

Sign in using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` values from `.env`.

## 4. Production deployment

The following example assumes a Linux server, a domain, MySQL, and Nginx.

### Transfer the project

Deploy the project files using Git or another secure transfer method. Do not
deploy `.env` or `node_modules`.

### Install dependencies and configure the server

```bash
cd gym_hydrabad
npm ci --omit=dev
```

Create `.env` on the server with production database credentials, a unique
long `SESSION_SECRET`, strong admin credentials, and the chosen `PORT`.
`DB_NAME` must match the database name in `database/schema.sql`.

### Initialize MySQL

For a new installation, run from the project directory:

```bash
mysql -u root -p < database/schema.sql
```

For an existing installation, back up the database before applying schema
changes. The current schema creates the `leads` table if it does not already
exist; it does not replace existing lead data.

### Configure production sessions before going live

`server.js` currently uses Express's default in-memory session store and sets
the session cookie's `secure` option to `false`. These defaults are suitable
only for local development. For a public HTTPS deployment, configure a
persistent session store and enable secure cookies before exposing the admin
login.

### Run the application with PM2

Install PM2 on the server if needed, then start and persist the process:

```bash
npm install -g pm2
pm2 start server.js --name gym-hydrabad
pm2 save
pm2 startup
```

Run the `pm2 startup` command printed by PM2 to enable startup after a reboot.
Confirm the app is running with `pm2 status` and review logs with
`pm2 logs gym-hydrabad`.

### Configure Nginx

Example site configuration (replace `yourdomain.com` and the port as needed):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:2000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site, test the Nginx configuration, and reload Nginx using your
server's standard procedure.

### Point DNS and enable HTTPS

1. Point the domain's DNS A record to the server's public IP address.
2. Verify the domain resolves to that server.
3. Install Certbot and its Nginx plugin using your Linux distribution's
   package manager.
4. Request and configure the certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 5. Deployment checks

- [ ] The gym landing page loads over HTTPS.
- [ ] The enquiry form submits and the lead is saved in MySQL.
- [ ] `/admin` displays the login page and accepts the configured credentials.
- [ ] The dashboard displays submitted leads.
- [ ] Excel and PDF exports work in the dashboard.
- [ ] The production session store and secure cookie settings are configured.
- [ ] PM2 starts the application after a server reboot.
- [ ] `.env` and database credentials are not publicly accessible.

## 6. Operational notes

- The application listens on `PORT`, defaulting to `2000`.
- The website uses Tailwind CSS and fonts from CDNs; those assets require
  outbound access from the visitor's browser.
- The form stores the visitor's name, email, phone number, and message in the
  MySQL `leads` table.
- Admin credentials are read from environment variables. Keep them private and
  replace them if they are exposed.
- If hosting through cPanel, Plesk, or another control panel, configure its
  Node.js application and reverse proxy settings to use this project's
  `server.js` entry point and the selected port.
