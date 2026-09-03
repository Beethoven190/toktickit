const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
}): Promise<PaginatedTickets> {
  const url = new URL(`${API_URL}/api/tickets`);
  url.searchParams.set("requesterId", String(params.requesterId));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.categoryId) url.searchParams.set("categoryId", params.categoryId);
  if (params.priority) url.searchParams.set("priority", params.priority);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch tickets: ${res.status}`);
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
