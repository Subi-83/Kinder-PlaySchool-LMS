# Kinder Park Library & Student Membership Management System

A full-stack, enterprise-ready Web Application designed for preschools and reader clubs to manage student enrollments, academic programmes, library book circulation, security deposits, fines, and user permissions.

Built with **Flask (Python)** on the backend, **React + Vite + Tailwind CSS** on the frontend, and **MySQL** for data persistence.

---

## 📖 Table of Contents
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Directory Structure](#-project-directory-structure)
- [Cross-Platform Setup & Installation](#-cross-platform-setup--installation)
  - [Ubuntu / Linux](#ubuntu--linux)
  - [Windows](#windows)
- [Database Setup & Seeding](#-database-setup--seeding)
- [Running the Application](#-running-the-application)
- [Default User Credentials](#-default-user-credentials)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ✨ Key Features

- 🎓 **Student Membership Management**: Track student details, parent contacts, DOB, registration status, programme enrollments, and roll numbers (e.g. `26FLY0001`).
- 📚 **Library Catalog & ISBN Metadata Lookup**: Auto-populate book title, author, and description by scanning or searching ISBN numbers via the Open Library API. Automatic barcode generation for cataloged books.
- 🔄 **Book Circulation (Issue / Return / Renew)**: Flexible issue/return system with automated fine calculation based on overdue days, holiday exclusions, and maximum fine caps.
- 💰 **Deposits & Financial Tracking**: Track membership fees, security deposits, refund status, and fee payment histories.
- 🔐 **Role-Based Access Control (RBAC)**: Fine-grained permission rules distinguishing Administrators from Librarians/Staff users. JWT-based token security.
- 📊 **Reports & Analytics**: Comprehensive reports for active checkouts, overdue books, financial summaries, and student transaction histories.
- 🎨 **Modern Responsive UI**: Clean dashboard interface with dark/light mode toggle, dynamic search filters, modal forms, and notification toasts.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Python 3.10+ & Flask 2.3.3
- **Database ORM**: Flask-SQLAlchemy 3.0.5 & PyMySQL 1.1.0
- **Database Migrations**: Flask-Migrate (Alembic)
- **Authentication**: Flask-JWT-Extended & Bcrypt password hashing
- **CORS & Environment**: Flask-CORS & python-dotenv

### Frontend
- **Framework**: React 18 & Vite 5
- **Styling**: Tailwind CSS & PostCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Router**: React Router v6

### Database
- **Engine**: MySQL 8.0+ / MariaDB 10.4+

---

## 📋 Prerequisites

Before starting, ensure you have installed:
1. **Python**: Python `3.10` or higher ([Download Python](https://www.python.org/downloads/))
2. **Node.js**: Node.js `v18.0.0` or higher and `npm` ([Download Node.js](https://nodejs.org/))
3. **MySQL**: MySQL Server `8.0+` or MariaDB (via MySQL Community Server, XAMPP, or WAMP)

---

## 📂 Project Directory Structure

```text
playschool-main/
├── backend/                  # Flask Backend Application
│   ├── app/                  # Application Package
│   │   ├── middleware/       # Auth & JWT Middleware
│   │   ├── models/           # SQLAlchemy Models (User, Student, Book, Library, etc.)
│   │   ├── routes/           # REST API Blueprints (/api/auth, /api/students, etc.)
│   │   ├── services/         # Business Logic Services
│   │   └── utils/            # Helper functions & validators
│   ├── logs/                 # Rotating application logs
│   ├── backups/              # Database backup directory
│   ├── .env.example          # Environment variables template
│   ├── .env                  # Environment variables file (ignored in git)
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Development server runner script
│   ├── reset_db.py           # Dev utility to drop/recreate DB schema
│   └── seed.py               # Initial seed data generator
├── frontend/                 # React + Vite Frontend Application
│   ├── public/               # Static assets & logos
│   ├── src/                  # Source files
│   │   ├── components/       # UI Components (Navbar, Sidebar, Modals)
│   │   ├── pages/            # View Pages (Dashboard, Students, Books, Circulation, etc.)
│   │   ├── context/          # React Context (AuthContext, ThemeContext)
│   │   └── services/         # API Service client (Axios)
│   ├── package.json          # Frontend Node dependencies & scripts
│   └── vite.config.js        # Vite configuration & API proxy
├── start_lms.sh              # Linux launcher for the combined server
├── start_lms.bat             # Windows launcher for the combined server
├── kinder-park-lms.desktop   # Linux desktop launcher
├── .gitignore                # Project-wide Git ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Cross-Platform Setup & Installation

These steps use the production setup: Flask/Waitress serves both the React
build and the API on port `5000`. Run all commands from the project root unless
the command says otherwise. Keep passwords only in `backend/.env`.

### Ubuntu / Linux

1. Install Python, Node.js, npm, and MySQL:

   ```bash
   sudo apt update
   sudo apt install -y python3 python3-venv python3-pip nodejs npm mysql-server
   sudo systemctl enable --now mysql
   ```

2. Create the environment file and install backend packages:

   ```bash
   cd /path/to/playschool-main
   cp backend/.env.example backend/.env
   python3 -m venv backend/venv
   backend/venv/bin/python -m pip install --upgrade pip
   backend/venv/bin/pip install -r backend/requirements.txt
   ```

3. Install frontend packages and make the production build:

   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. Complete [Database Setup & Seeding](#-database-setup--seeding), then start
   the LMS with `chmod +x start_lms.sh && ./start_lms.sh`.

### Windows

1. Install Python 3.10+ (select **Add Python to PATH**), Node.js 18+, and MySQL
   8 / MySQL Community Server. XAMPP or WAMP MySQL also works.

2. Start MySQL. In an Administrator Command Prompt, this is usually:

   ```cmd
   net start MySQL80
   ```

   If your service uses another name, start it from Windows Services or the
   XAMPP/WAMP control panel.

3. In Command Prompt, prepare the backend:

   ```cmd
   cd C:\path\to\playschool-main
   copy backend\.env.example backend\.env
   python -m venv backend\venv
   backend\venv\Scripts\python.exe -m pip install --upgrade pip
   backend\venv\Scripts\pip.exe install -r backend\requirements.txt
   ```

4. Install frontend packages and make the production build:

   ```cmd
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. Complete [Database Setup & Seeding](#-database-setup--seeding), then run:

   ```cmd
   start_lms.bat
   ```

---

## 🗄️ Database Setup & Seeding

1. **Start MySQL Service**:
   - **Ubuntu**:
     ```bash
     sudo systemctl start mysql
     ```
   - **Windows**:
     ```cmd
     net start MySQL80
     ```
     *(Or start MySQL via XAMPP / WAMP Control Panel)*

2. **Create MySQL Database**:
   Log into MySQL CLI:
   ```sql
   CREATE DATABASE IF NOT EXISTS kinder_park_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Configure Database Credentials**:
   Ensure `backend/.env` contains your local MySQL username and password:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=kinder_park_library
   DB_PORT=3306
   ```

4. **Initialize Schema & Seed Initial Data**:
   This resets the configured LMS database. Use it only for a fresh install or
   when you intentionally want to replace existing LMS data.

   **Linux / Ubuntu**:
   ```bash
   backend/venv/bin/python backend/reset_db.py --yes
   backend/venv/bin/python backend/seed.py
   ```

   **Windows**:
   ```cmd
   backend\venv\Scripts\python.exe backend\reset_db.py --yes
   backend\venv\Scripts\python.exe backend\seed.py
   ```

---

## 🏃 Running the Application

The production deployment uses one server: Waitress runs Flask on port `5000`,
serving both the `/api/*` endpoints and the React build in `frontend/dist`.
React Router routes such as `/login` are returned as `index.html`; an unknown
`/api/*` endpoint remains a JSON 404.

Build the frontend whenever its source changes:

```bash
cd frontend && npm run build
```

After pulling changes into an existing virtual environment, install/update the
backend dependencies once:

```bash
backend/venv/bin/pip install -r backend/requirements.txt
```

On Windows, use:

```cmd
backend\venv\Scripts\pip.exe install -r backend\requirements.txt
```

Then launch the application from the project root:

- **Ubuntu / Linux**:
  ```bash
  chmod +x start_lms.sh
  ./start_lms.sh
  ```

- **Windows (Command Prompt)**:
  ```cmd
  start_lms.bat
  ```

Each launcher activates `backend/venv`, detects the LAN IPv4 address, opens the
default browser, and starts Waitress on `0.0.0.0:5000`. For example, other
devices connected to the same Wi-Fi can use `http://192.168.1.15:5000`.
It also uses that same address in password-reset emails, so recipients can
open their reset link from another device on the network. Configure
`MAIL_USERNAME` and `MAIL_PASSWORD` in `backend/.env` before sending email.
For Gmail, enable 2-Step Verification and use a Google App Password:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

### Linux desktop launcher

`kinder-park-lms.desktop` is configured for this checked-out project location.
Double-click it in a file manager, or install it in the application menu:

```bash
chmod +x kinder-park-lms.desktop
cp kinder-park-lms.desktop ~/.local/share/applications/
```

If the project is moved, update the `Exec=` and `Icon=` paths in that file
before installing it.

### Firewall commands for LAN access

- **Ubuntu / UFW**:
  ```bash
  sudo ufw allow 5000/tcp
  sudo ufw status
  ```

- **Windows (run Command Prompt as Administrator)**:
  ```cmd
  netsh advfirewall firewall add rule name="Kinder Park LMS (TCP 5000)" dir=in action=allow protocol=TCP localport=5000
  netsh advfirewall firewall show rule name="Kinder Park LMS (TCP 5000)"
  ```

---

## 🔑 Default User Credentials

After running `seed.py`, the system is initialized with two default accounts:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access to settings, user management, reports, & audit logs |
| **Staff / Librarian** | `staff` | `staff123` | Access to student records, book catalog, & circulation checkout/return |

---

## ⚙️ Environment Variables Configuration

The `backend/.env` file controls system settings:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `FLASK_ENV` | `development` | Environment mode (`development` or `production`) |
| `SECRET_KEY` | `dev-secret-key...` | Secret key for session encryption |
| `DB_HOST` | `localhost` | Database host address |
| `DB_USER` | `root` | Database user name |
| `DB_PASSWORD` | *(empty)* | Database password |
| `DB_NAME` | `kinder_park_library` | Target database schema name |
| `DB_PORT` | `3306` | MySQL port number |
| `JWT_SECRET_KEY` | *(random string)* | Secret key for JWT signing |
| `CORS_ORIGINS` | Development origins | Allowed frontend origin URLs |
| `FRONTEND_URL` | `http://localhost:5000` | Public LMS URL used in reset emails; launchers set the LAN IP automatically |
| `MAIL_USERNAME` | *(empty)* | SMTP account used to send password-reset emails |
| `MAIL_PASSWORD` | *(empty)* | SMTP password or Gmail App Password |
| `OPEN_LIBRARY_API_URL` | `https://openlibrary.org/api/books` | External API for book metadata lookup |

---

## ❓ Troubleshooting & FAQs

### 1. `Can't connect to MySQL server on 'localhost'`
- **Cause**: The MySQL service is stopped or port `3306` is blocked.
- **Fix (Ubuntu)**: `sudo systemctl status mysql` then `sudo systemctl start mysql`.
- **Fix (Windows)**: Run `net start MySQL80` in Administrator Command Prompt or check XAMPP control panel.

### 2. Windows PowerShell Execution Policy Error: `script cannot be loaded because running scripts is disabled`
- **Cause**: PowerShell restricts unverified `.ps1` or activation scripts by default.
- **Fix**: Open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### 3. Ubuntu: `No module named venv`
- **Cause**: Python `venv` package is not installed by default on some Ubuntu distributions.
- **Fix**: Run `sudo apt update && sudo apt install python3-venv python3-pip`.

### 4. Database schema out of sync or migration errors
- **Fix**: Run `python reset_db.py --yes` followed by `python seed.py` inside the `backend` virtual environment to recreate clean database tables.

---

## 📄 License

This project is created for **Kinder Park Preschool & Readers Library**. All rights reserved.
# Kinder-PlaySchool-LMS
