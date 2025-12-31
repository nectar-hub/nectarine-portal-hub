import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_LABELS, type PaymentAccount } from '@/types/real-time';

interface RealTimeEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: {
    item: string;
    description: string;
    payment_account: PaymentAccount;
    amount: number;
    reference_no?: string;
  }) => void;
  initialData?: {
    item: string;
    description: string;
    payment_account: PaymentAccount;
    amount: number;
    reference_no?: string;
  };
  mode?: 'add' | 'edit';
}

export const RealTimeEntryForm = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'add',
}: RealTimeEntryFormProps) => {
  const [formData, setFormData] = useState({
    item: initialData?.item || '',
    description: initialData?.description || '',
    payment_account: initialData?.payment_account || 'CASH' as PaymentAccount,
    amount: initialData?.amount || 0,
    reference_no: initialData?.reference_no || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      reference_no: formData.reference_no || undefined,
    });
    onOpenChange(false);
    // Reset form
    setFormData({
      item: '',
      description: '',
      payment_account: 'CASH',
      amount: 0,
      reference_no: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Entry' : 'Edit Entry'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item *</Label>
            <Input
              id="item"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              placeholder="e.g., ORDER, RENT, SALARY"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., PAID FOR INV-12345 BY CLIENT NAME"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_account">Payment Account *</Label>
              <Select
                value={formData.payment_account}
                onValueChange={(value: PaymentAccount) =>
                  setFormData({ ...formData, payment_account: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_ACCOUNTS.map((account) => (
                    <SelectItem key={account} value={account}>
                      {PAYMENT_ACCOUNT_LABELS[account]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Positive = income, Negative = expense"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use negative for expenses
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_no">Reference No. (Optional)</Label>
            <Input
              id="reference_no"
              value={formData.reference_no}
              onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
              placeholder="e.g., INV-12345"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === 'add' ? 'Add Entry' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
