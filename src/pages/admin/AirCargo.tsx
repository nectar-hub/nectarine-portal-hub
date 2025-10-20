import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import AirCargoClients from '@/components/air-cargo/AirCargoClients';
import AirCargoSheet from '@/components/air-cargo/AirCargoSheet';
import ConsignmentsList from '@/components/air-cargo/ConsignmentsList';
import PageHeader from '@/components/admin/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AirCargo = () => {
  const [activeTab, setActiveTab] = useState('consignments');
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string>();

  const handleSelectConsignment = (consignmentId: string) => {
    setSelectedConsignmentId(consignmentId);
    setActiveTab('sheet');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Air Cargo Management"
          description="Manage consignments, clients, and shipments"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="consignments">Consignments</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="sheet">Shipments</TabsTrigger>
          </TabsList>

          <TabsContent value="consignments" className="mt-6">
            <ConsignmentsList 
              onSelectConsignment={handleSelectConsignment}
              selectedConsignmentId={selectedConsignmentId}
            />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <AirCargoClients />
          </TabsContent>

          <TabsContent value="sheet" className="mt-6">
            <AirCargoSheet consignmentId={selectedConsignmentId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AirCargo;
