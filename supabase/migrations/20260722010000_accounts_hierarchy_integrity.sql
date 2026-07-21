-- Enforce chart-of-accounts hierarchy invariants at the database boundary.

create or replace function public.validate_account_hierarchy()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  parent_account public.accounts%rowtype;
  expected_balance text;
begin
  expected_balance := case
    when new.account_type in ('asset', 'expense') then 'debit'
    else 'credit'
  end;

  if new.normal_balance <> expected_balance then
    raise exception 'Account normal balance does not match its type'
      using errcode = '23514';
  end if;

  if new.parent_id is null then
    new.level := 1;
  else
    if new.parent_id = new.id then
      raise exception 'An account cannot be its own parent'
        using errcode = '23514';
    end if;

    select *
    into parent_account
    from public.accounts
    where id = new.parent_id;

    if not found then
      raise exception 'Parent account does not exist'
        using errcode = '23503';
    end if;

    if not parent_account.is_active then
      raise exception 'Parent account must be active'
        using errcode = '23514';
    end if;

    if parent_account.is_postable then
      raise exception 'Parent account must be non-postable'
        using errcode = '23514';
    end if;

    if parent_account.account_type <> new.account_type then
      raise exception 'Child account type must match parent account type'
        using errcode = '23514';
    end if;

    if exists (
      with recursive ancestors as (
        select id, parent_id
        from public.accounts
        where id = new.parent_id

        union all

        select account.id, account.parent_id
        from public.accounts account
        join ancestors on account.id = ancestors.parent_id
      )
      select 1
      from ancestors
      where id = new.id
    ) then
      raise exception 'Account hierarchy cycle detected'
        using errcode = '23514';
    end if;

    new.level := parent_account.level + 1;
  end if;

  if new.level > 10 then
    raise exception 'Account hierarchy exceeds ten levels'
      using errcode = '23514';
  end if;

  if new.is_postable and exists (
    select 1 from public.accounts where parent_id = new.id
  ) then
    raise exception 'An account with children cannot be postable'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.account_type <> old.account_type and exists (
      select 1
      from public.accounts
      where parent_id = new.id
        and account_type <> new.account_type
    ) then
      raise exception 'Account type must remain compatible with child accounts'
        using errcode = '23514';
    end if;

    if old.is_active and not new.is_active then
      if exists (
        select 1
        from public.accounts
        where parent_id = new.id
          and is_active
      ) then
        raise exception 'Deactivate active child accounts first'
          using errcode = '23514';
      end if;

      if exists (
        select 1
        from public.journal_lines
        where account_id = new.id
      ) then
        raise exception 'A referenced account cannot be deactivated'
          using errcode = '23503';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists accounts_validate_hierarchy on public.accounts;
create trigger accounts_validate_hierarchy
before insert or update on public.accounts
for each row
execute function public.validate_account_hierarchy();
