import mongoose from "mongoose";

const authorSchema = new mongoose.Schema(
  {
    authorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    joinedDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Author = mongoose.model("Author", authorSchema);
