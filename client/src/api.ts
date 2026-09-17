const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type UserRole = "REQUESTER" | "STAFF" | "ADMIN";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  isActive: boolean;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("toktickit_token");
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem("toktickit_token", token);
  } else {
    localStorage.removeItem("toktickit_token");
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
}

export interface Attachment {
  id: number;
  ticketId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  isRemoved: boolean;
  removalReason?: string | null;
  removedAt?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH";
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: RequesterUser;
  attachments?: Attachment[];
}

export interface CreateTicketDto {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH";
}

export interface PaginatedTickets {
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function getActiveRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) {
    throw new Error(`Failed to fetch requesters: ${res.status}`);
  }
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }
  return res.json();
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/systems`);
  if (!res.ok) {
    throw new Error(`Failed to fetch related systems: ${res.status}`);
  }
  return res.json();
}

export async function createTicket(dto: CreateTicketDto): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || `Ticket creation failed: ${res.status}`);
    (error as unknown as { errors?: Record<string, string> }).errors = errorData.errors;
    throw error;
  }

  return res.json();
}

export async function getMyTickets(params: {
  requesterId: number;
  search?: string;
  categoryId?: string;
  priority?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}): Promise<PaginatedTickets> {
  const url = new URL(`${API_URL}/api/tickets`);
  url.searchParams.set("requesterId", String(params.requesterId));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.categoryId) url.searchParams.set("categoryId", params.categoryId);
  if (params.priority) url.searchParams.set("priority", params.priority);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.order) url.searchParams.set("order", params.order);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch tickets: ${res.status}`);
  }
  return res.json();
}

export async function getTicketDetail(ticketId: number, requesterId: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}?requesterId=${requesterId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch ticket detail: ${res.status}`);
  }
  return res.json();
}

export async function uploadAttachment(ticketId: number, requesterId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("requesterId", String(requesterId));

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to upload attachment: ${res.status}`);
  }
  return res.json();
}

export function getAttachmentDownloadUrl(ticketId: number, attachmentId: number, requesterId: number): string {
  return `${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}/file?requesterId=${requesterId}`;
}

export async function softRemoveAttachment(
  ticketId: number,
  attachmentId: number,
  requesterId: number,
  removalReason: string
): Promise<Attachment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requesterId, removalReason }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to remove attachment: ${res.status}`);
  }
  return res.json();
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error(`Health check failed with status: ${healthRes.status}`);
  }
  const healthData = await healthRes.json();
  if (healthData.status !== "ok") {
    throw new Error("Invalid health check response");
  }

  const catRes = await fetch(`${API_URL}/api/categories`);
  if (!catRes.ok) {
    throw new Error(`Categories fetch failed with status: ${catRes.status}`);
  }
  const categories: Category[] = await catRes.json();

  return {
    online: true,
    categories,
  };
}

// ---------------------------------------------------------------------------
// Lab 3: Authentication API Functions
// ---------------------------------------------------------------------------
export async function loginApi(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error?.message || data.error || "Login failed";
    const error = new Error(message);
    (error as unknown as { fields?: Record<string, string> }).fields = data.error?.fields;
    throw error;
  }

  setAuthToken(data.token);
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    });
  } finally {
    setAuthToken(null);
  }
}

export async function getMeApi(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    setAuthToken(null);
    throw new Error("Session expired or invalid token");
  }

  const data = await res.json();
  return data.user;
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error?.message || data.error || "Failed to change password";
    const error = new Error(message);
    (error as unknown as { fields?: Record<string, string> }).fields = data.error?.fields;
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Lab 3 — Issue 3: IT Staff Ticket Queue API
// ---------------------------------------------------------------------------
export interface StaffQueueTicket extends Ticket {
  ownerId?: number | null;
  owner?: RequesterUser | null;
  itPriority?: "LOW" | "MEDIUM" | "HIGH" | null;
  resolutionSummary?: string | null;
  problemResolvedReq?: boolean;
}

export interface StaffQueueParams {
  search?: string;
  categoryId?: string;
  relatedSystemId?: string;
  priority?: string;
  requestedPriority?: string;
  itPriority?: string;
  status?: string;
  ownerId?: string;
  quickFilter?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface StaffQueueResponse {
  data: StaffQueueTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summaryCounts: {
    all: number;
    unassigned: number;
    myTickets: number;
    inProgress: number;
  };
}

export async function getStaffQueue(params: StaffQueueParams = {}): Promise<StaffQueueResponse> {
  const url = new URL(`${API_URL}/api/staff/queue`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.categoryId) url.searchParams.set("categoryId", params.categoryId);
  if (params.relatedSystemId) url.searchParams.set("relatedSystemId", params.relatedSystemId);
  if (params.priority) url.searchParams.set("priority", params.priority);
  if (params.requestedPriority) url.searchParams.set("requestedPriority", params.requestedPriority);
  if (params.itPriority) url.searchParams.set("itPriority", params.itPriority);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.ownerId !== undefined && params.ownerId !== "") url.searchParams.set("ownerId", params.ownerId);
  if (params.quickFilter) url.searchParams.set("quickFilter", params.quickFilter);
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.order) url.searchParams.set("order", params.order);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));

  const res = await fetch(url.toString(), {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error?.message || data.error || `Failed to fetch staff queue: ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export async function getStaffTicketDetail(ticketId: number): Promise<StaffQueueTicket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error?.message || data.error || `Failed to fetch ticket detail: ${res.status}`;
    throw new Error(message);
  }

  return data;
}


