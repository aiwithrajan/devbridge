# Repository Architectural Constraints (DevBridge Generated)

These architectural rules were dictated via Wispr Flow during AI build waits and saved into repository Architecture Decision Records (ADRs).
Cursor and Antigravity inherit these constraints for future code generations.

- [ADR-0001](docs/adr/0001-reject-expired-refresh-tokens.md): Expired refresh tokens must strictly return 401 with required client re-authentication. No silent reissue.
- [ADR-0002](docs/adr/0002-concurrent-batch-processing.md): Batch worker queues must enforce a concurrency cap of 5 using p-limit to protect the database pool.
- [ADR-0003](docs/adr/0003-keyset-cursor-pagination.md): Unbounded queries on collections must use keyset cursor pagination with a maximum limit of 50.
- [ADR-0004](docs/adr/0004-timing-safe-webhook-hmac.md): External webhooks must verify signatures using crypto.timingSafeEqual with a 5-minute maximum clock skew tolerance.
