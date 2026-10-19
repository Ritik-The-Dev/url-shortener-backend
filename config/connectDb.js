import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log(`MongoDB connected Successfully`);
  } catch (error) {
    console.log(process.env.CONNECTION_URL)
    console.error(`Error connecting Db ${error}`);
    process.exit(1);
  }
};
