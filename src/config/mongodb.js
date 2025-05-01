const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);
const db = client.db('stockify');

module.exports = db;