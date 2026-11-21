/**
 * Security Rules Audit Matrix (Phase 0 - Dirty Dozen Assertions)
 * Reference specification for /firestore.rules adversarial verification.
 */
export const DIRTY_DOZEN_ASSERTIONS = [
  { id: 1, target: '/creatorPayouts/{uid}', attack: 'Shadow field injection (isVerifiedByAdmin: true)', expected: 'PERMISSION_DENIED' },
  { id: 2, target: '/creatorPayouts/{uid}', attack: 'Unchecked age18Confirmed: false', expected: 'PERMISSION_DENIED' },
  { id: 3, target: '/creatorPayouts/{uid}', attack: 'Underage birthDate (2012-05-10)', expected: 'PERMISSION_DENIED' },
  { id: 4, target: '/creatorPayouts/{otherUid}', attack: 'Cross-user PII get read', expected: 'PERMISSION_DENIED' },
  { id: 5, target: '/creatorPayouts', attack: 'Collection-wide PII list scrape', expected: 'PERMISSION_DENIED' },
  { id: 6, target: '/books/{bookId}', attack: 'Paid book creation without verified 18+ payout profile', expected: 'PERMISSION_DENIED' },
  { id: 7, target: '/books/{bookId}', attack: 'Author UID spoofing (authorId != auth.uid)', expected: 'PERMISSION_DENIED' },
  { id: 8, target: '/books', attack: 'Unfiltered list exposing private drafts', expected: 'PERMISSION_DENIED' },
  { id: 9, target: '/books/{longInvalidId}', attack: 'ID poisoning (>128 chars or invalid chars)', expected: 'PERMISSION_DENIED' },
  { id: 10, target: '/purchases/{purchaseId}', attack: 'Price tampering (amountCents != book.priceCents)', expected: 'PERMISSION_DENIED' },
  { id: 11, target: '/books/{bookId}', attack: 'Backdated timestamp (createdAt != request.time)', expected: 'PERMISSION_DENIED' },
  { id: 12, target: '/users/{uid}', attack: 'Unverified email write (email_verified == false)', expected: 'PERMISSION_DENIED' }
] as const;
