"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "./userContext";
import { Loader2, ShieldAlert } from "lucide-react";

export default function ProtectedAdminRoute({ children }) {
  const { isAdmin, isAuthenticated, loading } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/adminLogin");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4">
          <Loader2 className="h-16 w-16 text-blue-500" />
        </div>
        <p className="text-lg font-medium text-gray-700">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
        <div className="bg-red-100 p-6 rounded-lg shadow-md max-w-md text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don&#39;t have permission to view this page. Redirecting to login...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}