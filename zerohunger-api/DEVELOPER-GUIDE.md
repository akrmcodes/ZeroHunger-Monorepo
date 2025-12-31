# ZeroHunger API - Developer Guide

This guide will help you set up the ZeroHunger API project from scratch on your local machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Testing the API](#testing-the-api)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following software installed on your computer:

### Project Stack

| Technology | Version Used |
|------------|--------------|
| **Laravel Framework** | 12.x |
| **Laravel Sanctum** | 4.2.x |
| **Spatie Permission** | 6.23.x |

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **PHP** | 8.2 or higher | [php.net/downloads](https://www.php.net/downloads) |
| **Composer** | 2.x | [getcomposer.org](https://getcomposer.org/download/) |
| **MySQL Server** | 8.0+ (or MariaDB 10.3+) | [mysql.com/downloads](https://dev.mysql.com/downloads/mysql/) |
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/downloads) |

### Default Port Numbers

| Service | Default Port | URL |
|---------|--------------|-----|
| **Laravel API** | 8000 | `http://127.0.0.1:8000` |
| **MySQL Server** | 3306 | `127.0.0.1:3306` |
| **Next.js Frontend** | 3000 | `http://localhost:3000` |

### PHP Extensions Required

Make sure these PHP extensions are enabled in your `php.ini` file:

- `pdo_mysql`
- `mbstring`
- `openssl`
- `tokenizer`
- `xml`
- `ctype`
- `json`
- `bcmath`
- `fileinfo`

> [!TIP]
> To check your PHP extensions, run: `php -m`

---

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd laravel_php_p/zerohunger-api
```

### Step 2: Install PHP Dependencies

```bash
composer install
```

### Step 3: Install Node.js Dependencies

```bash
npm install
```

### Step 4: Create Environment File

Copy the example environment file:

```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/macOS
cp .env.example .env
```

### Step 5: Generate Application Key

```bash
php artisan key:generate
```

---

## Environment Configuration

Open the `.env` file and configure the following settings:

### Application Settings

```env
APP_NAME="ZeroHunger API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### Database Configuration

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=zerohunger
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

> [!IMPORTANT]
> **You MUST change `DB_PASSWORD`** to match your MySQL root password. If you have no password, leave it empty.

### Queue Configuration

```env
QUEUE_CONNECTION=database
```

### Mail Configuration (Development)

For development, mail is logged instead of sent:

```env
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_FROM_ADDRESS="noreply@zerohunger.local"
MAIL_FROM_NAME="${APP_NAME}"
```

### Sanctum (API Authentication)

```env
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

> [!NOTE]
> Update `SANCTUM_STATEFUL_DOMAINS` if your frontend runs on a different port.

---

## Database Setup

### Step 1: Create the Database

Open your MySQL client and create the database:

```sql
CREATE DATABASE zerohunger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or using the command line:

```bash
# Windows - Using MySQL CLI
mysql -u root -p -e "CREATE DATABASE zerohunger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 2: Run Migrations

This will create all the database tables:

```bash
php artisan migrate
```

### Step 3: Seed the Database (Optional but Recommended)

This will populate the database with test data:

```bash
php artisan db:seed
```

This creates:
- **Roles**: admin, donor, volunteer, recipient
- **Permissions**: create-donation, view-donation, claim-donation, deliver-donation, manage-users
- **Test Users**:
  | Email | Role | Password |
  |-------|------|----------|
  | admin@test.com | Admin | password |
  | donor@test.com | Donor | password |
  | volunteer@test.com | Volunteer | password |
  | recipient@test.com | Recipient | password |
  | donor2@test.com | Donor | password |
  | volunteer2@test.com | Volunteer | password |
- **Sample Donations**: 8 sample food donation listings

### Fresh Start (Reset Database)

If you want to completely reset and reseed:

```bash
php artisan migrate:fresh --seed
```

> [!CAUTION]
> This will delete ALL existing data in the database!

---

## Running the Application

### Start the Development Server

#### Method 1: Simple PHP Server

```bash
php -S 127.0.0.1:8000 -t public
```

The API will be available at: `http://127.0.0.1:8000`

#### Method 2: Laravel's Artisan Server

```bash
php artisan serve
```

The API will be available at: `http://127.0.0.1:8000`

### Running the Queue Worker

For background jobs (notifications, impact score calculations), run in a separate terminal:

```bash
php artisan queue:work
```

Or to listen and restart automatically:

```bash
php artisan queue:listen
```

---

## Testing the API

### Using Postman

A Postman collection is included in the project:

1. Open Postman
2. Import `postman-collection.json` from the project root
3. Set up environment variables for `base_url` = `http://127.0.0.1:8000`

### Quick API Test

Test if the API is running:

```bash
curl http://127.0.0.1:8000/api/health
```

### Authentication Flow

1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. Use the returned token in the `Authorization: Bearer <token>` header

---

## Troubleshooting

### Common Issues

#### "Class not found" errors

```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

#### Permission errors on storage folder

```bash
# Linux/macOS
chmod -R 775 storage bootstrap/cache
```

#### Database connection refused

1. Make sure MySQL is running
2. Verify credentials in `.env` file
3. Check that the `zerohunger` database exists

#### Sanctum token issues

```bash
php artisan config:clear
php artisan cache:clear
```

---

## What Files Are NOT Included in Git

The following files/folders are excluded from the repository (see `.gitignore`):

| File/Folder | Purpose | Action Required |
|-------------|---------|-----------------|
| `.env` | Environment configuration | Create from `.env.example` |
| `/vendor` | PHP dependencies | Run `composer install` |
| `/node_modules` | Node.js dependencies | Run `npm install` |
| `/storage/*.key` | Encryption keys | Auto-generated |
| `.phpunit.result.cache` | Test cache | Auto-generated |

---

## Project Structure

```
zerohunger-api/
├── app/                    # Application code
│   ├── Http/Controllers/   # API Controllers
│   ├── Models/             # Eloquent Models
│   ├── Notifications/      # Email/Database Notifications
│   └── Jobs/               # Background Jobs
├── config/                 # Configuration files
├── database/
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
├── routes/
│   └── api.php             # API routes
├── storage/                # Logs, cache, etc.
├── .env.example            # Example environment file
└── composer.json           # PHP dependencies
```

---

## Need Help?

- Check the `README-API.md` for API endpoint documentation
- See `API-CONTRACT.md` for detailed API specifications
- Review `PROJECT-OVERVIEW.md` for project architecture

---

**Happy Coding! 🚀**
