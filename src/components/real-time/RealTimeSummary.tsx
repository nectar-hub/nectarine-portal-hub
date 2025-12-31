import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowRightLeft, Wallet } from 'lucide-react';
import type { DaySummary } from '@/types/real-time';
import { cn } from '@/lib/utils';

interface RealTimeSummaryProps {
  summary: DaySummary;
  hasDay: boolean;
}

const safeNum = (val: number | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  return Number(val);
};

const formatCurrency = (val: number): string => {
  return safeNum(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const RealTimeSummary = ({ summary, hasDay }: RealTimeSummaryProps) => {
  if (!hasDay) {
    return null;
  }

  const stats = [
    {
      title: 'Total Inflows',
      value: formatCurrency(summary.totalInflows),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Outflows',
      value: formatCurrency(summary.totalOutflows),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Net Movement',
      value: formatCurrency(summary.netMovement),
      icon: ArrowRightLeft,
      color: summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.netMovement >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
    {
      title: 'Closing Balance',
      value: formatCurrency(summary.closingBalance),
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Daily Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={cn('text-lg font-bold', stat.color)}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Closing Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Cash</p>
              <p className="font-semibold">{formatCurrency(summary.closingCash)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">NMB Card</p>
              <p className="font-semibold">{formatCurrency(summary.closingNmbCard)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">MPESA (271)</p>
              <p className="font-semibold">{formatCurrency(summary.closingMpesa271)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">CRDB</p>
              <p className="font-semibold">{formatCurrency(summary.closingCrdb)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">CRDB USD</p>
              <p className="font-semibold">{formatCurrency(summary.closingCrdbUsd)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
