import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MonthPeriod, getMonthLabel } from '@/types/month-period';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface MonthPeriodSelectorProps {
  selectedPeriodId: string | null;
  onPeriodChange: (periodId: string | null) => void;
}

export const MonthPeriodSelector = ({ selectedPeriodId, onPeriodChange }: MonthPeriodSelectorProps) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());

  const { data: periods = [] } = useQuery({
    queryKey: ['month-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('month_periods')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data as MonthPeriod[];
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('month_periods')
        .insert({ month: newMonth, year: newYear, status: 'OPEN' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['month-periods'] });
      onPeriodChange(data.id);
      setIsCreateOpen(false);
      toast.success('Month period created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create month period');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'OPEN' | 'CLOSED' }) => {
      const { error } = await supabase
        .from('month_periods')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['month-periods'] });
      toast.success('Month period status updated');
    },
  });

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPeriodId || 'all'} onValueChange={(val) => onPeriodChange(val === 'all' ? null : val)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {periods.map((period) => (
            <SelectItem key={period.id} value={period.id}>
              {getMonthLabel(period)} {period.status === 'CLOSED' && '🔒'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPeriod && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleStatusMutation.mutate({
            id: selectedPeriod.id,
            status: selectedPeriod.status === 'OPEN' ? 'CLOSED' : 'OPEN'
          })}
        >
          {selectedPeriod.status === 'OPEN' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Button>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Month
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Month Period</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Month</label>
              <Select value={newMonth.toString()} onValueChange={(val) => setNewMonth(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Year</label>
              <Select value={newYear.toString()} onValueChange={(val) => setNewYear(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createPeriodMutation.mutate()} className="w-full">
              Create Month Period
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
