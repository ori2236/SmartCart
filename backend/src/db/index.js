import { MongoClient, MongoGCPError } from "mongodb";
import mongoose from "mongoose"

const connectDB = async () => {
    try{
        mongoose.set('strictQuery', false);/*
        const conn = await mongoose.connect(
          "mongodb+srv://orile03:GEMsF8I9DL7T2ldU@cluster0.g1mzbrm.mongodb.net/?appName=Cluster0"
        );*/
        const conn = await mongoose.connect(
          "mongodb+srv://ori:ori@cluster0.tmv7g.mongodb.net/SmartCart?retryWrites=true&w=majority&appName=Cluster0"
        );


        console.log(`Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;

