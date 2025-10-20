import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/layouts/DashboardLayout';
import AirCargoClients from '@/components/air-cargo/AirCargoClients';
import AirCargoSheet from '@/components/air-cargo/AirCargoSheet';
import PageHeader from '@/components/admin/PageHeader';

const AirCargo = () => {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Air Cargo Management"
          description="Manage air cargo clients and shipments"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="sheet">Air Cargo Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            <AirCargoClients />
          </TabsContent>

          <TabsContent value="sheet" className="mt-6">
            <AirCargoSheet />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AirCargo;
