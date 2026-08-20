# Rental Application Pack acceptance scenarios

These scenarios define the minimum experience expected before Rental Application Pack Pro can be offered for A$14.90. Passing a source contract or production build alone is not permission to open checkout.

## 1. First application

1. Start with an empty local workspace.
2. Enter a reusable applicant profile without entering an employer name, income amount, TFN or identity-document number.
3. Add a property alias, suburb, weekly rent, move-in date and lease term.
4. Mark document and privacy items independently.
5. Generate all three English messages and confirm that each uses the current property and optional agent name.
6. Save a property TXT and print the preparation summary to PDF.

Expected: one property can be prepared end to end without uploading an original document or sending data to a server.

## 2. Repeated applications

1. Add at least three property candidates.
2. Reuse the applicant profile while keeping property details, document status, privacy checks, messages and notes isolated.
3. Duplicate a prepared candidate and change its property details.
4. Move candidates through inspected, preparing, submitted and follow-up stages.

Expected: repeated data entry is reduced and changing one property never changes another property's application record.

## 3. Follow-up pressure

1. Set one next-action date in the past, one for today and one within three days.
2. Set a completed candidate to approved, declined or withdrawn.

Expected: overdue, today and near-term actions are visibly prioritised; completed candidates no longer show an action warning.

## 4. Privacy mistake prevention

1. Review every privacy check before submission.
2. Confirm that the interface never asks for TFN, card details, bank credentials, passport number or raw identity files.
3. Confirm that the exported summary repeats the sensitive-data warning.

Expected: the product helps the customer prepare and minimise disclosure without claiming that a particular request is unlawful.

## 5. Device loss and recovery

1. Download the whole-workspace JSON backup.
2. Add or change a candidate.
3. Restore the original backup and confirm the replacement warning.
4. Attempt to restore an unrelated or malformed JSON file.

Expected: a valid backup restores all candidates and the reusable profile; an invalid file changes nothing and returns a clear error.

## 6. Sale gate

Before checkout opens, complete the scenarios above on mobile and desktop, verify print-to-PDF output, apply the product-code database migration, and pass a test purchase, access recovery, full refund and immediate entitlement-revocation exercise. Record any complaint-prone ambiguity as a release blocker rather than relying on refund wording to compensate for it.
