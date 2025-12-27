# ZeroHunger API - Database Schema Documentation

This document provides complete database schema information to recreate the identical database structure.

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables Reference](#tables-reference)
4. [SQL Schema (Full Recreation)](#sql-schema-full-recreation)
5. [Sample Data (Seeders)](#sample-data-seeders)

---

## Overview

| Database | Engine | Charset | Collation |
|----------|--------|---------|-----------|
| zerohunger | InnoDB | utf8mb4 | utf8mb4_unicode_ci |

### Tables Summary

| Table | Purpose |
|-------|---------|
| `users` | User accounts (donors, volunteers, recipients, admins) |
| `password_reset_tokens` | Password reset tokens |
| `sessions` | User sessions for web authentication |
| `personal_access_tokens` | Laravel Sanctum API tokens |
| `donations` | Food donation listings |
| `claims` | Volunteer claims on donations |
| `notifications` | In-app notifications |
| `roles` | Spatie permission roles |
| `permissions` | Spatie permissions |
| `model_has_roles` | User-role pivot table |
| `model_has_permissions` | User-permission pivot table |
| `role_has_permissions` | Role-permission pivot table |
| `cache` | Database cache storage |
| `cache_locks` | Cache lock management |
| `jobs` | Queue jobs |
| `job_batches` | Job batches |
| `failed_jobs` | Failed queue jobs |
| `migrations` | Laravel migration tracking |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ donations : "creates (donor_id)"
    users ||--o{ claims : "claims (volunteer_id)"
    users ||--o{ notifications : "receives"
    users ||--o{ personal_access_tokens : "has"
    users ||--o{ sessions : "has"
    users ||--o{ model_has_roles : "assigned"
    donations ||--o| claims : "has"
    roles ||--o{ model_has_roles : "assigned_to"
    roles ||--o{ role_has_permissions : "has"
    permissions ||--o{ role_has_permissions : "granted_to"

    users {
        bigint id PK
        string name
        string email UK
        timestamp email_verified_at
        string password
        string phone
        decimal latitude
        decimal longitude
        int impact_score
        enum status
        string remember_token
        timestamp created_at
        timestamp updated_at
    }

    donations {
        bigint id PK
        bigint donor_id FK
        string title
        text description
        decimal quantity_kg
        enum status
        string pickup_code
        string delivery_code
        decimal latitude
        decimal longitude
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    claims {
        bigint id PK
        bigint donation_id FK_UK
        bigint volunteer_id FK
        enum status
        timestamp picked_up_at
        timestamp delivered_at
        text notes
        timestamp created_at
        timestamp updated_at
    }

    roles {
        bigint id PK
        string name
        string guard_name
        timestamp created_at
        timestamp updated_at
    }

    permissions {
        bigint id PK
        string name
        string guard_name
        timestamp created_at
        timestamp updated_at
    }
```

---

## Tables Reference

### 1. `users` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `name` | VARCHAR(255) | NO | - | User's full name |
| `email` | VARCHAR(255) | NO | - | Unique email address |
| `email_verified_at` | TIMESTAMP | YES | NULL | Email verification timestamp |
| `password` | VARCHAR(255) | NO | - | Bcrypt hashed password |
| `phone` | VARCHAR(255) | YES | NULL | Phone number |
| `latitude` | DECIMAL(10,7) | YES | NULL | User location latitude |
| `longitude` | DECIMAL(10,7) | YES | NULL | User location longitude |
| `impact_score` | INT | NO | 0 | Gamification score |
| `status` | ENUM('active','inactive','suspended') | NO | 'active' | Account status |
| `remember_token` | VARCHAR(100) | YES | NULL | Session remember token |
| `created_at` | TIMESTAMP | YES | NULL | Record creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Record update time |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`email`)
- INDEX (`email`)
- INDEX (`status`)

---

### 2. `password_reset_tokens` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `email` | VARCHAR(255) | NO | - | Primary Key, email address |
| `token` | VARCHAR(255) | NO | - | Reset token |
| `created_at` | TIMESTAMP | YES | NULL | Token creation time |

**Indexes:**
- PRIMARY KEY (`email`)

---

### 3. `sessions` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(255) | NO | - | Primary Key, session ID |
| `user_id` | BIGINT UNSIGNED | YES | NULL | Foreign Key to users |
| `ip_address` | VARCHAR(45) | YES | NULL | Client IP address |
| `user_agent` | TEXT | YES | NULL | Browser user agent |
| `payload` | LONGTEXT | NO | - | Session data |
| `last_activity` | INT | NO | - | Last activity timestamp |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`last_activity`)

---

### 4. `personal_access_tokens` Table (Sanctum)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `tokenable_type` | VARCHAR(255) | NO | - | Polymorphic model type |
| `tokenable_id` | BIGINT UNSIGNED | NO | - | Polymorphic model ID |
| `name` | TEXT | NO | - | Token name |
| `token` | VARCHAR(64) | NO | - | Hashed token (unique) |
| `abilities` | TEXT | YES | NULL | Token abilities (JSON) |
| `last_used_at` | TIMESTAMP | YES | NULL | Last usage time |
| `expires_at` | TIMESTAMP | YES | NULL | Token expiration |
| `created_at` | TIMESTAMP | YES | NULL | Creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Update time |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`token`)
- INDEX (`tokenable_type`, `tokenable_id`)
- INDEX (`expires_at`)

---

### 5. `donations` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `donor_id` | BIGINT UNSIGNED | NO | - | FK to users (donor) |
| `title` | VARCHAR(255) | NO | - | Donation title |
| `description` | TEXT | YES | NULL | Detailed description |
| `quantity_kg` | DECIMAL(8,2) | NO | - | Quantity in kilograms |
| `status` | ENUM | NO | 'available' | Donation status |
| `pickup_code` | VARCHAR(6) | YES | NULL | Code for pickup verification |
| `delivery_code` | VARCHAR(6) | YES | NULL | Code for delivery verification |
| `latitude` | DECIMAL(10,7) | NO | - | Pickup location latitude |
| `longitude` | DECIMAL(10,7) | NO | - | Pickup location longitude |
| `expires_at` | TIMESTAMP | YES | NULL | Expiration time |
| `created_at` | TIMESTAMP | YES | NULL | Creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Update time |

**Status ENUM values:** `'available'`, `'reserved'`, `'picked_up'`, `'delivered'`, `'expired'`, `'cancelled'`

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`donor_id`)
- INDEX (`status`)
- INDEX (`latitude`, `longitude`)
- INDEX (`created_at`)

**Foreign Keys:**
- `donor_id` → `users(id)` ON DELETE CASCADE

---

### 6. `claims` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `donation_id` | BIGINT UNSIGNED | NO | - | FK to donations |
| `volunteer_id` | BIGINT UNSIGNED | NO | - | FK to users (volunteer) |
| `status` | ENUM | NO | 'active' | Claim status |
| `picked_up_at` | TIMESTAMP | YES | NULL | Pickup timestamp |
| `delivered_at` | TIMESTAMP | YES | NULL | Delivery timestamp |
| `notes` | TEXT | YES | NULL | Additional notes |
| `created_at` | TIMESTAMP | YES | NULL | Creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Update time |

**Status ENUM values:** `'active'`, `'picked_up'`, `'delivered'`, `'cancelled'`

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`donation_id`) — One active claim per donation
- INDEX (`donation_id`)
- INDEX (`volunteer_id`)
- INDEX (`status`)

**Foreign Keys:**
- `donation_id` → `donations(id)` ON DELETE CASCADE
- `volunteer_id` → `users(id)` ON DELETE CASCADE

---

### 7. `notifications` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | CHAR(36) | NO | - | Primary Key (UUID) |
| `type` | VARCHAR(255) | NO | - | Notification class name |
| `notifiable_type` | VARCHAR(255) | NO | - | Polymorphic model type |
| `notifiable_id` | BIGINT UNSIGNED | NO | - | Polymorphic model ID |
| `data` | TEXT | NO | - | Notification data (JSON) |
| `read_at` | TIMESTAMP | YES | NULL | When notification was read |
| `created_at` | TIMESTAMP | YES | NULL | Creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Update time |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`notifiable_type`, `notifiable_id`)

---

### 8. `roles` Table (Spatie Permission)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `name` | VARCHAR(255) | NO | - | Role name |
| `guard_name` | VARCHAR(255) | NO | - | Guard name |
| `created_at` | TIMESTAMP | YES | NULL | Creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Update time |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`name`, `guard_name`)

**Default Roles:** `admin`, `donor`, `volunteer`, `recipient`

---

### 9. `permissions` Table (Spatie Permission)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `name` | VARCHAR(255) | NO | - | Permission name |
| `guard_name` | VARCHAR(255) | NO | - | Guard name |
| `created_at` | TIMESTAMP | YES | NULL | Creation time |
| `updated_at` | TIMESTAMP | YES | NULL | Update time |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`name`, `guard_name`)

**Default Permissions:** `create-donation`, `view-donation`, `claim-donation`, `deliver-donation`, `manage-users`

---

### 10. `model_has_roles` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role_id` | BIGINT UNSIGNED | NO | - | FK to roles |
| `model_type` | VARCHAR(255) | NO | - | Model class name |
| `model_id` | BIGINT UNSIGNED | NO | - | Model primary key |

**Indexes:**
- PRIMARY KEY (`role_id`, `model_id`, `model_type`)
- INDEX (`model_id`, `model_type`)

**Foreign Keys:**
- `role_id` → `roles(id)` ON DELETE CASCADE

---

### 11. `model_has_permissions` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `permission_id` | BIGINT UNSIGNED | NO | - | FK to permissions |
| `model_type` | VARCHAR(255) | NO | - | Model class name |
| `model_id` | BIGINT UNSIGNED | NO | - | Model primary key |

**Indexes:**
- PRIMARY KEY (`permission_id`, `model_id`, `model_type`)
- INDEX (`model_id`, `model_type`)

**Foreign Keys:**
- `permission_id` → `permissions(id)` ON DELETE CASCADE

---

### 12. `role_has_permissions` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `permission_id` | BIGINT UNSIGNED | NO | - | FK to permissions |
| `role_id` | BIGINT UNSIGNED | NO | - | FK to roles |

**Indexes:**
- PRIMARY KEY (`permission_id`, `role_id`)

**Foreign Keys:**
- `permission_id` → `permissions(id)` ON DELETE CASCADE
- `role_id` → `roles(id)` ON DELETE CASCADE

---

### 13. `cache` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `key` | VARCHAR(255) | NO | - | Primary Key |
| `value` | MEDIUMTEXT | NO | - | Cached value |
| `expiration` | INT | NO | - | Expiration timestamp |

---

### 14. `cache_locks` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `key` | VARCHAR(255) | NO | - | Primary Key |
| `owner` | VARCHAR(255) | NO | - | Lock owner |
| `expiration` | INT | NO | - | Expiration timestamp |

---

### 15. `jobs` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `queue` | VARCHAR(255) | NO | - | Queue name |
| `payload` | LONGTEXT | NO | - | Job payload (serialized) |
| `attempts` | TINYINT UNSIGNED | NO | - | Attempt count |
| `reserved_at` | INT UNSIGNED | YES | NULL | Reserved timestamp |
| `available_at` | INT UNSIGNED | NO | - | Available timestamp |
| `created_at` | INT UNSIGNED | NO | - | Creation timestamp |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`queue`)

---

### 16. `job_batches` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(255) | NO | - | Primary Key (batch ID) |
| `name` | VARCHAR(255) | NO | - | Batch name |
| `total_jobs` | INT | NO | - | Total jobs in batch |
| `pending_jobs` | INT | NO | - | Pending jobs count |
| `failed_jobs` | INT | NO | - | Failed jobs count |
| `failed_job_ids` | LONGTEXT | NO | - | Failed job IDs (JSON) |
| `options` | MEDIUMTEXT | YES | NULL | Batch options |
| `cancelled_at` | INT | YES | NULL | Cancellation timestamp |
| `created_at` | INT | NO | - | Creation timestamp |
| `finished_at` | INT | YES | NULL | Completion timestamp |

---

### 17. `failed_jobs` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary Key |
| `uuid` | VARCHAR(255) | NO | - | Unique job UUID |
| `connection` | TEXT | NO | - | Queue connection |
| `queue` | TEXT | NO | - | Queue name |
| `payload` | LONGTEXT | NO | - | Job payload |
| `exception` | LONGTEXT | NO | - | Exception message |
| `failed_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Failure time |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`uuid`)

---

## SQL Schema (Full Recreation)

Run this SQL to create the complete database schema:

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS zerohunger 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE zerohunger;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255) NULL DEFAULT NULL,
    `latitude` DECIMAL(10,7) NULL DEFAULT NULL,
    `longitude` DECIMAL(10,7) NULL DEFAULT NULL,
    `impact_score` INT NOT NULL DEFAULT 0,
    `status` ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    `remember_token` VARCHAR(100) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`),
    KEY `users_email_index` (`email`),
    KEY `users_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PASSWORD RESET TOKENS TABLE
-- =============================================
CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SESSIONS TABLE
-- =============================================
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NULL DEFAULT NULL,
    `user_agent` TEXT NULL DEFAULT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `sessions_user_id_index` (`user_id`),
    KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CACHE TABLE
-- =============================================
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CACHE LOCKS TABLE
-- =============================================
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- JOBS TABLE
-- =============================================
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INT UNSIGNED NULL DEFAULT NULL,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- JOB BATCHES TABLE
-- =============================================
CREATE TABLE `job_batches` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `total_jobs` INT NOT NULL,
    `pending_jobs` INT NOT NULL,
    `failed_jobs` INT NOT NULL,
    `failed_job_ids` LONGTEXT NOT NULL,
    `options` MEDIUMTEXT NULL DEFAULT NULL,
    `cancelled_at` INT NULL DEFAULT NULL,
    `created_at` INT NOT NULL,
    `finished_at` INT NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- FAILED JOBS TABLE
-- =============================================
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PERSONAL ACCESS TOKENS TABLE (Sanctum)
-- =============================================
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` TEXT NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL DEFAULT NULL,
    `last_used_at` TIMESTAMP NULL DEFAULT NULL,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
    KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
    KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PERMISSIONS TABLE (Spatie)
-- =============================================
CREATE TABLE `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ROLES TABLE (Spatie)
-- =============================================
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- MODEL HAS PERMISSIONS TABLE (Spatie)
-- =============================================
CREATE TABLE `model_has_permissions` (
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
    KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
    CONSTRAINT `model_has_permissions_permission_id_foreign` 
        FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- MODEL HAS ROLES TABLE (Spatie)
-- =============================================
CREATE TABLE `model_has_roles` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`role_id`,`model_id`,`model_type`),
    KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
    CONSTRAINT `model_has_roles_role_id_foreign` 
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ROLE HAS PERMISSIONS TABLE (Spatie)
-- =============================================
CREATE TABLE `role_has_permissions` (
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`permission_id`,`role_id`),
    CONSTRAINT `role_has_permissions_permission_id_foreign` 
        FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `role_has_permissions_role_id_foreign` 
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DONATIONS TABLE
-- =============================================
CREATE TABLE `donations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `donor_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `quantity_kg` DECIMAL(8,2) NOT NULL,
    `status` ENUM('available','reserved','picked_up','delivered','expired','cancelled') NOT NULL DEFAULT 'available',
    `pickup_code` VARCHAR(6) NULL DEFAULT NULL,
    `delivery_code` VARCHAR(6) NULL DEFAULT NULL,
    `latitude` DECIMAL(10,7) NOT NULL,
    `longitude` DECIMAL(10,7) NOT NULL,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `donations_donor_id_index` (`donor_id`),
    KEY `donations_status_index` (`status`),
    KEY `donations_latitude_longitude_index` (`latitude`,`longitude`),
    KEY `donations_created_at_index` (`created_at`),
    CONSTRAINT `donations_donor_id_foreign` 
        FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CLAIMS TABLE
-- =============================================
CREATE TABLE `claims` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `donation_id` BIGINT UNSIGNED NOT NULL,
    `volunteer_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('active','picked_up','delivered','cancelled') NOT NULL DEFAULT 'active',
    `picked_up_at` TIMESTAMP NULL DEFAULT NULL,
    `delivered_at` TIMESTAMP NULL DEFAULT NULL,
    `notes` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `claims_donation_id_unique` (`donation_id`),
    KEY `claims_donation_id_index` (`donation_id`),
    KEY `claims_volunteer_id_index` (`volunteer_id`),
    KEY `claims_status_index` (`status`),
    CONSTRAINT `claims_donation_id_foreign` 
        FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `claims_volunteer_id_foreign` 
        FOREIGN KEY (`volunteer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `notifiable_type` VARCHAR(255) NOT NULL,
    `notifiable_id` BIGINT UNSIGNED NOT NULL,
    `data` TEXT NOT NULL,
    `read_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- MIGRATIONS TABLE (Laravel Internal)
-- =============================================
CREATE TABLE `migrations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Sample Data (Seeders)

After creating the schema, insert this sample data:

### Permissions

```sql
INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`) VALUES
('create-donation', 'web', NOW(), NOW()),
('view-donation', 'web', NOW(), NOW()),
('claim-donation', 'web', NOW(), NOW()),
('deliver-donation', 'web', NOW(), NOW()),
('manage-users', 'web', NOW(), NOW());
```

### Roles

```sql
INSERT INTO `roles` (`name`, `guard_name`, `created_at`, `updated_at`) VALUES
('admin', 'web', NOW(), NOW()),
('donor', 'web', NOW(), NOW()),
('volunteer', 'web', NOW(), NOW()),
('recipient', 'web', NOW(), NOW());
```

### Role-Permission Assignments

```sql
-- Donor: create-donation, view-donation
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(1, 2), (2, 2);

-- Volunteer: view-donation, claim-donation, deliver-donation
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(2, 3), (3, 3), (4, 3);

-- Recipient: view-donation
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(2, 4);

-- Admin: all permissions
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1);
```

> [!TIP]
> **Recommended**: Instead of running raw SQL for sample data, use Laravel's seeders by running `php artisan db:seed` after migrations. The seeders will create users with proper password hashing.

---

## Quick Setup Alternative

Instead of running the SQL above, you can use Laravel migrations:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE zerohunger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations (creates all tables)
php artisan migrate

# Seed with sample data
php artisan db:seed
```

This will create the exact same schema with proper Laravel metadata.

---

**End of Database Schema Documentation**
