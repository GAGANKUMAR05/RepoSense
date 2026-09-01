import mongoose from 'mongoose';

const connectToDb = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing. Add it to your .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database');
  } catch (err) {
    console.error('Could not connect to db:', err.message || err);
    process.exit(1);
  }
};



export default connectTodb;