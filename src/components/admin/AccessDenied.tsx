
import DashboardLayout from "@/layouts/DashboardLayout";

const AccessDenied = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 text-lg text-center max-w-md">
          You don't have permission to view this page. Please contact an administrator if you believe this is an error.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AccessDenied;
