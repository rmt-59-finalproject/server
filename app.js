if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const CLIENT = process.env.CLIENT;
// Define CORS options
const corsOptions = {
  origin: CLIENT,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Allow common methods
  allowedHeaders: "Content-Type,Authorization,X-Requested-With", // Allow common headers
};

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Enable CORS for all other requests
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", require("./src/routes/index"));

app.use(require("./src/middlewares/error.middleware"));

module.exports = app;
