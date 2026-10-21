import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Author } from "../models/Author.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8xJ8mQeH1n1n1n1n1n1n1n1n1n1n1e";

function signToken(user, authorId = null) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      authorId,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

function toPublicUser(user, author = null) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    authorId: author?.authorId ?? null,
    authorRef: user.authorRef ? user.authorRef.toString() : null,
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  const hash = user?.passwordHash || DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);

  if (!user || !matches) {
    throw ApiError.unauthorized(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
    );
  }

  let author = null;
  if (user.authorRef) {
    author = await Author.findById(user.authorRef);
  }

  const token = signToken(user, author?.authorId ?? null);
  return { token, user: toPublicUser(user, author) };
}

export async function getCurrentUser(userDoc) {
  let author = null;
  if (userDoc.authorRef) {
    author = await Author.findById(userDoc.authorRef);
  }
  return toPublicUser(userDoc, author);
}
