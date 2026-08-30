import React from 'react';
import {
  LayoutDashboard,
  Building2,
  DoorClosed,
  Users,
  UserCheck,
  FileSignature,
  Receipt,
  Wrench,
  Zap,
  PiggyBank,
  BookOpen,
  BarChart3,
  Sparkles,
  UserCircle2,
  Settings,
  ShieldCheck,
  ChevronRight,
  X,
  Shield,
  Smartphone,
  Layers,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ViewTab } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activeView,
    setActiveView,
    currentUser,
    leases,
    rentTransactions,
    workOrders,
    utilityBills,
    canAccessView,
    setIsMobileSimulatorOpen,
  } = useERP();

  // Compute live badges
  const expiringLeaseCount = leases.filter((l) => {
    if (l.Status !== 'Active' && l.Status !== 'Pending Renewal') return false;
    const days = Math.ceil((new Date(l.Lease_End).getTime() - new Date('2026-08-30').getTime()) / 86400000);
    return days >= 0 && days <= 60;
  }).length;

  const overdueBillsCount = rentTransactions.filter((r) => r.Status === 'Overdue').length;
  const pendingUtilityCount = utilityBills.filter((u) => u.Status === 'Open' || u.Status === 'Pending').length;
  const activeWorkOrdersCount = workOrders.filter((w) => w.Status === 'New' || w.Status === 'Assigned' || w.Status === 'In Progress').length;
  const totalUpcomingEvents = expiringLeaseCount + (overdueBillsCount > 0 ? 1 : 0) + (pendingUtilityCount > 0 ? 1 : 0);

  const navSections: {
    title: string;
    items: {
      id: ViewTab;
      label: string;
      icon: React.ReactNode;
      badge?: number | string;
      badgeColor?: string;
    }[];
  }[] = [
    {
      title: 'Main Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Finance & Asset Dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: 'upcoming_events',
          label: 'Upcoming Schedule & Expiries',
          icon: <CalendarDays className="h-4 w-4" />,
          badge: totalUpcomingEvents > 0 ? `${totalUpcomingEvents} Actions` : undefined,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        },
      ],
    },
    {
      title: 'Portfolio & Tenancy',
      items: [
        {
          id: 'properties',
          label: 'Properties & Assets',
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          id: 'units',
          label: 'Units & Space Inventory',
          icon: <DoorClosed className="h-4 w-4" />,
        },
        {
          id: 'tenants',
          label: 'Tenant Directory',
          icon: <Users className="h-4 w-4" />,
        },
        {
          id: 'landlords',
          label: 'Landlord & Owner Accounts',
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          id: 'leases',
          label: 'Lease Agreements & Tenancy',
          icon: <FileSignature className="h-4 w-4" />,
          badge: expiringLeaseCount > 0 ? expiringLeaseCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        },
      ],
    },
    {
      title: 'Accounts & Receivables',
      items: [
        {
          id: 'billing',
          label: 'Rent Invoicing & Collections',
          icon: <Receipt className="h-4 w-4" />,
          badge: overdueBillsCount > 0 ? `${overdueBillsCount} Due` : undefined,
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        },
        {
          id: 'utilities',
          label: 'Utility Recovery & Payables',
          icon: <Zap className="h-4 w-4" />,
          badge: pendingUtilityCount > 0 ? `${pendingUtilityCount} Open` : undefined,
          badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
        },
        {
          id: 'deposits',
          label: 'Security Deposits & Trust Holds',
          icon: <PiggyBank className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Operations & Maintenance',
      items: [
        {
          id: 'maintenance',
          label: 'Work Orders & Facility Repairs',
          icon: <Wrench className="h-4 w-4" />,
          badge: activeWorkOrdersCount > 0 ? activeWorkOrdersCount : undefined,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        },
      ],
    },
    {
      title: 'Financials & Data Tools',
      items: [
        {
          id: 'accounting',
          label: 'General Ledger & Journals (ASPE)',
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          id: 'reports',
          label: 'Financial Statements & Aging',
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          id: 'data_migration',
          label: 'Google Sheet & CSV Migration',
          icon: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
          badge: 'Import',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        },
      ],
    },
    {
      title: 'Control & Intelligence',
      items: [
        {
          id: 'team_rbac',
          label: 'User Roles & RBAC Access',
          icon: <Shield className="h-4 w-4 text-slate-700" />,
        },
        {
          id: 'ai_assistant',
          label: 'AI Financial Advisor',
          icon: <Sparkles className="h-4 w-4 text-emerald-600" />,
          badge: 'AI',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        },
        {
          id: 'tenant_portal',
          label: 'Resident Portal View',
          icon: <UserCircle2 className="h-4 w-4 text-slate-600" />,
        },
        {
          id: 'settings',
          label: 'System Settings & Defaults',
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  const handleNav = (tabId: ViewTab) => {
    setActiveView(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Close */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 md:hidden bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 font-extrabold text-sm">
              DD
            </div>
            <span className="font-bold text-white text-sm">Dream Dwell Asset ERP</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Role Quick Indicator Card */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-2xs">
                {currentUser.Full_Name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser.Full_Name}</p>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-semibold text-emerald-700 truncate">{currentUser.Role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveView('team_rbac')}
              title="Configure Permissions"
              className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <Shield className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navSections.map((section) => {
            // Filter section items based on user's RBAC view permissions
            const visibleItems = section.items.filter((item) => canAccessView(item.id));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <div className="space-y-0.5 pt-0.5">
                  {visibleItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs font-bold'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`${
                              isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & mobile launcher */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
          <button
            onClick={() => setIsMobileSimulatorOpen(true)}
            className="flex w-full items-center justify-between rounded-lg bg-white p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="h-4 w-4 text-slate-700 shrink-0" />
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-800 truncate">Mobile View Simulator</p>
                <p className="text-[9px] text-slate-500">Test Tenant & Field View</p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  );
};
