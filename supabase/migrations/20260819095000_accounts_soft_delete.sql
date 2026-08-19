-- Legacy Core ERP
-- Soft deletion support for chart of accounts.
-- Keeps accounting history immutable while allowing unused accounts to be hidden and restored.

begin;

alter table public.accounts
  add column if not exists deleted_at timestamptz;

create index if not exists accounts_deleted_at_idx
  on public.accounts(deleted_at);

comment on column public.accounts.deleted_at is
  'Soft-delete timestamp. NULL means the account is available for normal use.';

commit;
