[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18604804&assignment_repo_type=AssignmentRepo)

<!-- omit in toc -->
# Stockify API Documentation

### Endpoints :

List of available endpoints.

- [User](#user)
  - [1. POST /api/register](#1-post-apiregister)
  - [2. POST /api/login](#2-post-apilogin)
  - [3. GET /api/login](#3-get-apilogin)
  - [4. GET /api/logout](#4-get-apilogout)
- [Orders](#orders)
  - [5. GET](#5-get)
- [Errors](#errors)
  - [Global Error](#global-error)

&nbsp;

# User

Endpoint for authentication.

## 1. POST /api/register

Description:

- Create user

Request:

- body:

```json
{
  "username": "string (required)",
  "password": "string (required)",
  "role": "string (required)"
}
```

_Response (201 - Created)_

```json
{
  "message": "User with role <role> created successfully!"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "All fields are required."
}
```

_Response (409 - Conflict)_

```json
{
  "message": "User already exists!"
}
```

## 2. POST /api/login

Description:

- User login

Request:

- body:

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

_Response (200 - OK)_

- body:

```json
{
  "message": "User login successfully!",
  "data": {
    "username": "string",
    "role": "string"
  }
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token> (expires: 8 hours)",
  "refresh_token": "Bearer <refresh_token> (expires: 1 day)"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "All fields are required."
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid username/password."
}
```

## 3. GET /api/login

Description:

- Refresh user access_token

Request:

- cookies:

```json
{
  "refresh_token": "Bearer <refresh_token>"
}
```

_Response (200 - OK)_

- body:

```json
{
  "message": "Token is valid."
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token> (expires: 8 hours)"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Please login first!"
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid refresh token."
}
```

## 4. GET /api/logout

Description:

- User logout

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
{
  "message": "User logout successfully!"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Please login first!"
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid refresh token."
}
```

# Orders

Endpoint to interact with orders.

## 5. GET

# Errors

Global error response.

## Global Error

_Response (401 - Unauthorized)_

```json
{
  "message": "You are not authorized."
}
```

_Response (403 - Forbidden)_

```json
{
  "message": "You are not authorized."
}
```

_Response (500 - Internal Server Error)_

```json
{
  "message": "Internal server error"
}
```
