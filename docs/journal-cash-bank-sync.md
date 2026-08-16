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
- `client_request_id` makes a retry safe and prevents the balance from changing twice.

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
