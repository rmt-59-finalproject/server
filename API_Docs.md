[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18604804&assignment_repo_type=AssignmentRepo)

<!-- omit in toc -->

# Stockify API Documentation

### Endpoints :

List of available endpoints.

- [Stockify API Documentation](#stockify-api-documentation)
    - [Endpoints :](#endpoints-)
- [User](#user)
  - [1. POST /api/register](#1-post-apiregister)
  - [2. POST /api/login](#2-post-apilogin)
  - [3. GET /api/login](#3-get-apilogin)
  - [4. GET /api/logout](#4-get-apilogout)
- [Orders](#orders)
  - [5. GET /api/orders](#5-get-apiorders)
  - [6. GET /api/orders/:id](#6-get-apiordersid)
  - [7. POST /api/orders](#7-post-apiorders)
  - [8. PATCH /api/orders/:id](#8-patch-apiordersid)
  - [9. PATCH /api/orders/:id/driver](#9-patch-apiordersiddriver)
- [Driver](#driver)
  - [10. GET /driver/orders](#10-get-driverorders)
  - [11. GET /driver/orders/:id](#11-get-driverordersid)
  - [12. PATCH /driver/orders/:id](#12-patch-driverordersid)
- [Errors](#errors)
  - [Global Error](#global-error)

&nbsp;

# User

Endpoint for authentication.

## 1. POST /api/register

Description:

> Create user

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

> User login

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

> Refresh user access_token

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

> User logout

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

## 5. GET /api/orders

Description:

> Read orders data

Request:

- params:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
[
  {
    "_id": "string",
    "status": "requested" || "approved" || "in_transit" || "delivered" || "completed",
    "items": [
      {
        "_id": "string",
        "name": "string",
        "quantity": "number",
        "unit": "string",
        "category": "string",
        "checkedByDriver": "boolean",
        "driverCheckTime": "date" || null,
        "checkedByOutlet": "boolean",
        "outletCheckTime": "date" || null
      },
      ...
    ],
    "createdAt": "date",
    "updatedAt": "date",
    "driver": {
      "_id": "string",
      "username": "string",
      "name": "string",
      "role": "driver"
    },
    "outlet": {
      "_id": "string",
      "username": "string",
      "name": "string",
      "role": "outlet"
    }
  },
  ...
]
```

_Response (404 - Not Found)_

```json
{
  "message": "No data found."
}
```

## 6. GET /api/orders/:id

Description:

> Read order by ID

Request:

- params:

```json
{
  "id": "string (required)"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
{
  "_id": "string",
  "driver": {
    "_id": "string",
    "username": "string",
    "role": "driver"
  },
  "outlet": {
    "_id": "string",
    "username": "string",
    "role": "outlet"
  },
  "items": [
    {
      "_id": "string",
      "name": "string",
      "quantity": "number",
      "unit": "string",
      "category": "string",
      "checkedByDriver": "boolean",
      "driverCheckTime": "date" || null,
      "checkedByOutlet": "boolean",
      "outletCheckTime": "date" || null
    },
    ...
  ],
  "createdAt": "date",
  "updatedAt": "date"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Order not found!"
}
```

## 7. POST /api/orders

Description:

> Create new order (from outlet)

Request:

- body:

```json
[
  {
    "productId": "string",
    "quantity": "number"
  },
  ...
]
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (201 - Created)_

```json
{
  "message": "Successfully create new order."
}
```

_Response (400 - Bad Requeset)_

```json
{
  "message": "Items is required."
}
```

## 8. PATCH /api/orders/:id

Description:

> Update order status

Request:

- body:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
{
  "message": "Successfully update order status to <status>"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Updated status is required."
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Order not found!"
}
```

## 9. PATCH /api/orders/:id/driver

Description:

> Update order assigned driver

Request:

- body:

```json
{
  "driverId": "string (required)"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
{
  "message": "Successfully assign order to <driver username>"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Driver is required."
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Driver not found!"
}
OR
{
  "message": "Order not found!"
}
```

# Driver

## 10. GET /driver/orders

Description:

> Read current driver order task

Request:

- params:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
[
  {
    "_id": "string",
    "driver": {
      "_id": "string",
      "username": "string",
      "name": "string",
      "role": "driver"
    },
    "outlet": {
      "_id": "string",
      "username": "string",
      "name": "string",
      "role": "outlet"
    },
    "items": [
      {
        "_id": "string",
        "name": "string",
        "quantity": "number",
        "unit": "string",
        "category": "string",
        "checkedByDriver": "boolean",
        "driverCheckTime": "date" || null,
        "checkedByOutlet": "boolean",
        "outletCheckTime": "date" || null
      },
      ...
    ],
    "createdAt": "date",
    "updatedAt": "date"
  },
  ...
]
```

_Response (404 - Not Found)_

```json
{
  "message": "Order not found!"
}
```

## 11. GET /driver/orders/:id

Description:

> Read order by ID based on driver task

Request:

- params:

```json
{
  "id": "string - order ID (required)"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
{
  "_id": "string",
  "driver": {
    "_id": "string",
    "username": "string",
    "role": "driver"
  },
  "outlet": {
    "_id": "string",
    "username": "string",
    "role": "outlet"
  },
  "items": [
    {
      "_id": "string",
      "name": "string",
      "quantity": "number",
      "unit": "string",
      "category": "string",
      "checkedByDriver": "boolean",
      "driverCheckTime": "date" || null,
      "checkedByOutlet": "boolean",
      "outletCheckTime": "date" || null
    },
    ...
  ],
  "createdAt": "date",
  "updatedAt": "date"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Order not found!"
}
```

## 12. PATCH /driver/orders/:id

Description:

> Update item status in specific order based on driver task

Request:

- params:

```json
{
  "id": "string - order ID (required)"
}
```

- body:

```json
{
  "productId": "string - productId (required)",
  "status": "boolean - item status checked or not (required)"
}
```

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

_Response (200 - OK)_

```json
{
  "message": "Checked <quantity> <unit> of <product name>."
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Product ID is required."
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Order not found!"
}
```

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

_Response (404 - Not Found)_

```json
{
  "message": "Invalid ID."
}
```

_Response (500 - Internal Server Error)_

```json
{
  "message": "Internal server error"
}
```
