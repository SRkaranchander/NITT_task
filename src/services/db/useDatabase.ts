// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Reactive Database Hooks (useSyncExternalStore)
// ==============================================================================

import { useSyncExternalStore, useMemo } from 'react';
import { db, NoirDatabaseState } from './store';
import { UserRole } from '../../types';

export function useDatabase(): NoirDatabaseState {
  const state = useSyncExternalStore(
    (callback) => db.subscribe(callback),
    () => db.getState()
  );
  return state;
}

export function useCurrentUser() {
  const state = useDatabase();
  return {
    currentUser: state.currentUser,
    setRole: (role: UserRole) => db.setCurrentUserByRole(role),
    setUser: (user: any) => db.setCurrentUser(user),
    profiles: state.profiles,
  };
}

export function useInventory() {
  const state = useDatabase();
  return useMemo(() => {
    const rawMaterials = state.materials.filter((m) => m.category === 'RAW_MATERIAL');
    const packaging = state.materials.filter((m) => m.category === 'PACKAGING');
    const finishedGoods = state.materials.filter((m) => m.category === 'FINISHED_GOODS');

    const lowStockItems = state.materials.filter((m) => m.currentStock <= m.reorderLevel);

    return {
      allMaterials: state.materials,
      rawMaterials,
      packaging,
      finishedGoods,
      lowStockItems,
      ledger: state.ledger,
      reconcileStock: (id: string) => db.reconcileStock(id),
    };
  }, [state.materials, state.ledger]);
}

export function useProduction() {
  const state = useDatabase();
  return useMemo(() => {
    return {
      productionRuns: state.productionRuns,
      boms: state.boms,
      recordProductionRun: db.recordProductionRun.bind(db),
    };
  }, [state.productionRuns, state.boms]);
}

export function useSales() {
  const state = useDatabase();
  return useMemo(() => {
    return {
      orders: state.orders,
      invoices: state.invoices,
      customers: state.customers,
      dispatches: state.dispatches,
      createOrder: db.createSalesOrder.bind(db),
      approveOrder: db.approveOrder.bind(db),
      createInvoice: db.createInvoiceFromOrder.bind(db),
      dispatchOrder: db.dispatchOrder.bind(db),
    };
  }, [state.orders, state.invoices, state.customers, state.dispatches]);
}

export function useFinance() {
  const state = useDatabase();
  return useMemo(() => {
    const totalReceivables = state.customers.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0);
    const totalCollected = state.payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      invoices: state.invoices,
      payments: state.payments,
      purchases: state.purchases,
      totalReceivables,
      totalCollected,
      recordPayment: db.recordPayment.bind(db),
      recordPurchase: db.recordPurchase.bind(db),
    };
  }, [state.invoices, state.payments, state.purchases, state.customers]);
}

export function useDeviations() {
  const state = useDatabase();
  return useMemo(() => {
    const alerts = db.getDeviationAlerts();
    return {
      alerts,
      criticalCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
      warningCount: alerts.filter((a) => a.severity === 'WARNING').length,
    };
  }, [state]);
}
