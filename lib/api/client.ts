/**
 * PgInfo Centralized API Client
 *
 * Implements typed requests, token management, error normalization,
 * cancellation, retry safety, and auto-org context scoping.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export { ApiError };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  organizationName?: string;
  activeOrganizationId?: string | null;
  activeOrganizationRole?: string | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
}

const STORAGE_KEY_TOKEN = "pginfo_access_token";
const STORAGE_KEY_REFRESH = "pginfo_refresh_token";
const STORAGE_KEY_ORG = "pginfo_org_id";
const STORAGE_KEY_USER = "pginfo_user_profile";

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  },
  setToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY_REFRESH);
  },
  setRefreshToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_REFRESH, token);
  },
  getOrgId: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY_ORG);
  },
  setOrgId: (orgId: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_ORG, orgId);
  },
  getUser: (): UserProfile | null => {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem(STORAGE_KEY_USER);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },
  setUser: (user: UserProfile) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_ORG);
    localStorage.removeItem(STORAGE_KEY_USER);
  },
};

export const authActions = {
  async login(credentials: { email: string; password: string }): Promise<UserProfile> {
    const res = await api.auth.login(credentials);
    const initialToken = res.tokens.accessToken;
    authStorage.setToken(initialToken);
    authStorage.setRefreshToken(res.tokens.refreshToken);
    authStorage.setUser(res.user);

    try {
      const orgs = await api.auth.listOrgs();
      const targetOrg =
        orgs.find((org) => org.id === res.user.activeOrganizationId) ?? orgs[0];
      const organization =
        targetOrg ??
        (await api.auth.createOrg({
          name: `${res.user.firstName}'s Properties`,
        }));
      const switchRes = await api.auth.switchOrg(organization.id);
      const user = {
        ...res.user,
        activeOrganizationId: organization.id,
        activeOrganizationRole: switchRes.role,
      };

      authStorage.setToken(switchRes.accessToken);
      authStorage.setOrgId(organization.id);
      authStorage.setUser(user);
      return user;
    } catch (error) {
      authStorage.clear();
      throw error;
    }
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    mobile?: string;
    organizationName?: string;
  }): Promise<UserProfile> {
    const res = await api.auth.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile,
      organizationName: data.organizationName,
    });

    authStorage.setToken(res.tokens.accessToken);
    authStorage.setRefreshToken(res.tokens.refreshToken);

    try {
      let user = res.user;
      if (!user.activeOrganizationId) {
        const organization = await api.auth.createOrg({
          name:
            data.organizationName?.trim() ||
            `${data.firstName.trim()}'s Properties`,
        });
        const switchRes = await api.auth.switchOrg(organization.id);
        authStorage.setToken(switchRes.accessToken);
        user = {
          ...user,
          activeOrganizationId: organization.id,
          activeOrganizationRole: switchRes.role,
        };
      }

      if (!user.activeOrganizationId) {
        throw new Error(
          "Your account was created, but its workspace couldn't be set up. Please sign in to finish setup.",
        );
      }

      authStorage.setOrgId(user.activeOrganizationId);
      authStorage.setUser(user);
      return user;
    } catch (error) {
      authStorage.clear();
      throw error;
    }
  },

  async logout(): Promise<void> {
    const rt = authStorage.getRefreshToken();
    const at = authStorage.getToken();

    // 1. Immediately wipe local auth storage so no ongoing queries reuse it
    authStorage.clear();

    // 2. Best-effort call to backend logout endpoint with 1s timeout
    if (rt && at) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${at}`,
          },
          body: JSON.stringify({ refreshToken: rt }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch {
        // Ignore server errors during logout
      }
    }

    // 3. Clear session and replace route to /login
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  },
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isAuthPublicPath =
    path.startsWith("/auth/login") || path.startsWith("/auth/register");
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization") && !isAuthPublicPath) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }

    // Auto-logout on 401 for protected endpoints
    if (res.status === 401 && !path.includes("/auth/")) {
      authStorage.clear();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    const message =
      errorData?.detail ||
      errorData?.message ||
      errorData?.title ||
      `HTTP error ${res.status}`;
    throw new ApiError(res.status, message, errorData);
  }

  // Handle empty bodies (204 No Content)
  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  return res.text() as unknown as T;
}

// ─────────────────────────────────────────────────────────────
// Typed API Endpoints
// ─────────────────────────────────────────────────────────────

export const api = {
  // Auth & Org
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ tokens: AuthTokens; user: UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (payload: {
      email: string;
      password: string;
      firstName: string;
      lastName?: string;
      mobile?: string;
      organizationName?: string;
    }) =>
      request<{ tokens: AuthTokens; user: UserProfile }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    logout: (refreshToken: string) =>
      request<{ success: boolean; message?: string }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
    me: () => request<{ user: UserProfile }>("/auth/me"),
    switchOrg: (orgId: string) =>
      request<{ accessToken: string; organization: any; role: string }>(
        `/organizations/${orgId}/switch`,
        { method: "POST" }
      ),
    listOrgs: () => request<OrganizationSummary[]>("/organizations"),
    createOrg: (payload: { name: string; slug?: string }) =>
      request<{ id: string; name: string; slug: string }>("/organizations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  // Dashboard
  dashboard: {
    getMetrics: (propertyId?: string) => {
      const q = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : "";
      return request<{
        operational: {
          totalProperties: number;
          totalRooms: number;
          totalBeds: number;
          occupiedBeds: number;
          availableBeds: number;
          occupancyRate: number;
          currentResidents: number;
          upcomingMoveIns: number;
          pendingComplaints: number;
        };
        financial: {
          todayCollectedPaise?: number;
          todayCollectedFormatted?: string;
          monthCollectedPaise?: number;
          monthCollectedFormatted?: string;
          monthBilledPaise?: number;
          monthBilledFormatted?: string;
          totalBilledPaise: number;
          totalBilledFormatted: string;
          totalCollectedPaise: number;
          totalCollectedFormatted: string;
          outstandingBalancePaise: number;
          outstandingBalanceFormatted: string;
          totalExpensesPaise: number;
          totalExpensesFormatted: string;
          netCashflowPaise: number;
          netCashflowFormatted: string;
          securityDepositsHeldPaise: number;
          securityDepositsHeldFormatted: string;
        };
      }>(`/dashboard/metrics${q}`);
    },
  },

  // Properties
  properties: {
    list: (params?: { search?: string; status?: string; type?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.status) sp.set("status", params.status);
      if (params?.type) sp.set("type", params.type);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/properties${qs}`);
    },
    get: (id: string) => request<any>(`/properties/${id}`),
    create: (data: any) =>
      request<any>("/properties", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/properties/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/properties/${id}`, { method: "DELETE" }),
    occupancyMap: (id: string) =>
      request<any>(`/properties/${id}/occupancy-map`),
  },

  // Rooms & Beds
  rooms: {
    listByProperty: (propertyId: string) =>
      request<any[]>(`/properties/${propertyId}/rooms`),
    get: (roomId: string) => request<any>(`/rooms/${roomId}`),
    create: (propertyId: string, data: any) =>
      request<any>(`/properties/${propertyId}/rooms`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (roomId: string, data: any) =>
      request<any>(`/rooms/${roomId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (roomId: string) =>
      request<any>(`/rooms/${roomId}`, { method: "DELETE" }),
    inventoryStats: (propertyId: string) =>
      request<any>(`/properties/${propertyId}/inventory-stats`),
    toggleDisableRent: (roomId: string) =>
      request<any>(`/rooms/${roomId}/toggle-disable-rent`, { method: "PATCH" }),
    togglePublish: (roomId: string) =>
      request<any>(`/rooms/${roomId}/toggle-publish`, { method: "PATCH" }),
    addBed: (roomId: string, data: any) =>
      request<any>(`/rooms/${roomId}/beds`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateBed: (bedId: string, data: any) =>
      request<any>(`/beds/${bedId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteBed: (bedId: string) =>
      request<any>(`/beds/${bedId}`, { method: "DELETE" }),
  },

  // Residents
  residents: {
    list: (params?: {
      propertyId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.status) sp.set("status", params.status);
      if (params?.search) sp.set("search", params.search);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit || 50));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/residents${qs}`);
    },
    get: (id: string) => request<any>(`/residents/${id}`),
    create: (data: any) =>
      request<any>("/residents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/residents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    reallocate: (id: string, data: any) =>
      request<any>(`/residents/${id}/reallocate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    swapBeds: (data: { residentOneId: string; residentTwoId: string; reason?: string }) =>
      request<any>("/residents/swap-beds", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    moveOut: (id: string, data: { moveOutDate: string; notes?: string }) =>
      request<any>(`/residents/${id}/move-out`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Billing
  billing: {
    list: (params?: {
      propertyId?: string;
      residentId?: string;
      type?: string;
      status?: string;
      month?: number;
      year?: number;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.residentId) sp.set("residentId", params.residentId);
      if (params?.type) sp.set("type", params.type);
      if (params?.status) sp.set("status", params.status);
      if (params?.month) sp.set("month", String(params.month));
      if (params?.year) sp.set("year", String(params.year));
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit || 50));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/billing/records${qs}`);
    },
    get: (id: string) => request<any>(`/billing/records/${id}`),
    generateMonthlyDues: (data: { propertyId?: string; billingMonth: number; billingYear: number }) =>
      request<any>("/billing/generate-monthly-dues", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createCharge: (data: {
      residentId: string;
      type: string;
      amount: number;
      dueDate: string;
      description?: string;
      periodStart?: string;
      periodEnd?: string;
    }) =>
      request<any>("/billing/charges", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: (id: string, reason: string) =>
      request<any>(`/billing/records/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },

  // Payments
  payments: {
    list: (params?: {
      residentId?: string;
      propertyId?: string;
      status?: string;
      mode?: string;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.residentId) sp.set("residentId", params.residentId);
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.status) sp.set("status", params.status);
      if (params?.mode) sp.set("mode", params.mode);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit || 50));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/payments${qs}`);
    },
    record: (data: {
      residentId: string;
      billingRecordId?: string;
      amount: number;
      mode: string;
      collectionDate?: string;
      reference?: string;
      notes?: string;
    }) =>
      request<any>("/payments/record", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getReceipt: (id: string) => request<any>(`/payments/${id}/receipt`),
  },

  // Expenses
  expenses: {
    list: (params?: {
      propertyId?: string;
      categoryId?: string;
      paymentMode?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.categoryId) sp.set("categoryId", params.categoryId);
      if (params?.paymentMode) sp.set("paymentMode", params.paymentMode);
      if (params?.startDate) sp.set("startDate", params.startDate);
      if (params?.endDate) sp.set("endDate", params.endDate);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit || 50));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/expenses${qs}`);
    },
    summary: (params?: { propertyId?: string; startDate?: string; endDate?: string }) => {
      const sp = new URLSearchParams();
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.startDate) sp.set("startDate", params.startDate);
      if (params?.endDate) sp.set("endDate", params.endDate);
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<any>(`/expenses/summary${qs}`);
    },
    listCategories: () => request<any[]>("/expenses/categories"),
    createCategory: (name: string) =>
      request<any>("/expenses/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    create: (data: any) =>
      request<any>("/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/expenses/${id}`, { method: "DELETE" }),
  },

  // Complaints
  complaints: {
    list: (params?: {
      propertyId?: string;
      categoryId?: string;
      status?: string;
      urgency?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.categoryId) sp.set("categoryId", params.categoryId);
      if (params?.status) sp.set("status", params.status);
      if (params?.urgency) sp.set("urgency", params.urgency);
      if (params?.assignedTo) sp.set("assignedTo", params.assignedTo);
      if (params?.search) sp.set("search", params.search);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit || 50));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/complaints${qs}`);
    },
    listCategories: () => request<any[]>("/complaints/categories"),
    create: (data: any) =>
      request<any>("/complaints", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<any>(`/complaints/${id}`),
    updateStatus: (id: string, data: { status: string; notes?: string; resolution?: string }) =>
      request<any>(`/complaints/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    assign: (id: string, data: { assignedTo: string; notes?: string }) =>
      request<any>(`/complaints/${id}/assign`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addComment: (id: string, content: string) =>
      request<any>(`/complaints/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  // Staff
  staff: {
    list: (params?: {
      propertyId?: string;
      designationId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.propertyId) sp.set("propertyId", params.propertyId);
      if (params?.designationId) sp.set("designationId", params.designationId);
      if (params?.status) sp.set("status", params.status);
      if (params?.search) sp.set("search", params.search);
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit || 50));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return request<{ data: any[]; meta: any }>(`/staff${qs}`);
    },
    listDesignations: () => request<any[]>("/staff/designations"),
    create: (data: any) =>
      request<any>("/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<any>(`/staff/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/staff/${id}`, { method: "DELETE" }),
  },

  // Bookings
  bookings: {
    list: () => request<any[]>("/bookings"),
    create: (data: any) =>
      request<any>("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: (id: string) =>
      request<any>(`/bookings/${id}/cancel`, { method: "POST" }),
  },

  // Leads
  leads: {
    list: () => request<any[]>("/leads"),
    create: (data: any) =>
      request<any>("/leads", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Meters
  meters: {
    list: () => request<any[]>("/meters"),
    addReading: (id: string, data: any) =>
      request<any>(`/meters/${id}/readings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Announcements & WhatsApp
  announcements: {
    list: () => request<any[]>("/announcements"),
    create: (data: any) =>
      request<any>("/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    send: (id: string) =>
      request<any>(`/announcements/${id}/send`, { method: "POST" }),
    sendRentReminders: (data: { propertyId?: string; residentId?: string; channel: "WHATSAPP" | "EMAIL" | "BOTH" }) =>
      request<any>("/announcements/reminders/rent", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Payouts & Banks
  payouts: {
    getActive: () => request<any>("/payouts/accounts/active"),
    createAccount: (data: any) =>
      request<any>("/payouts/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Templates
  templates: {
    list: () => request<any[]>("/templates"),
    render: (templateId: string, residentId: string) =>
      request<any>(`/templates/${templateId}/render/${residentId}`),
  },

  // Reviews
  reviews: {
    insights: () => request<any>("/reviews/insights"),
    surveys: () => request<any[]>("/reviews/surveys"),
  },
};
