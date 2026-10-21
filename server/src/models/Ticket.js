import mongoose from "mongoose";
import {
  AI_STATUSES,
  ROLES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../config/constants.js";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
  },
  { _id: false },
);

const responseSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, enum: Object.values(ROLES), required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const internalNoteSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const aiDraftSchema = new mongoose.Schema(
  {
    body: { type: String, default: "" },
    generatedAt: { type: Date, default: null },
    model: { type: String, default: null },
    status: {
      type: String,
      enum: ["idle", "pending", "ready", "failed"],
      default: "idle",
    },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null },
    subject: { type: String, required: true, minlength: 3, maxlength: 150 },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000,
    },
    attachments: { type: [attachmentSchema], default: [] },
    status: { type: String, enum: TICKET_STATUSES, default: "Open" },
    category: {
      type: String,
      enum: [...TICKET_CATEGORIES],
      default: "General Inquiry",
    },
    aiCategory: {
      type: String,
      enum: [...TICKET_CATEGORIES],
      default: undefined,
    },
    categoryOverriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    priority: { type: String, enum: [...TICKET_PRIORITIES], default: "Medium" },
    aiPriority: {
      type: String,
      enum: [...TICKET_PRIORITIES],
      default: undefined,
    },
    aiPriorityReason: { type: String, default: null },
    priorityOverriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    aiStatus: { type: String, enum: AI_STATUSES, default: "pending" },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    responses: { type: [responseSchema], default: [] },
    internalNotes: { type: [internalNoteSchema], default: [] },
    aiDraft: { type: aiDraftSchema, default: () => ({}) },
  },
  { timestamps: true },
);

ticketSchema.index({ author: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });
ticketSchema.index({ category: 1 });

export const Ticket = mongoose.model("Ticket", ticketSchema);
