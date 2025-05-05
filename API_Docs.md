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
  - [5. GET /api/users](#5-get-apiusers)
- [Inventory](#inventory)
  - [6. GET /api/inventory](#6-get-apiinventory)
  - [7. POST /api/inventory](#7-post-apiinventory)
  - [8. PATCH /api/inventory/:id](#8-patch-apiinventoryid)
  - [9. DELETE /api/inventory/:id](#9-delete-apiinventoryid)
- [Orders](#orders)
  - [10. GET /api/orders](#10-get-apiorders)
  - [11. GET /api/orders/:id](#11-get-apiordersid)
  - [12. POST /api/orders](#12-post-apiorders)
  - [13. PATCH /api/orders/:id](#13-patch-apiordersid)
  - [14. PATCH /api/orders/:id/driver](#14-patch-apiordersiddriver)
- [Driver](#driver)
  - [15. GET /api/driver/orders](#15-get-apidriverorders)
  - [16. GET /api/driver/orders/:id](#16-get-apidriverordersid)
  - [17. PATCH /api/driver/orders/:id](#17-patch-apidriverordersid)
- [Outlet](#outlet)
  - [18. GET /api/outlet/orders](#18-get-apioutletorders)
  - [19. GET /api/outlet/orders/:id](#19-get-apioutletordersid)
  - [20. PATCH /api/outlet/orders/:id](#20-patch-apioutletordersid)
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

## 5. GET /api/users

Description:

> Read all users in database (warehouse only)

Request:

- params:

```json
{
  "role (optional)": "warehouse" || "driver" || "outlet"
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
    "username": "string",
    "name": "string",
    "role": "string"
  },
  ...
]
```

# Inventory

Endpoint to interact with inventory.

## 6. GET /api/inventory

Description:

> Read inventory data

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

- params:

```json
{
  "search": "string",
  "limit (optional)": "number",
  "page (optional)": "number"
}
```

_Response (200 - OK)_
  
```json
{
  "totalItems": "number",
  "data": [
    {
      "_id": "string",
      "name": "string",
      "stock": "number",
      "unit": "string",
      "category": "string",
      "createdAt": "date",
      "updatedAt": "date"
    },
    ...
  ]
}
```

## 7. POST /api/inventory

Description:

> Create new inventory item

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

- body:

```json
{
  "name": "string (required)",
  "stock": "number (required)",
  "unit": "string (required)",
  "category": "string (required)"
}
```

_Response (201 - Created)_

```json
{
  "_id": "string",
  "name": "string",
  "stock": "number",
  "unit": "string",
  "category": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Name is required" || "Stock is required" || "Unit is required" || "Category is required"
}
```

_Response (409 - Conflict)_

```json
{
  "message": "This product already exists"
}
```

## 8. PATCH /api/inventory/:id

Description:

> Update inventory stock

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

- params:

```json
{
  "id": "string (required)"
}
```

- body:

```json
{
  "stock": "number (required)"
}
```

_Response (200 - OK)_

```json
{
  "message": "<name> updated successfully"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Product not found"
}
```

## 9. DELETE /api/inventory/:id

Description:

> Delete inventory item by ID

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

- params:

```json
{
  "id": "string (required)"
}
```

_Response (200 - OK)_

```json
{
  "message": "<name> deleted successfully"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Product not found"
}
```

# Orders

Endpoint to interact with orders.

## 10. GET /api/orders

Description:

> Read orders data

Request:

- query:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed" || "rejected"
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
    "status": "requested" || "approved" || "in_transit" || "delivered" || "completed" || "rejected",
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

## 11. GET /api/orders/:id

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
  "notes": "string",
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

## 12. POST /api/orders

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

## 13. PATCH /api/orders/:id

Description:

> Update order status

Request:

- body:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed" || "rejected",
  "notes (optional)": "string"
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

## 14. PATCH /api/orders/:id/driver

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

## 15. GET /api/driver/orders

Description:

> Read current driver order task

Request:

- query:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed" || "rejected"
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

## 16. GET /api/driver/orders/:id

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
  "notes": "string",
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

## 17. PATCH /api/driver/orders/:id

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

# Outlet

## 18. GET /api/outlet/orders

Description:

> Read current outlet order task

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

- query:

```json
{
  "status": "requested" || "approved" || "in_transit" || "delivered" || "completed" || "rejected"
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
    "status": "string",
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

## 19. GET /api/outlet/orders/:id

Description:

> Read order by ID based on outlet task

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

- params:

```json
{
  "id": "string - order ID (required)"
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
  "notes": "string",
  "status": "string",
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
  "message": "Order not found"
}
```

## 20. PATCH /api/outlet/orders/:id

Description:

> Update item status in specific order based on outlet task

Request:

- cookies:

```json
{
  "access_token": "Bearer <access_token>"
}
```

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

_Response (200 - OK)_

```json
{
  "message": "Outlet checked <quantity> <unit> of <product name>."
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
