import { describe, it, expect } from 'vitest'
import {
  reconciliationFileName,
  reconciliationRow,
  toReconciliationCsv,
  toReconciliationTsv,
} from '@/utils/paymentReconciliation'

/** CPay reconciliation export: the five columns, safe for a spreadsheet. */
describe('paymentReconciliation', () => {
  const row = {
    providerOrderRef: 'ab12cd34ef',
    providerTransactionRef: 'R1234567',
    amount: 1500,
    currency: 'MKD',
    paidAt: '2026-10-05T09:15:00',
    customerEmail: 'secret@ivy.test',
    userId: 'u-1',
  }

  it('keeps only reference, cPayPaymentRef, amount, currency and paidAt', () => {
    expect(reconciliationRow(row)).toEqual(['ab12cd34ef', 'R1234567', '1500', 'MKD', '2026-10-05T09:15:00'])
    expect(reconciliationRow({ providerOrderRef: 'x' })).toEqual(['x', '', '', '', ''])
    expect(toReconciliationCsv([row])).not.toContain('secret')
  })

  it('CSV: header, CRLF, quoting, and no formulas', () => {
    const csv = toReconciliationCsv([row, { ...row, providerTransactionRef: '=HYPERLINK("x")', providerOrderRef: 'a,b' }])
    expect(csv.split('\r\n')).toEqual([
      'reference,cPayPaymentRef,amount,currency,paidAt',
      'ab12cd34ef,R1234567,1500,MKD,2026-10-05T09:15:00',
      '"a,b","\'=HYPERLINK(""x"")",1500,MKD,2026-10-05T09:15:00',
      '',
    ])
    expect(toReconciliationCsv([])).toBe('reference,cPayPaymentRef,amount,currency,paidAt\r\n')
  })

  it('TSV for "copy": tab-separated, tabs/newlines inside a value flattened', () => {
    expect(toReconciliationTsv([{ ...row, providerTransactionRef: 'R1\t2\n3' }]))
      .toBe('reference\tcPayPaymentRef\tamount\tcurrency\tpaidAt\nab12cd34ef\tR1 2 3\t1500\tMKD\t2026-10-05T09:15:00')
  })

  it('file name says status and period', () => {
    expect(reconciliationFileName({ status: 'SUCCESS', from: '2026-10-05', to: '2026-10-11' }))
      .toBe('cpay-payments-success-2026-10-05_2026-10-11.csv')
    expect(reconciliationFileName({ status: '', from: '', to: '2026-10-11' })).toBe('cpay-payments-all-start_2026-10-11.csv')
    expect(reconciliationFileName({})).toBe('cpay-payments-all.csv')
  })
})
