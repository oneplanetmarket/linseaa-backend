import mongoose from "mongoose";

const producerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    profileImageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Producer = mongoose.models.Producer || mongoose.model('Producer', producerSchema);

export default Producer;