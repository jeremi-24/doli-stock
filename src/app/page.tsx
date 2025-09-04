
"use client";

import { useMemo } from "react";
import { useApp } from "@/context/app-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { MagasinierDashboard } from "@/components/dashboards/magasinier-dashboard";

export default function DashboardRootPage() {
  const { isMounted, hasPermission, currentUser } = useApp();

  const showAdminView = useMemo(() => {
      if (!currentUser) return false;
      const adminRoles = ['ADMIN', 'SECRETARIAT', 'CONTROLLEUR', 'DG'];
      return adminRoles.includes(currentUser.roleNom);
  }, [currentUser]);

  if (!isMounted || !currentUser) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-80 w-full lg:col-span-2" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return showAdminView ? <AdminDashboard /> : <MagasinierDashboard />;
}
