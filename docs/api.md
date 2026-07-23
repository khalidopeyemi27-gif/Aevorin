# AEVORIN API Documentation

This document outlines the API contract for the AEVORIN Express backend, as well as the Authentication flow.
Base URL: `https://aevorin.onrender.com`

## Authentication Flow

AEVORIN uses **Supabase** for authentication. The Express backend does not have an `/api/auth/login` endpoint. Instead, the client must communicate directly with Supabase to authenticate and retrieve a JWT (`access_token`), which is then sent to the Express backend.

### 1. Login (Supabase)
Client uses the Supabase Flutter SDK (or REST API) to authenticate.
```dart
// Example using Supabase Flutter
final AuthResponse res = await supabase.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'password123',
);
final String token = res.session!.accessToken;
```

### 2. Authenticated Requests (Express API)
All protected Express routes (e.g., `/api/projects/*`) require the Supabase JWT to be sent in the `Authorization` header.
```
Header:
Authorization: Bearer <token>
```

---

## Projects API

### List Projects
* **Endpoint:** `GET /api/projects`
* **Auth Required:** Yes
* **Response:** Array of Project objects.
```json
[
  {
    "id": "uuid-string",
    "name": "My Novel",
    "description": "A great story",
    "createdAt": "2026-07-19T..."
  }
]
```

### Create Project
* **Endpoint:** `POST /api/projects`
* **Auth Required:** Yes
* **Request Body:**
```json
{
  "name": "Project Name",
  "description": "Optional description",
  "template": "blank",
  "targetWordCount": 50000,
  "coverImage": null
}
```
* **Response:** Created Project object.

### Delete Project
* **Endpoint:** `DELETE /api/projects/:name`
* **Auth Required:** Yes
* **Response:**
```json
{
  "success": true,
  "message": "Project workspace 'Project Name' deleted."
}
```

### Load Project
* **Endpoint:** `POST /api/projects/load`
* **Auth Required:** Yes
* **Request Body:**
```json
{
  "name": "Project Name"
}
```
* **Response:** Detailed Project object (establishes active project connection in backend kernel).

### Other Project Routes
* `PUT /api/projects/:name/rename`
* `POST /api/projects/:name/duplicate`
* `PUT /api/projects/:name/archive`
* `PUT /api/projects/:name/unarchive`
* `GET /api/projects/:id/diagnostics`

---
## System Status
* **Endpoint:** `GET /health`
* **Auth Required:** No
* **Response:** `{ "status": "ok", "service": "AEVORIN API" }`
