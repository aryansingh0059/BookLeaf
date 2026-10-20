import { asyncHandler } from '../utils/asyncHandler.js';
import * as ticketService from '../services/ticketService.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user, req.body);
  res.status(201).json({ data: ticket });
});

export const listTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.listAuthorTickets(req.user);
  res.json({ data: tickets });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getAuthorTicket(req.user, req.params.id);
  res.json({ data: ticket });
});

export const replyToTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.addAuthorReply(req.user, req.params.id, req.body.body);
  res.status(201).json({ data: ticket });
});
