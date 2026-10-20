import mongoose from 'mongoose';
import { Book } from '../models/Book.js';
import { ApiError } from '../utils/ApiError.js';
import { royaltyFacts } from './royalty.js';

function serializeBook(book) {
  const plain = book.toObject();
  return {
    ...plain,
    id: plain._id.toString(),
    royalty: royaltyFacts(plain),
  };
}

export async function listAuthorBooks(authorUser) {
  const books = await Book.find({ author: authorUser.authorRef }).sort({ title: 1 });
  return books.map(serializeBook);
}

export async function getAuthorBook(authorUser, id) {
  const book = mongoose.Types.ObjectId.isValid(id)
    ? await Book.findById(id)
    : await Book.findOne({ bookId: id });
  if (!book || book.author.toString() !== authorUser.authorRef.toString()) {
    throw ApiError.notFound('BOOK_NOT_FOUND', 'Book not found');
  }
  return serializeBook(book);
}
