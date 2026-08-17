# Journal to Cash & Banks synchronization

Single-line project entries continue to use `post_single_line_entry`, which creates the project
entry and its balanced journal. After that RPC succeeds, the journal repository checks whether the
selected asset ledger account is linked to an active operational `cash_bank_accounts` record.

When it is linked, the application writes one posted movement against the journal that already
exists:

- an expense creates a withdrawal from the linked operational account;
- income creates a deposit into the linked operational account;
- the movement reuses the journal instead of invoking a Cash & Banks posting RPC, so no second
  journal or duplicate ledger impact is created;
- `client_request_id` is checked before insertion and protected by the database's partial unique
  index, making retries safe without relying on an incompatible PostgREST upsert conflict target.

Asset accounts that are not configured in Cash & Banks remain valid journal payment accounts and do
not produce an operational movement.

## Atomicity limitation

Without a database transaction/RPC change, creating the journal entry and creating its operational
movement are two Supabase requests. A connection or permission failure after the first request can
temporarily leave the journal posted without its Cash & Banks movement. The form keeps the same
request identifier when submission fails, so retrying completes the missing movement without
creating another entry or movement. Full all-or-nothing behavior requires a future database RPC
change.

Advance issuance is intentionally unchanged. `post_advance` already calls
`post_cash_bank_withdrawal` inside its database transaction, so adding application-side propagation
would duplicate both the movement and its balance impact.

## Reversal and deletion

Posted single-line entries follow the accounting golden rule: they are immutable and can only be
reversed. When the entry has a linked operational Cash & Banks movement, the application creates
one inverse movement and links it to the journal already produced by `reverse_journal_entry`. It
does not call the standalone Cash & Banks reversal RPC, because that RPC would create another
journal and double the ledger reversal. Retries first discover the existing journal and movement
reversal links, so they complete missing work without duplicating either record.

Permanent deletion is exposed only for draft journals. Posted and reversed journals retain their
original record, actor and timestamps as the audit trail.

Because schema and RPC changes are out of scope, journal reversal and operational movement reversal
remain two Supabase requests. A failure between them is recoverable by retrying the same action, but
the operation is not fully atomic. A future database RPC is required for all-or-nothing execution.
