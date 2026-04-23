# Security Specification - Cinéphile

## 1. Data Invariants
- A watchlist item cannot exist without being tied to a valid, authenticated user.
- Users can only read and write their own profile and watchlist.
- Ratings must be integers between 1 and 5.
- Users can only rate each movie once.
- Email verification is required for all write operations to enhance security.
- Document IDs must be validated to prevent resource exhaustion/poisoning.

## 2. The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **PII Leak**: Authenticated User B attempts to read User A's profile.
3. **Ghost Fields**: Attempt to create a user profile with an unauthorized `isAdmin` field.
4. **Invalid IDs**: Attempt to use a 2MB string as a `movieId` path variable.
5. **Unverified Write**: Attempt to add to watchlist with `email_verified: false`.
6. **Watchlist Scraping**: Attempt to list another user's watchlist.
7. **Type Poisoning**: Sending a string for the movie `id` (which should be a number).
8. **Shadow Update**: Attempt to update `uid` in user profile.
9. **Oversized Strings**: Sending a 10MB string as a movie `title`.
10. **Malicious Paths**: Attempting to use `../` or special characters in IDs.
11. **Stale Data**: Attempting to set `addedAt` to a future/past date instead of `request.time`.
12. **Anonymous Access**: Unauthenticated access to any collection.

## 3. Test Cases (Security Rules Architecture)
- `tests/firestore.rules.test.ts` will verify these payloads are blocked.
