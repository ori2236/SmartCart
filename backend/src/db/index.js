import { MongoClient, MongoGCPError } from "mongodb";
import mongoose from "mongoose"
import FindStores from "../models/FindStores.js";

let client;

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(
      "mongodb+srv://ori:ori@cluster0.tmv7g.mongodb.net/SmartCart?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log(`Database Connected: ${conn.connection.host}`);
    client = conn.connection.getClient();

    await FindStores.collection.createIndex(
      { last_updated: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 20 }
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

