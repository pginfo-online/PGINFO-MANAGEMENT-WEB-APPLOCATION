// ─── Dashboard & Reports Types ──────────────────────────────────────────────
// Derived from backend dashboard.controller.js

export interface OwnerDashboardSummary {
  totalPGs: number;
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    occupancyRate: number;
  };
  financials: {
    totalCollectedThisMonth: number;
    totalPendingThisMonth: number;
    totalExpensesThisMonth: number;
    netProfitThisMonth: number;
  };
  counts: {
    activeTenants: number;
    activeStaff: number;
    openComplaints?: number;
  };
  pgs: {
    _id: string;
    name: string;
    city?: string;
    area?: string;
    monthlyPricing?: Record<string, number>;
  }[];
}

export interface PropertyDashboardSummary {
  property: {
    _id: string;
    name: string;
    address?: string;
    city?: string;
    area?: string;
    images?: string[];
    phone?: string;
    status?: string;
  };
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    occupancyRate: number;
    totalRooms?: number;
    vacantRooms?: number;
    occupiedRooms?: number;
    partialRooms?: number;
    rooms?: {
      totalRooms: number;
      vacantRooms: number;
      occupiedRooms: number;
      partialRooms: number;
    };
  };
  financials: {
    currentMonth?: number;
    currentYear?: number;
    totalDue: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
    totalExpenses: number;
    netProfit: number;
    overdueCount?: number;
    paidCount?: number;
    pendingCount?: number;
  };
  counts: {
    activeTenants: number;
    pendingTenants: number;
    noticeTenants?: number;
    noticeTenantsCount?: number;
    staffCount: number;
  };
  alerts: {
    overdueCount?: number;
    overdueRentsCount?: number;
    expiringAgreementsCount?: number;
    tenantsOnNoticeCount?: number;
    overdueTenants?: {
      _id: string;
      tenantName: string;
      tenantPhone: string;
      roomNumber: string;
      amountDue: number;
      dueDate: string;
      daysOverdue: number;
      paymentLink?: string;
    }[];
    noticeTenants?: {
      name: string;
      phone: string;
      room?: { roomNumber?: string } | string;
      expectedLeaveDate?: string;
      noticePeriodDays?: number;
      profilePhoto?: string;
    }[];
  };
  recentActivity?: {
    payments?: unknown[];
    tenants?: unknown[];
  };
}

export interface MonthlyFinancialReportItem {
  month: string;
  monthNumber: number;
  revenue: number;
  due: number;
  expenses: number;
  profit: number;
}

export interface FinancialReport {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  totalDue: number;
  netProfit: number;
  report: MonthlyFinancialReportItem[];
}
