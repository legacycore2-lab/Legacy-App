alter table public.advances add column if not exists advance_ledger_account_id uuid references public.accounts(id) on delete restrict;
alter table public.advances add column if not exists issue_transaction_id uuid references public.cash_bank_transactions(id) on delete restrict;

create table if not exists public.advance_transactions (
  id uuid primary key default gen_random_uuid(), advance_id uuid not null references public.advances(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('expense','return')), project_id uuid references public.projects(id) on delete restrict,
  transaction_date date not null, amount numeric(18,2) not null check (amount > 0), description text not null,
  source_record_id uuid not null, client_request_id uuid not null unique, created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.advance_transactions enable row level security;
revoke all on public.advance_transactions from anon;
grant select, insert on public.advance_transactions to authenticated;
create policy advance_transactions_select_finance on public.advance_transactions for select to authenticated using (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));
create policy advance_transactions_insert_finance on public.advance_transactions for insert to authenticated with check (coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') in ('super_admin','admin','accountant'));

create or replace function public.post_advance(p_client_request_id uuid,p_holder_name text,p_holder_title text,p_project_ids uuid[],p_source_account_id uuid,p_advance_ledger_account_id uuid,p_issue_date date,p_due_date date,p_purpose text,p_amount numeric) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_id uuid; v_cash_transaction uuid; v_project uuid;
begin
  if coalesce((select auth.jwt())->'app_metadata'->>'role','viewer') not in ('admin','accountant') then raise exception 'Insufficient permissions' using errcode='42501'; end if;
  if p_client_request_id is null or btrim(coalesce(p_holder_name,''))='' or cardinality(p_project_ids)=0 or p_advance_ledger_account_id is null then raise exception 'Required advance data is missing' using errcode='22023'; end if;
  if not exists(select 1 from public.accounts where id=p_advance_ledger_account_id and account_type='asset' and is_postable and is_active) then raise exception 'Advance ledger account is unavailable' using errcode='23503'; end if;
  v_cash_transaction := public.post_cash_bank_withdrawal(p_client_request_id,p_source_account_id,p_advance_ledger_account_id,p_issue_date,p_amount,'صرف عهدة: '||btrim(p_holder_name),null);
  insert into public.advances(holder_name,holder_title,issue_date,due_date,purpose,amount,advance_ledger_account_id,issue_transaction_id)
  values(btrim(p_holder_name),nullif(btrim(coalesce(p_holder_title,'')),''),p_issue_date,p_due_date,btrim(p_purpose),round(p_amount,2),p_advance_ledger_account_id,v_cash_transaction) returning id into v_id;
  foreach v_project in array p_project_ids loop insert into public.advance_projects(advance_id,project_id) values(v_id,v_project); end loop;
  return v_id;
end $$;

create or replace function public.post_advance_expense(p_client_request_id uuid,p_advance_id uuid,p_project_id uuid,p_expense_account_id uuid,p_transaction_date date,p_description text,p_amount numeric) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_entry uuid; v_ledger uuid; v_remaining numeric;
begin
  select advance_ledger_account_id, amount-spent_amount-returned_amount into v_ledger,v_remaining from public.advances where id=p_advance_id for update;
  if v_ledger is null or p_amount<=0 or p_amount>v_remaining then raise exception 'Invalid advance expense amount' using errcode='23514'; end if;
  if not exists(select 1 from public.advance_projects where advance_id=p_advance_id and project_id=p_project_id) then raise exception 'Project is not linked to advance' using errcode='23503'; end if;
  v_entry := public.post_single_line_entry(p_client_request_id,p_transaction_date,p_project_id,'expense',p_expense_account_id,p_description,'',v_ledger,p_amount);
  insert into public.advance_transactions(advance_id,transaction_type,project_id,transaction_date,amount,description,source_record_id,client_request_id) values(p_advance_id,'expense',p_project_id,p_transaction_date,round(p_amount,2),btrim(p_description),v_entry,p_client_request_id);
  update public.advances set spent_amount=spent_amount+round(p_amount,2),updated_at=now() where id=p_advance_id;
  return v_entry;
end $$;

create or replace function public.post_advance_return(p_client_request_id uuid,p_advance_id uuid,p_destination_account_id uuid,p_transaction_date date,p_description text,p_amount numeric) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_transaction uuid; v_ledger uuid; v_remaining numeric;
begin
  select advance_ledger_account_id, amount-spent_amount-returned_amount into v_ledger,v_remaining from public.advances where id=p_advance_id for update;
  if v_ledger is null or p_amount<=0 or p_amount>v_remaining then raise exception 'Invalid advance return amount' using errcode='23514'; end if;
  v_transaction := public.post_cash_bank_deposit(p_client_request_id,p_destination_account_id,v_ledger,p_transaction_date,p_amount,p_description,null);
  insert into public.advance_transactions(advance_id,transaction_type,transaction_date,amount,description,source_record_id,client_request_id) values(p_advance_id,'return',p_transaction_date,round(p_amount,2),btrim(p_description),v_transaction,p_client_request_id);
  update public.advances set returned_amount=returned_amount+round(p_amount,2),updated_at=now() where id=p_advance_id;
  return v_transaction;
end $$;

revoke all on function public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric) from public;
revoke all on function public.post_advance_expense(uuid,uuid,uuid,uuid,date,text,numeric) from public;
revoke all on function public.post_advance_return(uuid,uuid,uuid,date,text,numeric) from public;
grant execute on function public.post_advance(uuid,text,text,uuid[],uuid,uuid,date,date,text,numeric) to authenticated;
grant execute on function public.post_advance_expense(uuid,uuid,uuid,uuid,date,text,numeric) to authenticated;
grant execute on function public.post_advance_return(uuid,uuid,uuid,date,text,numeric) to authenticated;
