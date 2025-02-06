import { MongoClient, MongoGCPError } from "mongodb";
import mongoose from "mongoose"

const connectDB = async () => {
    try{
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(
          "mongodb+srv://ori:ori@cluster0.tmv7g.mongodb.net/SmartCart?retryWrites=true&w=majority&appName=Cluster0"
        );


        console.log(`Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;

