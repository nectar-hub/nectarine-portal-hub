
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRequests } from "@/hooks/use-requests";
import PageHeader from "@/components/admin/PageHeader";
import StatusFilter from "@/components/admin/StatusFilter";
import RequestsTable from "@/components/admin/RequestsTable";
import LoadingState from "@/components/admin/LoadingState";
import ErrorState from "@/components/admin/ErrorState";
import EmptyState from "@/components/admin/EmptyState";
import AccessDenied from "@/components/admin/AccessDenied";
import { getPageTitleByPath, getPageDescriptionByPath, getRequestTypeByPath } from "@/utils/request-utils";

const Requests = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [filter, setFilter] = useState("all");
  
  const currentPath = location.pathname;
  const requestType = getRequestTypeByPath(currentPath);
  const isBuyRequestsPage = currentPath.includes('/buy-requests');
  const isSelfPurchasesPage = currentPath.includes('/self-purchases');
  
  const { 
    requests, 
    loading, 
    error, 
    processingId, 
    fetchRequests, 
    updateRequestStatus 
  } = useRequests(requestType, filter);

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const handleFilterChange = (value: string) => {
    console.log("Changing filter to:", value);
    setFilter(value);
  };

  const handleRefresh = () => {
    console.log("Refreshing data...");
    fetchRequests();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={getPageTitleByPath(currentPath)}
          description={getPageDescriptionByPath(currentPath)}
        />

        <div className="flex justify-between items-center">
          <StatusFilter 
            value={filter} 
            onValueChange={handleFilterChange} 
          />
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={handleRefresh} />
            ) : requests.length > 0 ? (
              <RequestsTable 
                requests={requests} 
                showType={!isBuyRequestsPage && !isSelfPurchasesPage}
                processingId={processingId}
                onUpdateStatus={updateRequestStatus}
              />
            ) : (
              <EmptyState 
                showClearFilter={filter !== 'all'} 
                onClearFilter={() => handleFilterChange('all')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Requests;
