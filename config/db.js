const mongoose = require("mongoose");

const db = async () => {
  await mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => {
      console.error("Database connection error:", err);
    });
};

module.exports = db;
