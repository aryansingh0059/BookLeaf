/**
 * Knowledge Base for BookLeaf support.
 * Sections are keyed by ticket category so we can inject ONLY the relevant
 * section into each draft-reply prompt (cost-aware context assembly).
 *
 * Text is sourced from the assignment PDF / BookLeaf policy documentation.
 */

export const KB = {
  'Royalty & Payments': `
ROYALTY & PAYMENTS POLICY:
- BookLeaf pays author royalties quarterly (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec quarters).
- Royalties are calculated after each quarter ends and paid within 45 days of the quarter end.
  Example: Q3 (Jul-Sep) ends 30 Sep; payment is released by 14 Nov.
- Minimum payout threshold: ₹1,000 (India) / $15 (US). If accumulated royalty is below this, it rolls over to the next quarter automatically.
- Authors must have valid bank details / payment method on file. Royalties cannot be released without verified payment info.
- For first-time payout (no previous payout recorded), the team verifies bank details before releasing funds; this may add 5-7 business days.
- If royalty appears genuinely overdue (past the 45-day window after quarter end), the support team escalates to the finance team within 48 hours.
- Royalty statement (breakdown by book, quarter, copies sold) is available on the Author Portal.
- Royalty per copy is fixed at signing and does not change after publication.
`,

  'ISBN & Metadata Issues': `
ISBN & METADATA POLICY:
- Every BookLeaf-published book is assigned a unique ISBN-13 (978-93-5XXXX-XX-X format for Indian titles).
- ISBNs are assigned during the ISBN Assignment production stage, before printing.
- If there is a mismatch between the ISBN printed on the book and what appears on a retail platform (Amazon, Flipkart, etc.), this is a HIGH-PRIORITY issue requiring immediate investigation.
- Metadata updates (author bio, description, book title correction) can be requested via the support portal. Allow 7-14 business days for propagation across all platforms after our update.
- Duplicate ISBN allocation is a critical error. BookLeaf will investigate and correct within 48 hours of confirmation.
- If an author notices their book is linked to a different title/author on any platform, they should report it immediately — BookLeaf will file a correction request with the platform within 24 hours.
- ISBNs are permanent once assigned and cannot be reused or changed after publication.
`,

  'Printing & Quality': `
PRINTING & QUALITY POLICY:
- BookLeaf uses print partners: In-House, Repro India, and Epitome Books.
- Author copies are shipped as a courtesy; print quality should match the published copies.
- If an author receives defective author copies (blurry pages, misaligned text, binding issues), BookLeaf will arrange a reprint of the affected copies at no charge.
- To process a reprint claim, authors should share photos of the defect via the ticket.
- Print quality complaints are reviewed within 3-5 business days.
- For a book live on retail with print defects reported by buyers, this is a HIGH-PRIORITY issue — BookLeaf will pause the print run and investigate within 48 hours.
- Standard print timeline: 7-10 business days after files are approved.
`,

  'Distribution & Availability': `
DISTRIBUTION & AVAILABILITY POLICY:
- BookLeaf distributes to: Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- After publication, listing propagation can take 3-7 business days on each platform.
- "Currently Unavailable" on Amazon may indicate a stock sync issue. BookLeaf can trigger a re-sync request with the platform; allow 3-5 business days after the re-sync for the listing to go live.
- If a book is supposed to be on a platform but is missing entirely, BookLeaf will investigate with the distribution team within 48 hours.
- Price changes and promotional discounts must be requested 14 days in advance.
- International distribution (US, UK) may take an additional 5-10 business days vs. India.
`,

  'Book Status & Production Updates': `
PRODUCTION STAGES & TIMELINES:
BookLeaf books go through these stages in order:
1. Manuscript Received — team reviews the manuscript (2-5 business days)
2. Editing (if opted) — developmental/copy edit (1-4 weeks depending on length)
3. Cover Design — design team creates cover; author approval required (1-2 weeks + revision rounds)
4. Typesetting — interior layout and formatting (1-2 weeks)
5. Proofreading — final quality check (1 week)
6. ISBN Assignment — unique ISBN is assigned (1-2 business days)
7. Printing — files sent to print partner (7-10 business days)
8. Distribution Setup — listing created on platforms (3-7 business days)
9. Published & Live — book is available for purchase

Common delay points:
- Cover Design: author revision requests extend the timeline. Each revision round adds 3-5 business days.
- Proofreading: extensive corrections can add 1-2 weeks.
- Platform listing: Amazon/Flipkart can take 3-7 days after we upload files.

For books In Production, royalties and sales data are not yet available (books don't generate royalties until published and sold).
`,

  'General Inquiry': `
GENERAL BOOKLEAF INFORMATION:
- BookLeaf is a self-publishing company operating in India and the US, helping authors publish, distribute, and sell their books.
- Authors retain copyright of their work.
- For account changes (email, phone, bank details), submit a ticket or contact support@bookleaf.com with ID proof.
- BookLeaf's standard support response time is 1-2 business days for general inquiries, 24-48 hours for urgent/critical issues.
- For partnership or bulk order inquiries, email partnerships@bookleaf.com.
`,
};

