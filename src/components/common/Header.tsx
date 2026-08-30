import React, { useState } from 'react';
import {
  Bell,
  Search,
  Shield,
  DollarSign,
  Wrench,
  UserCheck,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Smartphone,
  Users,
  ChevronDown,
  ExternalLink,
  FileSpreadsheet,
  CalendarDays,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentUser,
    users,
    setCurrentUserById,
    activeView,
    setActiveView,
    leases,
    rentTransactions,
    workOrders,
    utilityBills,
    formatCurrency,
    isMobileSimulatorOpen,
    setIsMobileSimulatorOpen,
    canAccessView,
  } = useERP();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Compute urgent alert notifications
  const expiringSoonCount = leases.filter((l) => {
    if (l.Status !== 'Active' && l.Status !== 'Pending Renewal') return false;
    const days = Math.ceil((new Date(l.Lease_End).getTime() - new Date('2026-08-30').getTime()) / 86400000);
    return days >= 0 && days <= 60;
  }).length;

  const overdueInvoices = rentTransactions.filter(
    (r) => r.Status === 'Overdue' || (r.Status === 'Partial' && new Date(r.Due_Date) < new Date('2026-08-30'))
  );

  const pendingUtilityBills = utilityBills.filter(
    (u) => u.Status === 'Open' || u.Status === 'Pending'
  );

  const emergencyTickets = workOrders.filter(
    (w) => w.Priority === 'Emergency' && w.Status !== 'Completed' && w.Status !== 'Cancelled'
  );
  
  const totalAlerts = expiringSoonCount + overdueInvoices.length + emergencyTickets.length + pendingUtilityBills.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md shadow-xs md:px-6">
      {/* Left side: Hamburger & Dream Dwell Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-label="Toggle navigation"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold text-base shadow-sm ring-1 ring-slate-800/20 tracking-wider">
            DD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 md:text-base font-heading">
                Dream Dwell Asset ERP
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Canada • CAD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Corporate Finance & Asset Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Quick Actions, Mobile Simulator, User Switcher, Alerts */}
      <div className="flex items-center gap-2.5">
        {/* Quick link: Data Migration from Google Sheets */}
        {canAccessView('data_migration') && (
          <button
            onClick={() => setActiveView('data_migration')}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activeView === 'data_migration'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Migrate Google Sheets / Excel Data"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sheet Migration</span>
          </button>
        )}

        {/* Quick link: Upcoming Events & Deadlines */}
        {canAccessView('upcoming_events') && (
          <button
            onClick={() => setActiveView('upcoming_events')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activeView === 'upcoming_events'
                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="View Upcoming Leases, Invoices & Bill Payments"
          >
            <CalendarDays className="h-3.5 w-3.5 text-sky-600" />
            <span className="hidden md:inline">Upcoming Schedule</span>
          </button>
        )}

        {/* Mobile View Simulator Launcher */}
        <button
          onClick={() => setIsMobileSimulatorOpen(!isMobileSimulatorOpen)}
          title="Toggle Smartphone Resident/Manager Simulator"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isMobileSimulatorOpen
              ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Smartphone className="h-4 w-4 text-slate-600" />
          <span className="hidden xl:inline">Mobile Simulator</span>
        </button>

        {/* AI Advisor quick button */}
        {canAccessView('ai_assistant') && (
          <button
            onClick={() => setActiveView('ai_assistant')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 transition-all shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>Finance AI</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications and alerts"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-700" />
                  <span className="font-bold text-sm text-slate-900">Finance & Property Alerts</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{totalAlerts} actionable</span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {expiringSoonCount > 0 && (
                  <div
                    onClick={() => {
                      setActiveView('upcoming_events');
                      setShowNotifications(false);
                    }}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs cursor-pointer hover:bg-amber-100/70 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900">{expiringSoonCount} Lease(s) Expiring within 60 Days</p>
                      <p className="text-slate-600 mt-0.5">Formal Canadian tenancy renewal notices ready for review.</p>
                    </div>
                  </div>
                )}

                {overdueInvoices.length > 0 && (
                  <div
                    onClick={() => {
                      setActiveView('billing');
                      setShowNotifications(false);
                    }}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs cursor-pointer hover:bg-rose-100/70 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-rose-900">{overdueInvoices.length} Overdue Rent Invoices</p>
                      <p className="text-slate-600 mt-0.5">Pending rent balances requiring payment reconciliation.</p>
                    </div>
                  </div>
                )}

                {pendingUtilityBills.length > 0 && (
                  <div
                    onClick={() => {
                      setActiveView('utilities');
                      setShowNotifications(false);
                    }}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs cursor-pointer hover:bg-sky-100/70 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-sky-900">{pendingUtilityBills.length} Master Utility Bill(s) Pending</p>
                      <p className="text-slate-600 mt-0.5">Hydro / Water bills requiring allocation and payment.</p>
                    </div>
                  </div>
                )}

                {emergencyTickets.length > 0 && (
                  <div
                    onClick={() => {
                      setActiveView('maintenance');
                      setShowNotifications(false);
                    }}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs cursor-pointer hover:bg-rose-100/70 transition-colors"
                  >
                    <Wrench className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-rose-900">{emergencyTickets.length} Urgent Work Order(s)</p>
                      <p className="text-slate-600 mt-0.5">Plumbing / HVAC repair requires vendor authorization.</p>
                    </div>
                  </div>
                )}

                {totalAlerts === 0 && (
                  <p className="text-center py-6 text-xs text-slate-500">All leases, receivables, and utility accounts are up to date.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher / RBAC Selector */}
        <div className="relative pl-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 font-bold text-xs text-white shadow-2xs">
              {currentUser.Full_Name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                {currentUser.Full_Name.split(' ')[0]}
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold tracking-tight">{currentUser.Role}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-2 py-1.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">Switch Active ERP User (RBAC)</p>
                <p className="text-[10px] text-slate-500">Test different user roles & view permissions</p>
              </div>

              <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
                {users.map((u) => {
                  const isSelected = u.User_ID === currentUser.User_ID;
                  return (
                    <button
                      key={u.User_ID}
                      onClick={() => {
                        setCurrentUserById(u.User_ID);
                        setShowUserMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-[10px]">
                          {u.Full_Name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{u.Full_Name}</p>
                          <p className="text-[10px] text-slate-500">{u.Role} • {u.Email}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setActiveView('team_rbac');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Manage Users & Roles (RBAC)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
