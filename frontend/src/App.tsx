import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage } from './pages/public/AboutPage';
import { PublicSearchPage } from './pages/public/PublicSearchPage';
import { PublicVerifyPage } from './pages/public/PublicVerifyPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboards
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { MyPropertiesPage } from './pages/owner/MyPropertiesPage';
import { RegisterLandPage } from './pages/owner/RegisterLandPage';
import { PropertyDetailsPage } from './pages/owner/PropertyDetailsPage';
import { OwnerTransfersPage } from './pages/owner/OwnerTransfersPage';

import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { BrowseLandsPage } from './pages/buyer/BrowseLandsPage';
import { BuyerTransfersPage } from './pages/buyer/BuyerTransfersPage';

import { RegistrarDashboard } from './pages/registrar/RegistrarDashboard';
import { RegistrarApplicationsPage } from './pages/registrar/RegistrarApplicationsPage';
import { RegistrarTransfersPage } from './pages/registrar/RegistrarTransfersPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { BlockchainExplorerPage } from './pages/admin/BlockchainExplorerPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

import { useAuth } from './context/AuthContext';

// Dynamic Dashboard Dispatcher based on authenticated role
const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'REGISTRAR':
      return <RegistrarDashboard />;
    case 'LAND_OWNER':
      return <OwnerDashboard />;
    case 'BUYER':
      return <BuyerDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Facing Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/public/search" element={<PublicSearchPage />} />
        <Route path="/public/verify" element={<PublicVerifyPage />} />
        <Route path="/property/:id" element={<PropertyDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated Dashboard Pages */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardHome />} />

        {/* Land Owner Routes */}
        <Route path="/owner/properties" element={<MyPropertiesPage />} />
        <Route path="/owner/register" element={<RegisterLandPage />} />
        <Route path="/owner/transfers" element={<OwnerTransfersPage />} />

        {/* Buyer Routes */}
        <Route path="/buyer/browse" element={<BrowseLandsPage />} />
        <Route path="/buyer/transfers" element={<BuyerTransfersPage />} />

        {/* Registrar Routes */}
        <Route path="/registrar/applications" element={<RegistrarApplicationsPage />} />
        <Route path="/registrar/transfers" element={<RegistrarTransfersPage />} />

        {/* Admin Routes */}
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/blockchain" element={<BlockchainExplorerPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