/**
 * Returns the KB section for the given category, plus the production-stage
 * addendum when the category is "Book Status & Production Updates".
 */
export function getKbSection(category) {
  return KB[category] ?? KB['General Inquiry'];
}

/**
 * One few-shot example per category — ground the model on the expected tone.
 */
export const FEW_SHOT_EXAMPLES = {
  'Royalty & Payments': `
Q: I haven't received my royalty for the last quarter. My book sold well and I expected a payment.
A: Thank you for writing in. We completely understand how important timely royalty payments are.
Royalties for each quarter are calculated after the quarter closes and released within 45 days.
For Q3 (July–September), payment is due by mid-November. If you have not received it by that date, please reply and our finance team will investigate within 48 hours.
If your pending amount is below ₹1,000, it automatically rolls over to the next cycle per our policy — we will confirm which applies in your case.
Please ensure your bank details are up to date on the portal. Team BookLeaf Support.`,

  'ISBN & Metadata Issues': `
Q: The ISBN on my book's Amazon listing is different from what's printed on the physical copy.
A: Thank you for flagging this — an ISBN discrepancy between the physical book and the Amazon listing is a serious issue that we take very seriously.
We have escalated this to our metadata team for immediate investigation. We will file a correction request with Amazon within 24 hours and keep you updated at every step.
In the meantime, please do not promote the incorrect listing. We aim to have this fully resolved within 3-5 business days. Apologies for the inconvenience caused. Team BookLeaf Support.`,

  'Printing & Quality': `
Q: I received my author copies and several pages are blurry and misaligned.
A: We sincerely apologize for the print quality issues with your author copies — this is not the standard we hold ourselves to.
To process a replacement, could you please share clear photos of the defective pages as a reply to this ticket? Our print quality team will review within 3-5 business days and arrange a reprint of the affected copies at no cost to you.
We appreciate your patience and will keep you updated throughout the process. Team BookLeaf Support.`,

  'Distribution & Availability': `
Q: My book is showing as "Currently Unavailable" on Amazon India even though it was published months ago.
A: Thank you for bringing this to our attention. A "Currently Unavailable" status on Amazon typically indicates a stock sync issue on their end.
We have initiated a re-sync request with Amazon for your title. This process usually takes 3-5 business days to reflect on their platform.
If the listing does not go live within that window, please reply to this ticket and we will escalate directly with Amazon's seller team. We apologize for the disruption to your book's availability. Team BookLeaf Support.`,

  'Book Status & Production Updates': `
Q: My book has been in the Cover Design stage for 3 weeks. When will it move to typesetting?
A: Thank you for reaching out about your book's production status. Cover Design is one of the more collaborative stages — each author revision round adds 3-5 business days to the timeline.
Our production team will review the current status of your cover and provide you with a specific update and timeline within 48 hours.
Once the cover is approved by you, typesetting typically takes 1-2 weeks, followed by proofreading (1 week) before we move to printing.
We appreciate your patience and look forward to getting your book to publication. Team BookLeaf Support.`,

  'General Inquiry': `
Q: How do I update my bank account details for royalty payments?
A: Thank you for getting in touch. To update your bank account details, please reply to this ticket with the following: your Author ID, the new bank account number and IFSC code (for India) or routing/account number (for US), and a copy of a recent bank statement or a voided cheque for verification.
Our team will update your payment information within 2-3 business days and confirm once done. For security, bank detail changes require identity verification. Team BookLeaf Support.`,
};
