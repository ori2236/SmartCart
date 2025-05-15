import mongoose from "mongoose"
import config from "../config.js";
import FindStores from "../models/FindStores.js";

let client;

const connectDB = async () => {
  try {
    const uri = config.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI in .env");

    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(uri);
    console.log(`Database Connected: ${conn.connection.host}`);
    client = conn.connection.getClient();

    await FindStores.collection.createIndex(
      { last_updated: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 20 } //20 days
    );

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const getClient = () => {
  if (!client) {
    throw new Error("MongoDB client is not connected. Call connectDB first.");
  }
  return client;
};

export { connectDB, getClient };

