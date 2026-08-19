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
  - [Automated Setup (Recommended)](#1-automated-setup-recommended)
  - [Manual Setup Guide](#2-manual-setup-guide)
    - [Ubuntu / Linux Setup](#ubuntu--linux-setup)
    - [Windows Setup](#windows-setup)
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
1. **Python**: Python `3.8` or higher ([Download Python](https://www.python.org/downloads/))
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
├── kinder_park_library.sql   # SQL database export dump
├── setup.sh                  # Automated setup script for Ubuntu / Linux / macOS
├── setup.bat                 # Automated setup script for Windows
├── .gitignore                # Project-wide Git ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Cross-Platform Setup & Installation

Follow these instructions to set up the project on either **Ubuntu (Linux)** or **Windows**.

### 1. Automated Setup (Recommended)

#### 🐧 On Ubuntu / Linux / macOS
Open terminal in the project root folder:
```bash
chmod +x setup.sh
./setup.sh
```

#### 🪟 On Windows
Double-click `setup.bat` or run it in Command Prompt:
```cmd
setup.bat
```

---

### 2. Manual Setup Guide

If you prefer to configure manually or run individual steps:

#### Ubuntu / Linux Setup

1. **Clone or navigate to project directory**:
   ```bash
   cd playschool-main
   ```

2. **Backend Setup**:
   ```bash
   # Copy environment file template
   cp backend/.env.example backend/.env

   # Move to backend directory
   cd backend

   # Create virtual environment (install python3-venv if needed: sudo apt install python3-venv)
   python3 -m venv venv

   # Activate virtual environment
   source venv/bin/activate

   # Install dependencies
   pip install --upgrade pip
   pip install -r requirements.txt

   # Return to root directory
   cd ..
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

#### Windows Setup

1. **Open Command Prompt (cmd) or PowerShell** in the project root directory:
   ```cmd
   cd path\to\playschool-main
   ```

2. **Backend Setup**:
   ```cmd
   REM Copy environment file template
   copy backend\.env.example backend\.env

   REM Move to backend directory
   cd backend

   REM Create virtual environment
   python -m venv venv

   REM Activate virtual environment (Command Prompt)
   venv\Scripts\activate.bat

   REM OR if using PowerShell:
   REM .\venv\Scripts\Activate.ps1

   REM Install dependencies
   python -m pip install --upgrade pip
   pip install -r requirements.txt

   REM Return to root directory
   cd ..
   ```

3. **Frontend Setup**:
   ```cmd
   cd frontend
   npm install
   cd ..
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
   Run the database reset and seeding script from the `backend/` folder:

   **Linux / Ubuntu**:
   ```bash
   cd backend
   source venv/bin/activate
   python reset_db.py --yes
   python seed.py
   ```

   **Windows**:
   ```cmd
   cd backend
   venv\Scripts\activate.bat
   python reset_db.py --yes
   python seed.py
   ```

   *Alternatively, you can import `kinder_park_library.sql` directly using MySQL CLI or phpMyAdmin:*
   ```bash
   mysql -u root -p kinder_park_library < kinder_park_library.sql
   ```

---

## 🏃 Running the Application

Both backend and frontend servers need to run simultaneously.

### Step 1: Start Backend (Port 5000)

- **Ubuntu / Linux**:
  ```bash
  cd backend
  source venv/bin/activate
  python run.py
  ```

- **Windows**:
  ```cmd
  cd backend
  venv\Scripts\activate.bat
  python run.py
  ```

The API server will run at: `http://localhost:5000`

### Step 2: Start Frontend (Port 5173)

Open a new terminal window / prompt:

- **Ubuntu / Linux & Windows**:
  ```bash
  cd frontend
  npm run dev
  ```

The Web Application UI will be available at: `http://localhost:5173`

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
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origin URLs |
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
