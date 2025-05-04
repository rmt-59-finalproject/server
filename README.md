# Stockify Server

## Setup

1. npm install
2. touch .env & fill the required environment variable
    ```env
    PORT=PORT_NUMBER
    MONGODB_URI=YOUR_MONGODB_URI
    ACCESS_TOKEN_SECRET=YOUR_ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET=YOUR_REFRESH_TOKEN_SECRET
    WAREHOUSE_PASSWORD=YOUR_WAREHOUSE_ADMIN_PASSWORD
    ```
3. node src/seeders/seedWarehouse.js && 
   node src/seeders/seedUsers.js && 
   node src/seeders/seedProduct.js && 
   node src/seeders/seedDummyOrder.js
4. npm run start