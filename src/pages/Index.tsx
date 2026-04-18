import { useState, useEffect, useCallback } from "react";
import HomePage from "@/components/HomePage";
import BookingModal from "@/components/BookingModal";
import ProfilePage from "@/components/ProfilePage";
import AdminPage from "@/components/AdminPage";
import * as api from "@/lib/api";

export type View = "home" | "profile" | "admin";

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  extras: { balls: boolean; rackets: number; trainer: boolean };
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  phone: string;
  userName: string;
  createdAt: string;
}

export interface Review {
  id: string;
  authorPhone: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface BlockedSlot {
  id: string;
  type: "court" | "trainer";
  date: string;
  hours: number[];
  allDay: boolean;
}

export interface CourtPhoto {
  id: string;
  url: string;
}

function rowToBooking(r: api.BookingRow): Booking {
  return {
    id: String(r.id),
    date: r.date,
    startTime: r.start_time,
    duration: Number(r.duration),
    extras: { balls: r.extras_balls, rackets: r.extras_rackets, trainer: r.extras_trainer },
    totalPrice: r.total_price,
    status: r.status,
    phone: r.user_phone,
    userName: r.user_name,
    createdAt: r.created_at,
  };
}

function rowToReview(r: api.ReviewRow): Review {
  return { id: String(r.id), authorPhone: r.author_phone, authorName: r.author_name, text: r.text, createdAt: r.created_at };
}

function rowToSlot(r: api.BlockedSlotRow): BlockedSlot {
  return { id: String(r.id), type: r.type, date: r.date, hours: r.hours || [], allDay: r.all_day };
}

function rowToPhoto(r: api.PhotoRow): CourtPhoto {
  return { id: String(r.id), url: r.url };
}

const USER_KEY = "tc_current_user";
function loadUser(): { phone: string; name: string } | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [photos, setPhotos] = useState<CourtPhoto[]>([]);
  const [currentUser, setCurrentUserState] = useState<{ phone: string; name: string } | null>(loadUser);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const setCurrentUser = (u: { phone: string; name: string } | null) => {
    setCurrentUserState(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, s, p] = await Promise.all([
        api.getBookings(),
        api.getReviews(),
        api.getBlockedSlots(),
        api.getPhotos(),
      ]);
      setBookings(b.map(rowToBooking));
      setReviews(r.map(rowToReview));
      setBlockedSlots(s.map(rowToSlot));
      setPhotos(p.map(rowToPhoto));
    } catch (e) {
      console.error("Ошибка загрузки данных:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addBooking = async (booking: Booking) => {
    const row = await api.createBooking({
      phone: booking.phone,
      userName: booking.userName,
      date: booking.date,
      startTime: booking.startTime,
      duration: booking.duration,
      extras: booking.extras,
      totalPrice: booking.totalPrice,
    });
    setBookings((prev) => [...prev, rowToBooking(row)]);
  };

  const cancelBooking = async (id: string) => {
    await api.updateBooking(Number(id), { action: "cancel" });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
  };

  const confirmBooking = async (id: string) => {
    await api.updateBooking(Number(id), { action: "confirm" });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "confirmed" } : b));
  };

  const deleteBookingItem = async (id: string) => {
    await api.deleteBooking(Number(id));
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const editBooking = async (updated: Booking) => {
    await api.updateBooking(Number(updated.id), {
      action: "edit",
      date: updated.date,
      startTime: updated.startTime,
      duration: updated.duration,
      extras: updated.extras,
      totalPrice: updated.totalPrice,
    });
    setBookings((prev) => prev.map((b) => b.id === updated.id ? { ...updated, status: "pending" } : b));
  };

  const addReview = async (review: Review) => {
    const row = await api.createReview({ authorPhone: review.authorPhone, authorName: review.authorName, text: review.text });
    setReviews((prev) => [rowToReview(row), ...prev]);
  };

  const deleteReview = async (id: string, isAdmin = false) => {
    await api.deleteReview(Number(id), currentUser?.phone, isAdmin);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const addBlockedSlot = async (slot: BlockedSlot) => {
    const row = await api.createBlockedSlot({ type: slot.type, date: slot.date, hours: slot.hours, allDay: slot.allDay });
    setBlockedSlots((prev) => [...prev, rowToSlot(row)]);
  };

  const removeBlockedSlot = async (id: string) => {
    await api.deleteBlockedSlot(Number(id));
    setBlockedSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const addPhoto = async (photo: CourtPhoto) => {
    const row = await api.createPhoto(photo.url);
    setPhotos((prev) => [...prev, rowToPhoto(row)]);
  };

  const removePhoto = async (id: string) => {
    await api.deletePhoto(Number(id));
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🎾</div>
          <div className="text-gray-400 text-sm">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'Golos Text', sans-serif" }}>
      {view === "home" && (
        <HomePage
          photos={photos}
          reviews={reviews}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onBook={() => setShowBookingModal(true)}
          onProfile={() => setView("profile")}
          onAdmin={() => setView("admin")}
          onDeleteReview={(id) => deleteReview(id)}
          onAddReview={addReview}
        />
      )}
      {view === "profile" && (
        <ProfilePage
          bookings={bookings}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onBack={() => setView("home")}
          onCancelBooking={cancelBooking}
          onEditBooking={editBooking}
          onBook={() => { setView("home"); setShowBookingModal(true); }}
          blockedSlots={blockedSlots}
        />
      )}
      {view === "admin" && (
        <AdminPage
          bookings={bookings}
          photos={photos}
          blockedSlots={blockedSlots}
          onBack={() => setView("home")}
          onConfirm={confirmBooking}
          onCancel={cancelBooking}
          onDelete={deleteBookingItem}
          onAddBlockedSlot={addBlockedSlot}
          onRemoveBlockedSlot={removeBlockedSlot}
          onAddPhoto={addPhoto}
          onRemovePhoto={removePhoto}
          onDeleteReview={(id) => deleteReview(id, true)}
        />
      )}
      {showBookingModal && (
        <BookingModal
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          bookings={bookings}
          blockedSlots={blockedSlots}
          onClose={() => setShowBookingModal(false)}
          onBook={async (booking) => {
            await addBooking(booking);
            setShowBookingModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Index;
