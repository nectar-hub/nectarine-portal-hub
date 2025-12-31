import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { RealTimeDay, RealTimeEntryRow, DaySummary } from '@/types/real-time';

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

const formatCurrency = (val: number | null): string => {
  if (val === null) return '';
  return safeNum(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const exportDayToXLSX = (
  day: RealTimeDay,
  entries: RealTimeEntryRow[],
  openingTotal: number,
  summary: DaySummary
) => {
  const wb = XLSX.utils.book_new();

  // Header row
  const headerRow = ['ITEM', 'DESCRIPTION', 'CASH', 'NMB CARD', 'MPESA (271)', 'CRDB', 'CRDB USD', 'TOTAL'];

  // Opening balance row
  const openingRow = [
    'BALANCE B/D',
    'OPENING BALANCE',
    formatCurrency(safeNum(day.opening_cash)),
    formatCurrency(safeNum(day.opening_nmb_card)),
    formatCurrency(safeNum(day.opening_mpesa_271)),
    formatCurrency(safeNum(day.opening_crdb)),
    formatCurrency(safeNum(day.opening_crdb_usd)),
    formatCurrency(openingTotal),
  ];

  // Entry rows
  const dataRows = entries.map((entry) => [
    entry.item,
    entry.description,
    entry.cash_col !== null ? formatCurrency(entry.cash_col) : '',
    entry.nmb_card_col !== null ? formatCurrency(entry.nmb_card_col) : '',
    entry.mpesa_271_col !== null ? formatCurrency(entry.mpesa_271_col) : '',
    entry.crdb_col !== null ? formatCurrency(entry.crdb_col) : '',
    entry.crdb_usd_col !== null ? formatCurrency(entry.crdb_usd_col) : '',
    formatCurrency(entry.running_total),
  ]);

  // Closing balance row
  const closingRow = [
    'CLOSING',
    'CLOSING BALANCE',
    formatCurrency(summary.closingCash),
    formatCurrency(summary.closingNmbCard),
    formatCurrency(summary.closingMpesa271),
    formatCurrency(summary.closingCrdb),
    formatCurrency(summary.closingCrdbUsd),
    formatCurrency(summary.closingBalance),
  ];

  // Build worksheet data
  const wsData = [headerRow, openingRow, ...dataRows, closingRow];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // ITEM
    { wch: 40 }, // DESCRIPTION
    { wch: 15 }, // CASH
    { wch: 15 }, // NMB CARD
    { wch: 15 }, // MPESA (271)
    { wch: 18 }, // CRDB
    { wch: 15 }, // CRDB USD
    { wch: 18 }, // TOTAL
  ];

  const sheetName = format(new Date(day.op_date), 'dd-MMM-yyyy');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `REAL_TIME_${format(new Date(day.op_date), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportMonthToXLSX = async (
  year: number,
  month: number,
  days: Array<{
    day: RealTimeDay;
    entries: RealTimeEntryRow[];
    openingTotal: number;
    summary: DaySummary;
  }>
) => {
  const wb = XLSX.utils.book_new();

  // Add each day as a separate sheet
  days.forEach(({ day, entries, openingTotal, summary }) => {
    const headerRow = ['ITEM', 'DESCRIPTION', 'CASH', 'NMB CARD', 'MPESA (271)', 'CRDB', 'CRDB USD', 'TOTAL'];

    const openingRow = [
      'BALANCE B/D',
      'OPENING BALANCE',
      formatCurrency(safeNum(day.opening_cash)),
      formatCurrency(safeNum(day.opening_nmb_card)),
      formatCurrency(safeNum(day.opening_mpesa_271)),
      formatCurrency(safeNum(day.opening_crdb)),
      formatCurrency(safeNum(day.opening_crdb_usd)),
      formatCurrency(openingTotal),
    ];

    const dataRows = entries.map((entry) => [
      entry.item,
      entry.description,
      entry.cash_col !== null ? formatCurrency(entry.cash_col) : '',
      entry.nmb_card_col !== null ? formatCurrency(entry.nmb_card_col) : '',
      entry.mpesa_271_col !== null ? formatCurrency(entry.mpesa_271_col) : '',
      entry.crdb_col !== null ? formatCurrency(entry.crdb_col) : '',
      entry.crdb_usd_col !== null ? formatCurrency(entry.crdb_usd_col) : '',
      formatCurrency(entry.running_total),
    ]);

    const closingRow = [
      'CLOSING',
      'CLOSING BALANCE',
      formatCurrency(summary.closingCash),
      formatCurrency(summary.closingNmbCard),
      formatCurrency(summary.closingMpesa271),
      formatCurrency(summary.closingCrdb),
      formatCurrency(summary.closingCrdbUsd),
      formatCurrency(summary.closingBalance),
    ];

    const wsData = [headerRow, openingRow, ...dataRows, closingRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];

    const sheetName = format(new Date(day.op_date), 'dd');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Add monthly summary sheet
  const monthlyTotals = {
    totalInflows: days.reduce((s, d) => s + d.summary.totalInflows, 0),
    totalOutflows: days.reduce((s, d) => s + d.summary.totalOutflows, 0),
    operationalDays: days.length,
  };

  const summaryData = [
    ['MONTHLY SUMMARY'],
    [''],
    ['Total Operational Days', monthlyTotals.operationalDays],
    ['Total Inflows', formatCurrency(monthlyTotals.totalInflows)],
    ['Total Outflows', formatCurrency(monthlyTotals.totalOutflows)],
    ['Net Movement', formatCurrency(monthlyTotals.totalInflows - monthlyTotals.totalOutflows)],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  const monthName = format(new Date(year, month - 1, 1), 'MMMM_yyyy');
  const fileName = `REAL_TIME_${monthName}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
