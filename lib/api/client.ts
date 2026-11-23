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

export type MemberRole = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";

interface OrganizationMember {
  id: string;
  role: MemberRole | "OWNER";
  user: { id: string; email: string; firstName: string; lastName?: string };
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

    if (res.user.activeOrganizationId) {
      authStorage.setOrgId(res.user.activeOrganizationId);
      return res.user;
    }

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

  async selectOrganization(id: string) {
    const user = authStorage.getUser();
    if (!user) throw new Error("Sign in before switching workspaces.");
    const result = await api.auth.switchOrg(id);
    if (authStorage.getUser()?.id !== user.id) return;
    authStorage.setToken(result.accessToken);
    authStorage.setOrgId(id);
    authStorage.setUser({ ...user, activeOrganizationId: id, activeOrganizationRole: result.role });
    window.location.replace("/");
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

let refreshInFlight: Promise<string | null> | undefined;

async function refreshSession(token: string, refreshToken: string, organizationId: string | null) {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, organizationId: organizationId ?? undefined }),
  });

  if (authStorage.getToken() !== token || authStorage.getRefreshToken() !== refreshToken) return null;
  if (response.status === 401) return null;
  if (!response.ok) throw new ApiError(response.status, "Could not renew your session. Please try again.");
  const { tokens }: { tokens: AuthTokens } = await response.json();
  if (authStorage.getToken() !== token || authStorage.getRefreshToken() !== refreshToken) return null;
  authStorage.setRefreshToken(tokens.refreshToken);
  authStorage.setToken(tokens.accessToken);
  return tokens.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const isAuthPublicPath =
    path.startsWith("/auth/login") || path.startsWith("/auth/register");
  const token = authStorage.getToken();
  const orgId = authStorage.getOrgId();
  const userId = authStorage.getUser()?.id;
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

    if (res.status === 401 && !isAuthPublicPath && token && retry) {
      const sameScope = () => authStorage.getOrgId() === orgId && authStorage.getUser()?.id === userId;
      const refreshToken = authStorage.getRefreshToken();
      const current = authStorage.getToken();
      let next = sameScope() ? current : null;
      if (next === token && refreshToken) {
        refreshInFlight ??= refreshSession(token, refreshToken, orgId).finally(() => {
          refreshInFlight = undefined;
        });
        next = await refreshInFlight;
      }
      if (next && next !== token && sameScope() && next === authStorage.getToken()) {
        return request<T>(path, options, false);
      }
      if (authStorage.getToken() === token && sameScope()) {
        authStorage.clear();
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

interface OffsetPage<T> {
  data: T[];
  meta: { total: number; page: number; hasMore: boolean; totalPages: number };
}

interface RoomSummary {
  id: string;
  roomNumber: string;
  status: string;
  floor?: string;
  sharingType?: string;
  rentAmount?: number;
  beds?: { status: string }[];
}

export interface DuePackageInput {
  propertyType: string;
  name: string;
  category: string;
  billing: "FIXED" | "VARIABLE";
  amount: number;
  description: string;
  isActive: boolean;
  version?: number;
}

export interface DuePackage extends DuePackageInput {
  id: string;
  version: number;
}

interface PayoutAccount {
  id: string;
  beneficiaryName: string;
  businessName: string;
  accountNumberMasked: string;
  ifscCode: string;
  status: string;
  kycStatus: string;
  property?: { id: string; name: string };
  metadata?: { routeProductId?: string };
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  status: string;
  notes?: string;
  budget?: number;
  visitScheduledAt?: string;
}

interface ResidentDue {
  id: string;
  outstanding: number;
  dueDate: string;
  overdueDays: number;
  resident: {
    firstName: string;
    lastName?: string;
    property?: { name: string };
    room?: { roomNumber: string };
  };
}

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query.toString();
}

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
    me: () => request<UserProfile>("/auth/me"),
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

  members: {
    list: (orgId: string) => request<OrganizationMember[]>(`/organizations/${orgId}/members`),
    add: (orgId: string, email: string, role: MemberRole) =>
      request(`/organizations/${orgId}/members`, { method: "POST", body: JSON.stringify({ email, role }) }),
    update: (orgId: string, id: string, role: MemberRole) =>
      request(`/organizations/${orgId}/members/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
    remove: (orgId: string, id: string) =>
      request(`/organizations/${orgId}/members/${id}`, { method: "DELETE" }),
  },

  // Dashboard
  dashboard: {
    activity: (entityType: "Resident" | "Room" | "Property", entityId: string, signal?: AbortSignal) =>
      request<OffsetPage<{ id: string; action: string; createdAt: string }>>(
        `/dashboard/activity?${queryString({ entityType, entityId })}`, { signal }
      ),
    getMetrics: (propertyId?: string, period?: { month: number; year: number; fy?: "true" }, signal?: AbortSignal) => {
      const q = `?${queryString({ propertyId, ...period })}`;
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
          periodMoveIns: number;
          periodMoveOuts: number;
          noticePeriodTenants: number;
          activeLeads: number;
          currentBookings: number;
          rentDefaulters: number;
          periodComplaintsCreated: number;
          periodComplaintsResolved: number;
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
      }>(`/dashboard/metrics${q}`, { signal });
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

  reports: {
    download: (kind: "dues" | "collections" | "expenses" | "residents", params: { propertyId?: string; startDate?: string; endDate?: string; mode?: string }) => {
      const endpoint = kind === "residents" ? "/reports/residents/csv" : `/money/reports/${kind}`;
      return request<string>(`${endpoint}?${queryString(params)}`);
    },
  },

  money: {
    reminder: (id: string, signal?: AbortSignal) =>
      request<{ totalDues: number; paymentLink: string | null; message: string; resident: { firstName: string; mobile: string; whatsappNumber?: string; parentPhone?: string; parentName?: string } }>(
        `/money/residents/${id}/reminder`, { signal }
      ),
    createPaymentLink: (id: string) =>
      request<{ paymentLink: string }>(`/money/residents/${id}/payment-link`, { method: "POST" }),
    saveRemark: (id: string, description: string) =>
      request(`/money/residents/${id}/remarks`, { method: "POST", body: JSON.stringify({ description }) }),
    offerDiscount: (id: string, offer: { amount: number; validTill: string; minimumPayment: "FULL" | "CUSTOM"; minimumAmount?: number; description: string }) =>
      request(`/money/residents/${id}/discount`, { method: "POST", body: JSON.stringify(offer) }),
    packages: (params: { page: number; search?: string }, signal?: AbortSignal) =>
      request<OffsetPage<DuePackage>>(`/money/packages?${queryString({ ...params, active: "ALL" })}`, { signal }),
    savePackage: (payload: DuePackageInput, id?: string) =>
      request<DuePackage>(id ? `/money/packages/${id}` : "/money/packages", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    paymentContext: (residentId: string, signal?: AbortSignal) =>
      request<{ totalDues: number; bills: { id: string; type: string; amount: number; paidAmount: number; dueDate: string }[] }>(
        `/money/residents/${residentId}/payment-context`, { signal }
      ),
    record: (payload: {
      residentId: string; amount: number; mode: string; collectionDate: string; notes?: string;
      idempotencyKey: string; allocations: { billingRecordId: string; amount: number }[];
    }) => request("/money/payments", { method: "POST", body: JSON.stringify(payload) }),
    summary: (propertyId?: string, signal?: AbortSignal) =>
      request<{ allDues: number; monthCollection: number; monthExpenses: number; reconciliationCount: number; reconciliationAmount: number }>(
        `/money/summary?${queryString({ propertyId })}`, { signal }
      ),
    dues: (params: { propertyId?: string; page: number; search?: string }, signal?: AbortSignal) =>
      request<OffsetPage<ResidentDue>>(`/money/dues?${queryString(params)}`, { signal }),
  },

  // Rooms & Beds
  rooms: {
    page: (propertyId: string, params: { search?: string; page?: number; limit?: number; floor?: string; vacancy?: string }, signal?: AbortSignal) =>
      request<OffsetPage<RoomSummary>>(`/properties/${propertyId}/rooms-page?${queryString(params)}`, { signal }),
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
    bulkMoveOut: (data: { residentIds: string[]; moveOutDate: string; notes?: string; archive: boolean }) =>
      request("/residents/bulk-move-out", { method: "POST", body: JSON.stringify(data) }),
    notice: (id: string, data: { date: string; reason: string }) =>
      request(`/residents/${id}/notice`, { method: "POST", body: JSON.stringify(data) }),
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
    update: (id: string, data: Record<string, unknown>) =>
      request(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
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
    list: (params: { propertyId?: string; page: number }) =>
      request<OffsetPage<any>>(`/bookings?${queryString(params)}`),
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
    stats: (propertyId?: string, signal?: AbortSignal) =>
      request<{ total: number; byStatus: Record<string, number>; conversionRate: number }>(`/leads/stats?${queryString({ propertyId })}`, { signal }),
    list: (params: { propertyId?: string; search?: string; status?: string; page: number }, signal?: AbortSignal) =>
      request<OffsetPage<Lead>>(`/leads?${queryString(params)}`, { signal }),
    update: (id: string, payload: Partial<Lead>) =>
      request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    create: (data: any) =>
      request<any>("/leads", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Meters
  meters: {
    list: (propertyId?: string) => request<any[]>(`/meters?${queryString({ propertyId })}`),
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
    sendRentReminders: (data: { propertyId?: string; residentId?: string; residentIds?: string[]; kind?: "rent" | "autopay"; channel: "WHATSAPP" | "EMAIL" | "BOTH" }) =>
      request<{ remindersSent: number; failedCount: number; whatsappError?: string }>("/announcements/reminders/rent", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Payouts & Banks
  payouts: {
    list: (params: { propertyId?: string; page: number }, signal?: AbortSignal) =>
      request<OffsetPage<PayoutAccount>>(`/payouts/accounts?${queryString(params)}`, { signal }),
    refresh: (id: string) => request(`/payouts/accounts/${id}/refresh`, { method: "POST" }),
    link: (id: string, propertyId: string | null) =>
      request(`/money/banks/${id}/property`, { method: "PATCH", body: JSON.stringify({ propertyId }) }),
    getActive: () => request<any>("/payouts/accounts/active"),
    createAccount: (data: any) =>
      request<any>("/payouts/onboard-owner", {
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
