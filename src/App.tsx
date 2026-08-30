import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { MobileSimulatorModal } from './components/common/MobileSimulatorModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { PropertiesView } from './components/views/PropertiesView';
import { UnitsView } from './components/views/UnitsView';
import { TenantsView } from './components/views/TenantsView';
import { LandlordsView } from './components/views/LandlordsView';
import { LeasesView } from './components/views/LeasesView';
import { BillingView } from './components/views/BillingView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { UtilitiesView } from './components/views/UtilitiesView';
import { DepositsView } from './components/views/DepositsView';
import { AccountingView } from './components/views/AccountingView';
import { ReportsView } from './components/views/ReportsView';
import { UpcomingEventsView } from './components/views/UpcomingEventsView';
import { DataMigrationView } from './components/views/DataMigrationView';
import { CommunicationsView } from './components/views/CommunicationsView';
import { TeamRBACView } from './components/views/TeamRBACView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { TenantPortalView } from './components/views/TenantPortalView';
import { SettingsView } from './components/views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeView, currentUser, canAccessView, isMobileSimulatorOpen, setIsMobileSimulatorOpen } = useERP();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderCurrentView = () => {
    // If tenant role is selected, default to tenant portal unless navigating
    if (currentUser.Role === 'Tenant' && activeView === 'tenant_portal') {
      return <TenantPortalView />;
    }

    // RBAC access check
    if (!canAccessView(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-red-200 bg-white p-8 text-center space-y-3 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
            🔒
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted by Role-Based Policy</h2>
          <p className="text-xs text-slate-500 max-w-md">
            Your current user role (<strong>{currentUser.Role}</strong>) does not have permission to access the <strong>{activeView}</strong> module. Contact an Administrator to grant access.
          </p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'properties':
        return <PropertiesView />;
      case 'units':
        return <UnitsView />;
      case 'tenants':
        return <TenantsView />;
      case 'landlords':
        return <LandlordsView />;
      case 'leases':
        return <LeasesView />;
      case 'billing':
        return <BillingView />;
      case 'maintenance':
        return <MaintenanceView />;
      case 'utilities':
        return <UtilitiesView />;
      case 'deposits':
        return <DepositsView />;
      case 'accounting':
        return <AccountingView />;
      case 'reports':
        return <ReportsView />;
      case 'upcoming_events':
        return <UpcomingEventsView />;
      case 'data_migration':
        return <DataMigrationView />;
      case 'communications':
        return <CommunicationsView />;
      case 'team_rbac':
        return <TeamRBACView />;
      case 'ai_assistant':
        return <AIAssistantView />;
      case 'tenant_portal':
        return <TenantPortalView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-100/90 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Global Header */}
        <Header onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-slate-100/70">
          <div className="mx-auto max-w-7xl pb-10">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Interactive Mobile Phone Simulator Modal */}
      {isMobileSimulatorOpen && (
        <MobileSimulatorModal
          isOpen={isMobileSimulatorOpen}
          onClose={() => setIsMobileSimulatorOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainLayout />
    </ERPProvider>
  );
}
