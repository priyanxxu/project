import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Entrepreneurship', 'Social', 'Photography', 'Music', 'Other']
  },
  logo: { type: String, default: '', trim: true, maxlength: 1000 },
  coverImage: { type: String, default: '', trim: true, maxlength: 1000 },
  president: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memberCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'archived'], default: 'active', index: true }
}, { timestamps: true });

clubSchema.index({ name: 1 }, { unique: true });
clubSchema.index({ category: 1, status: 1 });
clubSchema.index({ president: 1, status: 1 });

export default mongoose.model('Club', clubSchema);
