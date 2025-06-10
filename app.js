if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const CLIENT = process.env.CLIENT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: CLIENT }));
app.use(cookieParser());

app.use("/api", require("./src/routes/index"));

app.use(require("./src/middlewares/error.middleware"));

module.exports = app;
