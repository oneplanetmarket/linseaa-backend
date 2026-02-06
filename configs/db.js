import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        mongoose.connection.on('connected', ()=> console.log("Database Connected"));
        
        // Fixed connection string - ensure proper formatting
        const connectionString = process.env.MONGODB_URI.endsWith('/') 
            ? `${process.env.MONGODB_URI}greencart` 
            : `${process.env.MONGODB_URI}/greencart`;
            
        await mongoose.connect(connectionString);
    } catch (error) {
        console.error('Database connection error:', error.message);
        throw error;
    }
}

export default connectDB;