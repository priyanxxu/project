import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  date: { type: Date, required: true },
  time: { type: String, required: true, trim: true, maxlength: 30 },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  capacity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }
}, { timestamps: true });

eventSchema.index({ date: 1 });
eventSchema.index({ status: 1, date: 1 });

export default mongoose.model('Event', eventSchema);
