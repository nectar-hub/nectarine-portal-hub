import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { PurchaseTrackerGrid } from '@/components/purchase-tracker/PurchaseTrackerGrid';
import { PurchaseTrackerToolbar } from '@/components/purchase-tracker/PurchaseTrackerToolbar';
import { PurchaseTracker as PurchaseTrackerType } from '@/types/purchase-tracker';
import { Loader2 } from 'lucide-react';

console.log('[PurchaseTracker MODULE] Loading PurchaseTracker module...');

const PurchaseTracker = () => {
  console.log('[PurchaseTracker] Component mounted - TEST VERSION');
  
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground">Purchase Tracker - TEST</h1>
        <p className="mt-4 text-muted-foreground">If you can see this, the route is working!</p>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseTracker;
