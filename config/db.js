const mongoose = require("mongoose");

const path = require("path");
const dotenv = require("dotenv");
require("dotenv").config();
// Load config
dotenv.config({ path: "variables.env" });

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("db conectada");
  } catch (error) {
    console.log("Hubo un error: ", error);
    process.exit(1); // detener la app
  }
};

module.exports = conectarDB;
