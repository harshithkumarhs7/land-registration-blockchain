import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  ArrowLeftRight,
  ClipboardCheck,
  Users,
  Cpu,
  History,
  Search,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const renderNavLinks = () => {
    switch (user.role) {
      case 'LAND_OWNER':
        return (
          <>
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
            <NavItem to="/owner/properties" icon={<Building2 />} label="My Lands" />
            <NavItem to="/owner/register" icon={<PlusCircle />} label="Register Land" />
            <NavItem to="/owner/transfers" icon={<ArrowLeftRight />} label="Ownership Transfers" />
            <NavItem to="/public/search" icon={<Search />} label="Search Catalog" />
          </>
        );

      case 'BUYER':
        return (
          <>
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
            <NavItem to="/buyer/browse" icon={<Building2 />} label="Browse Properties" />
            <NavItem to="/buyer/transfers" icon={<ArrowLeftRight />} label="Transfer Requests" />
            <NavItem to="/public/verify" icon={<CheckCircle />} label="Verify Land" />
          </>
        );

      case 'REGISTRAR':
        return (
          <>
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Registrar Overview" />
            <NavItem to="/registrar/applications" icon={<ClipboardCheck />} label="Land Applications" />
            <NavItem to="/registrar/transfers" icon={<ArrowLeftRight />} label="Transfer Approvals" />
            <NavItem to="/public/search" icon={<Building2 />} label="Master Land Records" />
            <NavItem to="/public/verify" icon={<CheckCircle />} label="Public Verification" />
          </>
        );

      case 'ADMIN':
        return (
          <>
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Admin Dashboard" />
            <NavItem to="/admin/users" icon={<Users />} label="User Management" />
            <NavItem to="/admin/blockchain" icon={<Cpu />} label="Blockchain Explorer" />
            <NavItem to="/admin/audit-logs" icon={<History />} label="Audit Trail" />
            <NavItem to="/public/search" icon={<Building2 />} label="All Lands" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {user.role} Navigation
        </div>
        {renderNavLinks()}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-xs font-semibold text-slate-700">EVM Node: Connected</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Hardhat Local Dev (Chain ID: 31337)
        </p>
      </div>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
          isActive
            ? 'bg-blue-50 text-blue-800 font-semibold shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`
      }
    >
      <span className="w-5 h-5 opacity-80">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};
