import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const [,, name = 'CampusPulse Admin', email = 'kg86189@gmail.com', password = 'Ramkola@123'] = process.argv;
const normalizedEmail = email.toLowerCase().trim();

try {
  await connectDB();
  let user = await User.findOne({ email: normalizedEmail }).select('+password');
  const hashed = await bcrypt.hash(password, 12);

  if (user) {
    user.name = name.trim() || user.name;
    user.password = hashed;
    user.role = 'admin';
    user.provider = 'local';
    user.providerId = undefined;
    await user.save();
    console.log(`Admin updated: ${normalizedEmail}`);
  } else {
    user = await User.create({
      name: name.trim() || 'CampusPulse Admin',
      email: normalizedEmail,
      password: hashed,
      role: 'admin',
      provider: 'local'
    });
    console.log(`Admin created: ${normalizedEmail}`);
  }
} catch (error) {
  console.error(`Admin creation/update failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  process.exit();
}
