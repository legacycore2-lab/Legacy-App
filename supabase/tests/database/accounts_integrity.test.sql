begin;

select plan(6);

insert into public.accounts (
  id, code, name_ar, account_type, normal_balance, level, is_postable
)
values (
  '61000000-0000-0000-0000-000000000001',
  '6100',
  'أصل رئيسي',
  'asset',
  'debit',
  9,
  false
);

select is(
  (select level from public.accounts where id = '61000000-0000-0000-0000-000000000001'),
  1,
  'root account level is derived by the database'
);

select lives_ok(
  $$insert into public.accounts (
      id, code, name_ar, account_type, normal_balance, parent_id, level, is_postable
    ) values (
      '61000000-0000-0000-0000-000000000002',
      '6110',
      'أصل فرعي',
      'asset',
      'debit',
      '61000000-0000-0000-0000-000000000001',
      9,
      true
    )$$,
  'valid child account is accepted'
);

select is(
  (select level from public.accounts where id = '61000000-0000-0000-0000-000000000002'),
  2,
  'child level is derived from its parent'
);

select throws_ok(
  $$insert into public.accounts (
      code, name_ar, account_type, normal_balance, parent_id, level, is_postable
    ) values (
      '6120',
      'نوع غير متوافق',
      'liability',
      'credit',
      '61000000-0000-0000-0000-000000000001',
      2,
      true
    )$$,
  '23514',
  'Child account type must match parent account type',
  'mixed account types are rejected'
);

select throws_ok(
  $$insert into public.accounts (
      code, name_ar, account_type, normal_balance, parent_id, level, is_postable
    ) values (
      '6111',
      'فرع تحت حساب قابل للترحيل',
      'asset',
      'debit',
      '61000000-0000-0000-0000-000000000002',
      3,
      true
    )$$,
  '23514',
  'Parent account must be non-postable',
  'postable accounts cannot become parents'
);

select throws_ok(
  $$update public.accounts
    set is_active = false
    where id = '61000000-0000-0000-0000-000000000001'$$,
  '23514',
  'Deactivate active child accounts first',
  'parents with active children cannot be deactivated'
);

select * from finish();
rollback;
