export type PaymentAccount = 'CASH' | 'NMB_CARD' | 'MPESA_271' | 'CRDB' | 'CRDB_USD';

export interface RealTimeDay {
  id: string;
  op_date: string;
  notes: string | null;
  opening_cash: number;
  opening_nmb_card: number;
  opening_mpesa_271: number;
  opening_crdb: number;
  opening_crdb_usd: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface RealTimeEntry {
  id: string;
  day_id: string;
  item: string;
  description: string;
  payment_account: PaymentAccount;
  amount: number;
  reference_no: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface RealTimeEntryRow extends RealTimeEntry {
  cash_col: number | null;
  nmb_card_col: number | null;
  mpesa_271_col: number | null;
  crdb_col: number | null;
  crdb_usd_col: number | null;
  running_total: number;
}

export interface DaySummary {
  totalInflows: number;
  totalOutflows: number;
  netMovement: number;
  closingBalance: number;
  closingCash: number;
  closingNmbCard: number;
  closingMpesa271: number;
  closingCrdb: number;
  closingCrdbUsd: number;
}

export const PAYMENT_ACCOUNT_LABELS: Record<PaymentAccount, string> = {
  CASH: 'Cash',
  NMB_CARD: 'NMB Card',
  MPESA_271: 'MPESA (271)',
  CRDB: 'CRDB',
  CRDB_USD: 'CRDB USD',
};

export const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  'CASH',
  'NMB_CARD',
  'MPESA_271',
  'CRDB',
  'CRDB_USD',
];
