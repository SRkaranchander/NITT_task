import React, { useState } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { ProductionStudio } from './components/production/ProductionStudio';
import { InventoryFlow } from './components/inventory/InventoryFlow';
import { DeviationMonitor } from './components/deviation/DeviationMonitor';
import { SalesOrders } from './components/sales/SalesOrders';
import { BillingGST } from './components/billing/BillingGST';
import { Collections } from './components/finance/Collections';
import { Purchases } from './components/purchases/Purchases';
import { CostIntelligence } from './components/costing/CostIntelligence';
import { AuditRoom } from './components/audit/AuditRoom';
import { PeopleAccess } from './components/people/PeopleAccess';
import { LoginPage } from './components/auth/LoginPage';
import { useDatabase } from './services/db/useDatabase';
import { db } from './services/db/store';
import { UserProfile } from './types';

export const App: React.FC = () => {
  const { profiles } = useDatabase();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    typeof window !== 'undefined' && window.localStorage.getItem('noir-demo-auth') === 'active'
  );
  const [currentTab, setCurrentTab] = useState('command-center');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleNavigate = (tabId: string) => {
    setCurrentTab(tabId);
  };

  const handleLogin = (profile: UserProfile) => {
    db.setCurrentUser(profile);
    window.localStorage.setItem('noir-demo-auth', 'active');
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    window.localStorage.removeItem('noir-demo-auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage profiles={profiles} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'command-center':
        return <CommandCenter onNavigate={handleNavigate} />;
      case 'production-studio':
        return <ProductionStudio />;
      case 'inventory-flow':
        return <InventoryFlow />;
      case 'deviation-monitor':
        return <DeviationMonitor onNavigate={handleNavigate} />;
      case 'sales-orders':
        return <SalesOrders onNavigate={handleNavigate} />;
      case 'billing-gst':
        return <BillingGST onNavigate={handleNavigate} />;
      case 'collections':
        return <Collections />;
      case 'purchases':
        return <Purchases />;
      case 'cost-intelligence':
        return <CostIntelligence />;
      case 'audit-room':
        return <AuditRoom />;
      case 'people-access':
        return <PeopleAccess />;
      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-shell flex h-screen bg-[#0B0D10] text-[#E8EBF0] overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSelectTab={setCurrentTab}
        />

        {/* Scrollable Page Body */}
        <main className="app-main flex-1 overflow-y-auto bg-[#0B0D10]">
          {renderContent()}
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Actionable Deviation Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};
