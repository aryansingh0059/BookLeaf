import { asyncHandler } from '../utils/asyncHandler.js';
import { AIUnavailableError } from '../utils/ApiError.js';
import * as ticketService from '../services/ticketService.js';

export const listTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listAdminTickets(req.validatedQuery);
  res.json(result);
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getAdminTicket(req.params.id);
  res.json({ data: ticket });
});

export const patchTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.patchAdminTicket(req.user, req.params.id, req.body);
  res.json({ data: ticket });
});

export const assignMe = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignToMe(req.user, req.params.id);
  res.json({ data: ticket });
});

export const addNote = asyncHandler(async (req, res) => {
  const ticket = await ticketService.addInternalNote(req.user, req.params.id, req.body.body);
  res.status(201).json({ data: ticket });
});

export const draftReply = asyncHandler(async (req, res) => {
  try {
    const ticket = await ticketService.generateAiDraft(req.params.id);
    res.json({ data: ticket });
  } catch (err) {
    if (err instanceof AIUnavailableError || err?.name === 'AIUnavailableError') {
      return res.status(503).json({
        error: {
          code: 'AI_UNAVAILABLE',
          message: err.message || 'AI draft unavailable. Please write a reply manually.',
        },
      });
    }
    throw err;
  }
});

export const sendReply = asyncHandler(async (req, res) => {
  const ticket = await ticketService.addAdminReply(req.user, req.params.id, req.body);
  res.status(201).json({ data: ticket });
});

export const reclassify = asyncHandler(async (req, res) => {
  const ticket = await ticketService.reclassify(req.params.id);
  res.json({ data: ticket });
});

export const stats = asyncHandler(async (req, res) => {
  const data = await ticketService.getAdminStats();
  res.json({ data });
});
