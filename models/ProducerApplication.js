import mongoose from 'mongoose';

const producerSchema = new mongoose.Schema({
  name: String,
  location: String,
  country: String,
  story: String,
  profileImageUrl: String,
  coverImageUrl: String,
  yearsInBusiness: Number,
  specialties: [String],
  email: String,
  mobileNumber: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ProducerApplication', producerSchema);
