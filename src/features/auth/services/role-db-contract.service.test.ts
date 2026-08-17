import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260810200000_unify_finance_roles.sql')
const migration = readFileSync(migrationPath, 'utf8').replace(/\r\n/g, '\n')

describe('finance role database contract', () => {
  it('covers all 27 RLS policies from the approved remediation plan', () => {
    const policies = [
      'projects_insert_finance',
      'projects_update_finance',
      'projects_delete_admin',
      'entries_select_finance',
      'entries_insert_finance',
      'entries_update_finance',
      'entries_delete_admin',
      'journals_select_finance',
      'journals_insert_finance',
      'journals_update_finance',
      'journal_lines_select_finance',
      'journal_lines_insert_finance',
      'journal_lines_update_finance',
      'journal_lines_delete_finance',
      'accounts_insert_finance',
      'accounts_update_finance',
      'cash_bank_accounts_select_authenticated',
      'cash_bank_accounts_write_finance',
      'cash_bank_transactions_select_authenticated',
      'cash_bank_transactions_write_finance',
      'entry_attachments_select_finance',
      'entry_attachments_insert_finance',
      'entry_attachments_delete_finance',
      'entry_attachments_objects_select_finance',
      'entry_attachments_objects_insert_finance',
      'entry_attachments_objects_update_finance',
      'entry_attachments_objects_delete_finance',
    ]

    expect(policies).toHaveLength(27)
    for (const policy of policies) expect(migration).toContain(policy)
  })

  it('covers all nine effective financial RPCs and the legacy overload', () => {
    const rpcNames = [
      'post_single_line_entry',
      'post_cash_bank_deposit',
      'post_cash_bank_withdrawal',
      'post_cash_bank_transfer',
      'reverse_cash_bank_transaction',
      'post_advance',
      'reverse_posted_journal',
      'import_journal_entries_atomic',
      'reverse_journal_entry',
    ]

    for (const rpc of rpcNames) expect(migration).toContain(rpc)
    expect(migration).toContain(
      'public.post_single_line_entry(\n  date,\n  text,\n  text,\n  text,\n  text,\n  text,\n  text,\n  numeric\n)',
    )
  })

  it('makes super_admin part of the finance guard without granting PUBLIC execute', () => {
    expect(migration).toContain("not in ('super_admin', 'admin', 'accountant')")
    expect(migration).toContain('revoke all on function %s from public')
    expect(migration).toContain('grant execute on function %s to authenticated')
  })

  it('keeps the migration forward-only and fails fast on schema drift', () => {
    expect(migration).not.toMatch(/drop\s+(table|function|policy)/i)
    expect(migration).toContain('Expected policy %.%.% was not found')
    expect(migration).toContain('Expected admin/accountant role guard was not found')
  })
})
