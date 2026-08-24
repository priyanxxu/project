import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, default: null, select: false },
  college: { type: String, trim: true, maxlength: 150 },
  department: { type: String, trim: true, maxlength: 100 },
  year: { type: String, trim: true, maxlength: 30 },
  role: { type: String, enum: ['student', 'organizer', 'admin'], default: 'student', required: true },
  avatar: { type: String, default: '' },
  provider: { type: String, enum: ['local', 'google', 'github', 'facebook'], default: 'local' },
  providerId: { type: String, default: undefined, index: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Only OAuth accounts (providerId is a real string) participate in this unique index.
// A plain `sparse` compound index still indexed every local account as (local, null),
// so the SECOND local signup collided even with a different email.
userSchema.index(
  { provider: 1, providerId: 1 },
  { unique: true, partialFilterExpression: { providerId: { $type: 'string' } } }
);

export default mongoose.model('User', userSchema);
