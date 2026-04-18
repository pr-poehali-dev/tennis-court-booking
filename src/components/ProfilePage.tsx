import { useState } from "react";
import { Booking, BlockedSlot } from "@/pages/Index";
import Icon from "@/components/ui/icon";
import BookingModal from "@/components/BookingModal";

interface ProfilePageProps {
  bookings: Booking[];
  currentUser: { phone: string; name: string } | null;
  setCurrentUser: (u: { phone: string; name: string } | null) => void;
  onBack: () => void;
  onCancelBooking: (id: string) => void;
  onEditBooking: (booking: Booking) => void;
  onBook: () => void;
  blockedSlots: BlockedSlot[];
}

const ProfilePage = ({
  bookings,
  currentUser,
  setCurrentUser,
  onBack,
  onCancelBooking,
  onEditBooking,
  onBook,
  blockedSlots,
}: ProfilePageProps) => {
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length === 0) return "";
    const d = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1, 11) : digits.slice(0, 10);
    let res = "+7";
    if (d.length > 0) res += " (" + d.slice(0, 3);
    if (d.length >= 3) res += ") " + d.slice(3, 6);
    if (d.length >= 6) res += "-" + d.slice(6, 8);
    if (d.length >= 8) res += "-" + d.slice(8, 10);
    return res;
  };

  const isValidPhone = (phone: string) => phone.replace(/\D/g, "").length === 11;

  const handleLogin = () => {
    if (!isValidPhone(loginPhone)) { setLoginError("Введите корректный номер"); return; }
    if (!loginName.trim()) { setLoginError("Введите имя"); return; }
    setCurrentUser({ phone: loginPhone, name: loginName.trim() });
    setLoginError("");
  };

  const myBookings = currentUser
    ? bookings.filter(
        (b) => b.phone === currentUser.phone || b.phone === "+" + currentUser.phone.replace(/\D/g, "") || b.phone.replace(/\D/g, "") === currentUser.phone.replace(/\D/g, "")
      )
    : [];

  const activeBookings = myBookings.filter((b) => b.status !== "cancelled");
  const cancelledBookings = myBookings.filter((b) => b.status === "cancelled");

  const canCancel = (b: Booking) => {
    const start = new Date(`${b.date}T${b.startTime}`);
    const now = new Date();
    return (start.getTime() - now.getTime()) > 60 * 60 * 1000 && b.status !== "cancelled";
  };

  const canEdit = (b: Booking) => {
    const start = new Date(`${b.date}T${b.startTime}`);
    const now = new Date();
    return (start.getTime() - now.getTime()) > 2 * 60 * 60 * 1000 && b.status !== "cancelled";
  };

  const totalHours = myBookings
    .filter((b) => {
      const start = new Date(`${b.date}T${b.startTime}`);
      return b.status === "confirmed" && start < new Date();
    })
    .reduce((sum, b) => sum + b.duration, 0);

  const statusLabel = (s: string) => {
    if (s === "pending") return { label: "Ожидает оплаты", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    if (s === "confirmed") return { label: "Подтверждено", cls: "bg-green-50 text-green-700 border-green-200" };
    return { label: "Отменено", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  };

  const formatDateRU = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Icon name="ArrowLeft" size={18} />
            </button>
            <span className="font-bold text-gray-900">Личный кабинет</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="UserCircle" size={28} className="text-[#2d6a4f]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Вход в кабинет</h2>
              <p className="text-sm text-gray-500 mt-1">Введите имя и номер телефона</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Имя</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Телефон</label>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
                />
              </div>
              {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
              <button
                onClick={handleLogin}
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Icon name="ArrowLeft" size={18} />
            </button>
            <span className="font-bold text-gray-900">Личный кабинет</span>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* User card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
              <Icon name="User" size={22} className="text-[#2d6a4f]" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900">{currentUser.name}</div>
              <div className="text-sm text-gray-500">{currentUser.phone}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#2d6a4f]">{totalHours}</div>
              <div className="text-xs text-gray-400">часов на корте</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <Icon name="Phone" size={14} className="text-[#2d6a4f]" />
            <span className="text-sm font-medium text-gray-700">8 930 278 29 29</span>
            <span className="text-xs text-gray-400">(Арсений) — позвоните если есть вопросы</span>
          </div>
        </div>

        {/* New booking */}
        <button
          onClick={onBook}
          className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <Icon name="Plus" size={18} />
          Новое бронирование
        </button>

        {/* Active bookings */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Мои бронирования</h3>
          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Нет активных бронирований
            </div>
          ) : (
            <div className="space-y-3">
              {activeBookings.map((b) => {
                const st = statusLabel(b.status);
                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{formatDateRU(b.date)}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {b.startTime} · {b.duration === 1 ? "1 час" : b.duration === 1.5 ? "1.5 часа" : "2 часа"}
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    {(b.extras.balls || b.extras.rackets > 0 || b.extras.trainer) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {b.extras.balls && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Мячи</span>
                        )}
                        {b.extras.rackets > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            Ракетки × {b.extras.rackets}
                          </span>
                        )}
                        {b.extras.trainer && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Тренер</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{b.totalPrice.toLocaleString()} ₽</span>
                      <div className="flex gap-2">
                        {canEdit(b) && (
                          <button
                            onClick={() => setEditingBooking(b)}
                            className="text-xs text-[#2d6a4f] border border-[#2d6a4f] px-3 py-1.5 rounded-lg hover:bg-[#e8f5e9] transition-colors"
                          >
                            Изменить
                          </button>
                        )}
                        {canCancel(b) && (
                          <button
                            onClick={() => onCancelBooking(b.id)}
                            className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Отменить
                          </button>
                        )}
                      </div>
                    </div>
                    {b.status === "pending" && (
                      <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        Переведите {b.totalPrice.toLocaleString()} ₽ за 10 мин до начала: 8 930 278 29 29 (Арсений, Т-Банк)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancelled */}
        {cancelledBookings.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-400 mb-3 text-sm uppercase tracking-wide">Отменённые</h3>
            <div className="space-y-2">
              {cancelledBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-700 text-sm">{formatDateRU(b.date)}</div>
                      <div className="text-xs text-gray-400">{b.startTime} · {b.duration}ч</div>
                    </div>
                    <span className="text-xs text-gray-400">{b.totalPrice.toLocaleString()} ₽</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingBooking && (
        <BookingModal
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          bookings={bookings.filter((b) => b.id !== editingBooking.id)}
          blockedSlots={blockedSlots}
          editBooking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onBook={(updated) => {
            onEditBooking(updated);
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
