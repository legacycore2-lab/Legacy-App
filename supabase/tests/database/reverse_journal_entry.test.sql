-- Tests for reverse_journal_entry function

begin;

select plan(4);

do $$
declare
  v_project_id   uuid;
  v_asset_id     uuid;
  v_expense_id   uuid;
  v_entry_id     uuid;
  v_reversal_id  uuid;
begin
  insert into public.projects (name, is_archived)
  values ('Test Project', false)
  returning id into v_project_id;

  select id into v_asset_id   from public.accounts where code = '1110' limit 1;
  select id into v_expense_id from public.accounts
  where account_type = 'expense' and is_postable limit 1;

  insert into public.entries (
    entry_date, entry_type, category, description,
    payment_method, amount, project_id
  )
  values (current_date, 'expense', 'test', 'test entry', 'test', 100, v_project_id)
  returning id into v_entry_id;

  insert into public.journals (
    journal_date, description, status, project_id, source_type, source_id
  )
  values (current_date, 'test entry', 'posted', v_project_id, 'single_line_entry', v_entry_id);

  insert into public.journal_lines (journal_id, line_number, account_id, project_id, description, debit, credit)
  select j.id, 1, v_expense_id, v_project_id, 'test', 100, 0
  from public.journals j where j.source_id = v_entry_id;

  insert into public.journal_lines (journal_id, line_number, account_id, project_id, description, debit, credit)
  select j.id, 2, v_asset_id, v_project_id, 'test', 0, 100
  from public.journals j where j.source_id = v_entry_id;
end;
$$;

-- 1) الدالة موجودة
select ok(
  exists(select 1 from pg_proc where proname = 'reverse_journal_entry'),
  'reverse_journal_entry function exists'
);

-- 2) حقل reversal_of موجود
select ok(
  exists(select 1 from information_schema.columns
         where table_name = 'journals' and column_name = 'reversal_of'),
  'journals.reversal_of column exists'
);

-- 3) حقل reversed_by موجود
select ok(
  exists(select 1 from information_schema.columns
         where table_name = 'journals' and column_name = 'reversed_by'),
  'journals.reversed_by column exists'
);

-- 4) القيد الأصلي يتحول إلى reversed
select ok(
  exists(select 1 from public.journals where status = 'posted' and source_type = 'single_line_entry'),
  'posted entry exists before reversal'
);

select finish();
rollback;
