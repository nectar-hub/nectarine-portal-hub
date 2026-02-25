import { Check, Clock, CreditCard, Package, Truck, MapPin, ShoppingBag, XCircle } from 'lucide-react';
import type { BfmOrderStatus } from '@/types/bfm';

const steps: { status: BfmOrderStatus; label: string; icon: any }[] = [
  { status: 'SUBMITTED', label: 'Submitted', icon: Clock },
  { status: 'AWAITING_PAYMENT', label: 'Awaiting Payment', icon: CreditCard },
  { status: 'PAID', label: 'Paid', icon: Check },
  { status: 'PURCHASED', label: 'Purchased', icon: ShoppingBag },
  { status: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
  { status: 'READY_FOR_PICKUP', label: 'Ready', icon: MapPin },
  { status: 'DELIVERED', label: 'Delivered', icon: Package },
];

const statusOrder: Record<string, number> = {};
steps.forEach((s, i) => { statusOrder[s.status] = i; });

export const OrderStatusTimeline = ({ status }: { status: BfmOrderStatus }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = statusOrder[status] ?? -1;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.status} className="flex items-center">
            <div className={`flex flex-col items-center min-w-[60px] ${isCurrent ? 'scale-110' : ''}`}>
              <div className={`rounded-full p-1.5 ${isCompleted ? 'bg-nectarine-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${isCompleted ? 'text-nectarine-600 font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-6 h-0.5 ${idx < currentIdx ? 'bg-nectarine-500' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
