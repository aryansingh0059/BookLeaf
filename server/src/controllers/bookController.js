import { asyncHandler } from "../utils/asyncHandler.js";
import * as bookService from "../services/bookService.js";

export const listBooks = asyncHandler(async (req, res) => {
  const books = await bookService.listAuthorBooks(req.user);
  res.json({ data: books });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await bookService.getAuthorBook(req.user, req.params.id);
  res.json({ data: book });
});
