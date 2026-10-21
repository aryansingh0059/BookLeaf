import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true, unique: true, index: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    isbn: { type: String, required: true },
    genre: { type: String, required: true },
    publicationDate: { type: Date, default: null },
    status: { type: String, required: true },
    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },
    totalCopiesSold: { type: Number, default: 0 },
    totalRoyaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Book = mongoose.model("Book", bookSchema);
