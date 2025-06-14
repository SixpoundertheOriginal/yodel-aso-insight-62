
import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { PlatformAdminSetup } from '@/components/admin/PlatformAdminSetup';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Shield } from 'lucide-react';

const AdminSetup: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Setup
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-2">
              Platform Administration
            </h1>
            <p className="text-zinc-400 mt-1">
              Configure platform administrators and manage system access
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <PlatformAdminSetup />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminSetup;
