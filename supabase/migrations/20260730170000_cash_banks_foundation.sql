-- Cash & Banks foundation
-- REVIEW ONLY: this migration is intentionally committed for review and must not be applied
-- to any Supabase environment without explicit approval.

create sequence if not exists public.cash_bank_transaction_number_seq start 20001;

create table if not exists public.cash_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  ledger_account_id uuid not null unique references public.accounts(id) on delete restrict,
  name text not null,
  account_kind text not null check (account_kind in ('cash', 'bank')),
  bank_name text,
  account_number text,
  iban text,
  branch_name text,
  opening_balance numeric(18,2) not null default 0,
  currency_code text not null default 'EGP' check (currency_code = 'EGP'),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_bank_accounts_name_not_blank check (length(trim(name)) > 0),
  constraint cash_bank_accounts_bank_fields check (
    account_kind = 'bank'
    or (bank_name is null and account_number is null and iban is null and branch_name is null)
  )
);

create unique index if not exists cash_bank_accounts_name_unique
  on public.cash_bank_accounts (lower(trim(name)));

create index if not exists cash_bank_accounts_kind_active_idx
  on public.cash_bank_accounts (account_kind, is_active);

create table if not exists public.cash_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number bigint not null unique
    default nextval('public.cash_bank_transaction_number_seq'),
  transaction_date date not null default current_date,
  transaction_type text not null
    check (transaction_type in ('deposit', 'withdrawal', 'transfer')),
  source_account_id uuid references public.cash_bank_accounts(id) on delete restrict,
  destination_account_id uuid references public.cash_bank_accounts(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  description text not null,
  reference_number text,
  status text not null default 'draft'
    check (status in ('draft', 'posted', 'void')),
  journal_id uuid unique references public.journals(id) on delete restrict,
  posted_at timestamptz,
  voided_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_bank_transactions_description_not_blank
    check (length(trim(description)) > 0),
  constraint cash_bank_transactions_accounts_are_different
    check (
      source_account_id is null
      or destination_account_id is null
      or source_account_id <> destination_account_id
    ),
  constraint cash_bank_transactions_shape check (
    (transaction_type = 'deposit'
      and source_account_id is null
      and destination_account_id is not null)
    or
    (transaction_type = 'withdrawal'
      and source_account_id is not null
      and destination_account_id is null)
    or
    (transaction_type = 'transfer'
      and source_account_id is not null
      and destination_account_id is not null)
  ),
  constraint cash_bank_transactions_posting_state check (
    (status = 'draft' and journal_id is null and posted_at is null and voided_at is null)
    or
    (status = 'posted' and journal_id is not null and posted_at is not null and voided_at is null)
    or
    (status = 'void' and voided_at is not null)
  )
);

create index if not exists cash_bank_transactions_date_number_idx
  on public.cash_bank_transactions (transaction_date desc, transaction_number desc);

create index if not exists cash_bank_transactions_source_idx
  on public.cash_bank_transactions (source_account_id, transaction_date desc)
  where source_account_id is not null;

create index if not exists cash_bank_transactions_destination_idx
  on public.cash_bank_transactions (destination_account_id, transaction_date desc)
  where destination_account_id is not null;

create index if not exists cash_bank_transactions_status_idx
  on public.cash_bank_transactions (status, transaction_date desc);

create or replace view public.cash_bank_account_balances
with (security_invoker = true)
as
select
  account.id,
  account.ledger_account_id,
  account.name,
  account.account_kind,
  account.bank_name,
  account.account_number,
  account.iban,
  account.branch_name,
  account.currency_code,
  account.is_active,
  account.opening_balance
    + coalesce(sum(
        case
          when movement.status = 'posted'
            and movement.destination_account_id = account.id then movement.amount
          when movement.status = 'posted'
            and movement.source_account_id = account.id then -movement.amount
          else 0
        end
      ), 0) as current_balance
from public.cash_bank_accounts account
left join public.cash_bank_transactions movement
  on movement.source_account_id = account.id
  or movement.destination_account_id = account.id
group by account.id;

alter table public.cash_bank_accounts enable row level security;
alter table public.cash_bank_transactions enable row level security;

create policy cash_bank_accounts_select_authenticated
  on public.cash_bank_accounts
  for select
  to authenticated
  using (true);

create policy cash_bank_accounts_write_finance
  on public.cash_bank_accounts
  for all
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
  );

create policy cash_bank_transactions_select_authenticated
  on public.cash_bank_transactions
  for select
  to authenticated
  using (true);

create policy cash_bank_transactions_write_finance
  on public.cash_bank_transactions
  for all
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
  )
  with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'viewer') in ('admin', 'accountant')
  );

comment on table public.cash_bank_accounts is
  'Operational cash and bank accounts linked one-to-one with the chart of accounts.';
comment on table public.cash_bank_transactions is
  'Draft, posted, or void cash/bank deposits, withdrawals, and transfers.';
comment on view public.cash_bank_account_balances is
  'Current EGP balance per operational cash/bank account using posted transactions only.';
