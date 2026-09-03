const mongoose = require("mongoose");
let mongod = null;

const autoSeedIfEmpty = async () => {
  try {
    const Video = require("../models/Video");
    const count = await Video.countDocuments({ source: "youtube" });
    if (count < 12) {
      console.log("Upgrading dataset to REAL YouTube top videos...");
      const { seedDatabase } = require("../utils/seed");
      await seedDatabase();
      console.log("Auto-seeded complete VidyTube YouTube dataset with REAL YouTube videos!");
    }
  } catch (err) {
    console.warn("Auto-seed notice:", err.message);
  }
};

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vidytube";
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.log(`Local MongoDB not found (${error.message}). Starting embedded MongoDB...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`Embedded MongoDB Connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
    } catch (memError) {
      console.error(`Failed to start database: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

