import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true },
});

export const Counter = mongoose.model('Counter', counterSchema);

export async function nextTicketNumber() {
  const doc = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  return `BL-${doc.seq}`;
}
