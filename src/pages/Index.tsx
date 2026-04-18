import { useState, useEffect } from "react";
import HomePage from "@/components/HomePage";
import BookingModal from "@/components/BookingModal";
import ProfilePage from "@/components/ProfilePage";
import AdminPage from "@/components/AdminPage";

export type View = "home" | "booking" | "profile" | "admin";

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  extras: {
    balls: boolean;
    rackets: number;
    trainer: boolean;
  };
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

const STORAGE_KEYS = {
  bookings: "tc_bookings",
  reviews: "tc_reviews",
  blockedSlots: "tc_blocked_slots",
  currentUser: "tc_current_user",
  photos: "tc_photos",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadFromStorage(STORAGE_KEYS.bookings, [])
  );
  const [reviews, setReviews] = useState<Review[]>(() =>
    loadFromStorage(STORAGE_KEYS.reviews, [])
  );
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() =>
    loadFromStorage(STORAGE_KEYS.blockedSlots, [])
  );
  const [currentUser, setCurrentUser] = useState<{ phone: string; name: string } | null>(() =>
    loadFromStorage(STORAGE_KEYS.currentUser, null)
  );
  const [photos, setPhotos] = useState<CourtPhoto[]>(() =>
    loadFromStorage(STORAGE_KEYS.photos, [
      {
        id: "1",
        url: "https://cdn.poehali.dev/projects/9d9345d5-e917-4edf-b2c8-5a3a59115d81/files/a28c0ef4-7573-4f6a-8232-51b3cb779a14.jpg",
      },
    ])
  );
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.bookings, bookings);
  }, [bookings]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.reviews, reviews);
  }, [reviews]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.blockedSlots, blockedSlots);
  }, [blockedSlots]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.currentUser, currentUser);
  }, [currentUser]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.photos, photos);
  }, [photos]);

  useEffect(() => {
    const now = new Date();
    setBookings((prev) =>
      prev.filter((b) => {
        if (b.status !== "pending") return true;
        const start = new Date(`${b.date}T${b.startTime}`);
        const diffMin = (start.getTime() - now.getTime()) / 60000;
        return diffMin > 10;
      })
    );
  }, []);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [...prev, booking]);
  };

  const cancelBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
  };

  const confirmBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b))
    );
  };

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const addReview = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

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
          onDeleteReview={deleteReview}
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
          onEditBooking={(updated) => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === updated.id ? { ...updated, status: "pending" } : b
              )
            );
          }}
          onBook={() => {
            setView("home");
            setShowBookingModal(true);
          }}
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
          onDelete={deleteBooking}
          onAddBlockedSlot={(slot) =>
            setBlockedSlots((prev) => [...prev, slot])
          }
          onRemoveBlockedSlot={(id) =>
            setBlockedSlots((prev) => prev.filter((s) => s.id !== id))
          }
          onAddPhoto={(photo) => setPhotos((prev) => [...prev, photo])}
          onRemovePhoto={(id) =>
            setPhotos((prev) => prev.filter((p) => p.id !== id))
          }
        />
      )}
      {showBookingModal && (
        <BookingModal
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          bookings={bookings}
          blockedSlots={blockedSlots}
          onClose={() => setShowBookingModal(false)}
          onBook={(booking) => {
            addBooking(booking);
            setShowBookingModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Index;
