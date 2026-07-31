# Cash & Banks data model

## Status

Design and migration are **for review only**. Nothing in this change applies SQL to Supabase.

## Purpose

The Cash & Banks module needs operational accounts and movements without treating the chart of accounts itself as a bank-account registry. The design therefore separates:

- `accounts`: accounting ledger identity.
- `cash_bank_accounts`: operational cash/bank metadata.
- `cash_bank_transactions`: deposits, withdrawals, and transfers.
- `journals`: the posted double-entry result.

## Core rules

1. Every operational cash/bank account maps one-to-one to a postable ledger account.
2. All amounts are positive; direction is determined by source and destination.
3. Deposits require only a destination account.
4. Withdrawals require only a source account.
5. Transfers require different source and destination accounts.
6. Draft movements never affect balances.
7. Posted movements require a linked journal and posting timestamp.
8. Voided movements are preserved for audit instead of being deleted.
9. Balances are calculated from opening balance plus posted movements.
10. The foundation is EGP-only to match the current Egyptian deployment.

## Application architecture

```text
CashBanksPage
  -> useCashBanks
  -> cashBanksService
  -> cashBanksRepository
  -> Supabase
```

The repository will read from `cash_bank_account_balances` and `cash_bank_transactions`. Mapping and KPI calculations remain in the service layer. Pages only render the final view model.

## Security proposal

- Authenticated users can read accounts and movements.
- Only `admin` and `accountant` can create or modify them.
- No hard-delete policy is exposed to the client.
- Posting and voiding should be implemented later through controlled RPC functions in a separate approved migration.

## Deliberately excluded from this foundation

- Seed or mock rows.
- Automatic posting RPCs.
- Reversal RPCs.
- Multi-currency support.
- Cheque lifecycle.
- Bank reconciliation.
- Supabase execution or deployment.
