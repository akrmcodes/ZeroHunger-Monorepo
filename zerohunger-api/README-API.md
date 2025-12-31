# ZeroHunger API Documentation

Base URL: `http://localhost:8000/api/v1`

## Authentication

All endpoints except `/register` and `/login` require Bearer token authentication.

### Register

**POST** `/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "password_confirmation": "password",
  "phone": "+1234567890",
  "role": "donor"
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "roles": ["donor"] },
  "token": "1|xxxxxx"
}
```

### Login

**POST** `/login`

```json
{
  "email": "john@example.com",
  "password": "password"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "roles": ["donor"], "impact_score": 0 },
  "token": "2|xxxxxx"
}
```

### Logout

**POST** `/logout`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

## Donations

### List All Donations

**GET** `/donations`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Array of donations

### Create Donation

**POST** `/donations`  
**Headers:** `Authorization: Bearer {token}`  
**Role:** Donor only

```json
{
  "title": "Fresh Bread",
  "description": "20 loaves from bakery",
  "quantity_kg": 5.0,
  "latitude": 30.0444,
  "longitude": 31.2357,
  "expires_at": "2025-12-05T18:00:00Z"
}
```

**Response:** `201 Created`

### Claim Donation

**POST** `/donations/{id}/claim`  
**Headers:** `Authorization: Bearer {token}`  
**Role:** Volunteer only

**Response:** `200 OK`
```json
{
  "message": "Donation claimed successfully",
  "donation": { /* DonationObject */ },
  "pickup_code": "123456"
}
```

### Get My Donations

**GET** `/my-donations`  
**Headers:** `Authorization: Bearer {token}`  
**Role:** Donor only

**Response:** `200 OK` - Array of donor's donations

### Nearby Donations

**GET** `/donations/nearby?latitude=30.0444&longitude=31.2357&radius=10`  
**Headers:** `Authorization: Bearer {token}`

Returns donations within specified radius (km).

---

## Claims

### List My Claims

**GET** `/claims`  
**Headers:** `Authorization: Bearer {token}`  
**Role:** Volunteer only

**Response:** `200 OK` - Array of claims

### Mark as Picked Up

**POST** `/claims/{id}/pickup`  
**Headers:** `Authorization: Bearer {token}`

```json
{
  "pickup_code": "123456"
}
```

**Response:** `200 OK`

### Mark as Delivered

**POST** `/claims/{id}/deliver`  
**Headers:** `Authorization: Bearer {token}`

```json
{
  "notes": "Delivered successfully"
}
```

**Response:** `200 OK`

### Cancel Claim

**DELETE** `/claims/{id}`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

## Notifications

### Get Notifications

**GET** `/notifications`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Array of notifications (latest 20)

### Mark as Read

**POST** `/notifications/{id}/read`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

### Mark All as Read

**POST** `/notifications/read-all`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

## Error Responses

### 400 Bad Request
```json
{ "message": "Invalid request" }
```

### 401 Unauthorized
```json
{ "message": "Unauthenticated" }
```

### 403 Forbidden
```json
{ "message": "Unauthorized" }
```

### 409 Conflict
```json
{ "message": "This donation is no longer available" }
```

### 422 Validation Error
```json
{
  "message": "Validation failed",
  "errors": { "email": ["The email field is required."] }
}
```

---

## Test Accounts

All passwords: `password`

| Email | Role |
|-------|------|
| donor@test.com | Donor |
| volunteer@test.com | Volunteer |
| admin@test.com | Admin |

---

## Example cURL Commands

```bash
# Register
curl -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password","password_confirmation":"password","role":"donor"}'

# Login
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"donor@test.com","password":"password"}'

# List donations (with token)
curl -X GET http://localhost:8000/api/v1/donations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Running the API

```bash
# Start Laravel API
cd zerohunger-api
php -S 0.0.0.0:8000 -t public

# Or with artisan (if PHP < 8.5)
php artisan serve

# Start queue worker for notifications
php artisan queue:work --verbose
```

## CORS

Allowed origins: `http://localhost:3000` (Next.js frontend)
