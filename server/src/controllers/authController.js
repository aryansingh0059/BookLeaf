import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user);
  res.json({ user });
});
