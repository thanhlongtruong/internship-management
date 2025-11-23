import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGO_URI_INTERNSHIP;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGO_URI_INTERNSHIP environment variable inside .env.local"
  );
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    console.log("Using cached connection");
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    console.log("Creating new MongoDB connection...");
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("Connect DB fail:", e);
    throw e;
  }
  return cached.conn;
}
