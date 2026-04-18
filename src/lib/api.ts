const BASE_URL = "https://functions.poehali.dev/3f4168e3-eb7f-42d3-bf2d-1e40393cbf59";

async function request<T>(qs: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}?${qs}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Ошибка сервера");
  return data as T;
}

// ── Bookings ──────────────────────────────────────────────────────
export const getBookings = (phone?: string) =>
  request<BookingRow[]>(`r=bookings${phone ? `&phone=${encodeURIComponent(phone)}` : ""}`);

export const createBooking = (body: CreateBookingBody) =>
  request<BookingRow>("r=bookings", { method: "POST", body: JSON.stringify(body) });

export const updateBooking = (id: number, body: UpdateBookingBody) =>
  request<BookingRow>(`r=bookings&id=${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteBooking = (id: number) =>
  request<{ ok: boolean }>(`r=bookings&id=${id}`, { method: "DELETE" });

// ── Reviews ───────────────────────────────────────────────────────
export const getReviews = () => request<ReviewRow[]>("r=reviews");

export const createReview = (body: { authorPhone: string; authorName: string; text: string }) =>
  request<ReviewRow>("r=reviews", { method: "POST", body: JSON.stringify(body) });

export const deleteReview = (id: number, phone?: string, admin?: boolean) =>
  request<{ ok: boolean }>(
    `r=reviews&id=${id}${phone ? `&phone=${encodeURIComponent(phone)}` : ""}${admin ? "&admin=true" : ""}`,
    { method: "DELETE" }
  );

// ── Blocked slots ─────────────────────────────────────────────────
export const getBlockedSlots = () => request<BlockedSlotRow[]>("r=blocked-slots");

export const createBlockedSlot = (body: { type: string; date: string; hours: number[]; allDay: boolean }) =>
  request<BlockedSlotRow>("r=blocked-slots", { method: "POST", body: JSON.stringify(body) });

export const deleteBlockedSlot = (id: number) =>
  request<{ ok: boolean }>(`r=blocked-slots&id=${id}`, { method: "DELETE" });

// ── Photos ────────────────────────────────────────────────────────
export const getPhotos = () => request<PhotoRow[]>("r=photos");

export const createPhoto = (url: string) =>
  request<PhotoRow>("r=photos", { method: "POST", body: JSON.stringify({ url }) });

export const deletePhoto = (id: number) =>
  request<{ ok: boolean }>(`r=photos&id=${id}`, { method: "DELETE" });

// ── Types ─────────────────────────────────────────────────────────
export interface BookingRow {
  id: number;
  user_phone: string;
  user_name: string;
  date: string;
  start_time: string;
  duration: number;
  extras_balls: boolean;
  extras_rackets: number;
  extras_trainer: boolean;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export interface ReviewRow {
  id: number;
  author_phone: string;
  author_name: string;
  text: string;
  created_at: string;
}

export interface BlockedSlotRow {
  id: number;
  type: "court" | "trainer";
  date: string;
  hours: number[];
  all_day: boolean;
  created_at: string;
}

export interface PhotoRow {
  id: number;
  url: string;
  created_at: string;
}

export interface CreateBookingBody {
  phone: string;
  userName: string;
  date: string;
  startTime: string;
  duration: number;
  extras: { balls: boolean; rackets: number; trainer: boolean };
  totalPrice: number;
}

export interface UpdateBookingBody {
  action: "confirm" | "cancel" | "edit";
  date?: string;
  startTime?: string;
  duration?: number;
  extras?: { balls: boolean; rackets: number; trainer: boolean };
  totalPrice?: number;
}