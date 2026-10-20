import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    name: { type: String, required: true },
    authorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

export const User = mongoose.model('User', userSchema);
