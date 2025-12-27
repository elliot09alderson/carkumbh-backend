
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import connectDB from './config/db.js';

dotenv.config();

const resetAdmin = async () => {
  try {
    await connectDB();

    const email = 'admin@carkumbh.com';
    const password = 'admin123';

    let admin = await Admin.findOne({ email });

    if (admin) {
      admin.password = password;
      await admin.save();
      console.log(`Admin password reset successfully for ${email}`);
    } else {
      admin = await Admin.create({
        email,
        password,
      });
      console.log(`Admin created successfully: ${email}`);
    }

    console.log(`Credentials:\nEmail: ${email}\nPassword: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

resetAdmin();
