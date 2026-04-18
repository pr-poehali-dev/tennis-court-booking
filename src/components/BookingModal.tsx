import { useState, useEffect } from "react";
import { Booking, BlockedSlot } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface BookingModalProps {
  currentUser: { phone: string; name: string } | null;
  setCurrentUser: (u: { phone: string; name: string } | null) => void;
  bookings: Booking[];
  blockedSlots: BlockedSlot[];
  onClose: () => void;
  onBook: (booking: Booking) => void;
  editBooking?: Booking;
}

const SEASON_START = new Date("2026-04-20");
const SEASON_END = new Date("2026-11-01");

const PRICES = {
  court: 1300,
  racket: 350,
  balls: 150,
  trainer: 800,
};

function getDates() {
  const dates: Date[] = [];
  const cur = new Date(SEASON_START);
  while (cur <= SEASON_END) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function formatDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDateRU(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
}

function getAvailableHours(
  date: string,
  duration: number,
  bookings: Booking[],
  blockedSlots: BlockedSlot[]
): number[] {
  const booked = bookings
    .filter((b) => b.date === date && b.status !== "cancelled")
    .flatMap((b) => {
      const slots = [];
      for (let i = 0; i < b.duration * 2; i++) {
        const h = parseFloat(b.startTime.split(":")[0]) + parseFloat(b.startTime.split(":")[1]) / 60 + i * 0.5;
        slots.push(h);
      }
      return slots;
    });

  const blocked = blockedSlots
    .filter((s) => s.type === "court" && s.date === date)
    .flatMap((s) => (s.allDay ? Array.from({ length: 32 }, (_, i) => 7 + i * 0.5) : s.hours.flatMap((h) => [h, h + 0.5])));

  const available: number[] = [];
  const maxEnd = 23;
  for (let h = 7; h <= maxEnd - duration; h += 1) {
    const needed = [];
    for (let i = 0; i < duration * 2; i++) {
      needed.push(h + i * 0.5);
    }
    const allFree = needed.every((slot) => !booked.includes(slot) && !blocked.includes(slot));
    if (allFree && h + duration <= maxEnd) {
      available.push(h);
    }
  }
  return available;
}

function isTrainerBlocked(date: string, hour: number, duration: number, blockedSlots: BlockedSlot[]) {
  const trainerSlots = blockedSlots
    .filter((s) => s.type === "trainer" && s.date === date)
    .flatMap((s) => (s.allDay ? Array.from({ length: 32 }, (_, i) => 7 + i * 0.5) : s.hours.flatMap((h) => [h, h + 0.5])));
  for (let i = 0; i < duration * 2; i++) {
    if (trainerSlots.includes(hour + i * 0.5)) return true;
  }
  return false;
}

function hourToLabel(h: number) {
  const hh = Math.floor(h);
  const mm = h % 1 === 0.5 ? "30" : "00";
  return `${hh.toString().padStart(2, "0")}:${mm}`;
}

function calcPrice(duration: number, extras: { balls: boolean; rackets: number; trainer: boolean }) {
  let total = PRICES.court * duration;
  if (extras.balls) total += PRICES.balls * duration;
  if (extras.rackets > 0) total += PRICES.racket * extras.rackets * duration;
  if (extras.trainer) total += PRICES.trainer * duration;
  return total;
}

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

const BookingModal = ({
  currentUser,
  setCurrentUser,
  bookings,
  blockedSlots,
  onClose,
  onBook,
  editBooking,
}: BookingModalProps) => {
  const [step, setStep] = useState<"date" | "time" | "extras" | "contact" | "done">("date");
  const [selectedDate, setSelectedDate] = useState<string>(editBooking?.date || "");
  const [selectedDuration, setSelectedDuration] = useState<number>(editBooking?.duration || 1);
  const [selectedHour, setSelectedHour] = useState<number | null>(
    editBooking ? parseFloat(editBooking.startTime.split(":")[0]) + parseFloat(editBooking.startTime.split(":")[1]) / 60 : null
  );
  const [extras, setExtras] = useState({
    balls: editBooking?.extras.balls || false,
    rackets: editBooking?.extras.rackets || 0,
    trainer: editBooking?.extras.trainer || false,
  });
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [name, setName] = useState(currentUser?.name || "");
  const [error, setError] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const start = new Date(SEASON_START);
    return { year: start.getFullYear(), month: start.getMonth() };
  });

  const allDates = getDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableHours = selectedDate && selectedDuration
    ? getAvailableHours(selectedDate, selectedDuration, bookings, blockedSlots)
    : [];

  const trainerUnavailable = selectedDate && selectedHour !== null
    ? isTrainerBlocked(selectedDate, selectedHour, selectedDuration, blockedSlots)
    : false;

  const totalPrice = calcPrice(selectedDuration, extras);

  const handleBook = () => {
    if (!phone || phone.replace(/\D/g, "").length !== 11) {
      setError("Введите корректный номер телефона");
      return;
    }
    if (!name.trim()) {
      setError("Введите ваше имя");
      return;
    }
    if (!currentUser) {
      setCurrentUser({ phone, name: name.trim() });
    }
    const booking: Booking = {
      id: editBooking?.id || Date.now().toString(),
      date: selectedDate,
      startTime: hourToLabel(selectedHour!),
      duration: selectedDuration,
      extras,
      totalPrice,
      status: "pending",
      phone: phone.replace(/\D/g, "").startsWith("7") ? "+" + phone.replace(/\D/g, "") : phone,
      userName: name.trim(),
      createdAt: editBooking?.createdAt || new Date().toISOString(),
    };
    onBook(booking);
    setStep("done");
  };

  const getCalendarDays = () => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;
    for (let i = 1; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const isDateAvailable = (d: Date) => {
    const key = formatDateKey(d);
    const start = new Date(SEASON_START);
    start.setHours(0, 0, 0, 0);
    const end = new Date(SEASON_END);
    end.setHours(0, 0, 0, 0);
    if (d < start || d > end) return false;
    if (d < today) return false;
    const courtBlocked = blockedSlots.some((s) => s.type === "court" && s.date === key && s.allDay);
    if (courtBlocked) return false;
    return true;
  };

  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];

  const days = getCalendarDays();
  const canPrevMonth = calendarMonth.month > 3 || calendarMonth.year > 2026;
  const canNextMonth = calendarMonth.month < 9 || calendarMonth.year < 2026;

  useEffect(() => {
    if (selectedHour !== null && !availableHours.includes(selectedHour)) {
      setSelectedHour(null);
    }
  }, [selectedDate, selectedDuration]);

  if (step === "done") {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center animate-slide-up">
          <div className="w-14 h-14 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle" size={28} className="text-[#2d6a4f]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Бронь создана!</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Для подтверждения переведите оплату за 10 минут до начала:
          </p>
          <div className="bg-[#f0fdf4] rounded-xl p-4 mb-6">
            <div className="font-bold text-[#2d6a4f] text-lg">8 930 278 29 29</div>
            <div className="text-sm text-gray-600">Арсений · Т-Банк</div>
            <div className="text-lg font-bold text-gray-900 mt-2">{totalPrice.toLocaleString()} ₽</div>
          </div>
          <div className="text-xs text-gray-400 mb-4">
            Бронь будет подтверждена администратором после оплаты. Если оплата не поступит за 10 минут до начала — бронь будет автоматически отменена.
          </div>
          <button
            onClick={onClose}
            className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {editBooking ? "Изменить бронирование" : "Забронировать корт"}
            </h3>
            <div className="flex gap-1 mt-1">
              {["date", "time", "extras", "contact"].map((s, i) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    ["date", "time", "extras", "contact"].indexOf(step) >= i
                      ? "bg-[#2d6a4f] w-6"
                      : "bg-gray-200 w-4"
                  }`}
                />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Date */}
          {step === "date" && (
            <div className="animate-slide-up">
              <h4 className="font-semibold text-gray-800 mb-4">Выберите дату</h4>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    if (canPrevMonth) {
                      const m = calendarMonth.month === 0 ? 11 : calendarMonth.month - 1;
                      const y = calendarMonth.month === 0 ? calendarMonth.year - 1 : calendarMonth.year;
                      setCalendarMonth({ year: y, month: m });
                    }
                  }}
                  disabled={!canPrevMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
                >
                  <Icon name="ChevronLeft" size={16} />
                </button>
                <span className="font-semibold text-gray-800 text-sm">
                  {months[calendarMonth.month]} {calendarMonth.year}
                </span>
                <button
                  onClick={() => {
                    if (canNextMonth) {
                      const m = calendarMonth.month === 11 ? 0 : calendarMonth.month + 1;
                      const y = calendarMonth.month === 11 ? calendarMonth.year + 1 : calendarMonth.year;
                      setCalendarMonth({ year: y, month: m });
                    }
                  }}
                  disabled={!canNextMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
                >
                  <Icon name="ChevronRight" size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
                  <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const key = formatDateKey(d);
                  const available = isDateAvailable(d);
                  const selected = key === selectedDate;
                  return (
                    <button
                      key={i}
                      disabled={!available}
                      onClick={() => setSelectedDate(key)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                        selected
                          ? "bg-[#2d6a4f] text-white"
                          : available
                          ? "hover:bg-[#e8f5e9] text-gray-800"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={!selectedDate}
                onClick={() => setStep("time")}
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
              >
                Далее
              </button>
            </div>
          )}

          {/* Step 2: Time + Duration */}
          {step === "time" && (
            <div className="animate-slide-up">
              <button onClick={() => setStep("date")} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
                <Icon name="ArrowLeft" size={14} /> Назад
              </button>
              <h4 className="font-semibold text-gray-800 mb-1">Продолжительность</h4>
              <div className="flex gap-2 mb-6">
                {[1, 1.5, 2].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      selectedDuration === d
                        ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                        : "border-gray-200 text-gray-700 hover:border-[#2d6a4f]"
                    }`}
                  >
                    {d === 1 ? "1 час" : d === 1.5 ? "1.5 часа" : "2 часа"}
                  </button>
                ))}
              </div>
              <h4 className="font-semibold text-gray-800 mb-3">Время начала</h4>
              {availableHours.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">
                  Нет доступного времени на эту дату
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableHours.map((h) => (
                    <button
                      key={h}
                      onClick={() => setSelectedHour(h)}
                      className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedHour === h
                          ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                          : "border-gray-200 text-gray-700 hover:border-[#2d6a4f]"
                      }`}
                    >
                      {hourToLabel(h)}
                    </button>
                  ))}
                </div>
              )}
              <button
                disabled={selectedHour === null}
                onClick={() => setStep("extras")}
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
              >
                Далее
              </button>
            </div>
          )}

          {/* Step 3: Extras */}
          {step === "extras" && (
            <div className="animate-slide-up">
              <button onClick={() => setStep("time")} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
                <Icon name="ArrowLeft" size={14} /> Назад
              </button>
              <h4 className="font-semibold text-gray-800 mb-4">Дополнительные услуги</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-[#f0fdf4] transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extras.balls}
                      onChange={(e) => setExtras((p) => ({ ...p, balls: e.target.checked }))}
                      className="w-4 h-4 accent-[#2d6a4f]"
                    />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">Мячи</div>
                      <div className="text-xs text-gray-500">150 ₽/час</div>
                    </div>
                  </div>
                  {extras.balls && (
                    <span className="text-sm font-semibold text-[#2d6a4f]">
                      +{(PRICES.balls * selectedDuration).toLocaleString()} ₽
                    </span>
                  )}
                </label>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">Ракетки</div>
                      <div className="text-xs text-gray-500">350 ₽/ракетка/час</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExtras((p) => ({ ...p, rackets: Math.max(0, p.rackets - 1) }))}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#2d6a4f] transition-colors"
                      >
                        <Icon name="Minus" size={12} />
                      </button>
                      <span className="w-6 text-center font-semibold text-sm">{extras.rackets}</span>
                      <button
                        onClick={() => setExtras((p) => ({ ...p, rackets: Math.min(4, p.rackets + 1) }))}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#2d6a4f] transition-colors"
                      >
                        <Icon name="Plus" size={12} />
                      </button>
                    </div>
                  </div>
                  {extras.rackets > 0 && (
                    <div className="text-right text-sm font-semibold text-[#2d6a4f] mt-2">
                      +{(PRICES.racket * extras.rackets * selectedDuration).toLocaleString()} ₽
                    </div>
                  )}
                </div>

                <label className={`flex items-center justify-between bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-[#f0fdf4] transition-colors ${trainerUnavailable ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extras.trainer}
                      disabled={trainerUnavailable}
                      onChange={(e) => setExtras((p) => ({ ...p, trainer: e.target.checked }))}
                      className="w-4 h-4 accent-[#2d6a4f]"
                    />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">Услуга тренера</div>
                      <div className="text-xs text-gray-500">
                        {trainerUnavailable ? "Тренер недоступен в это время" : "800 ₽/час"}
                      </div>
                    </div>
                  </div>
                  {extras.trainer && (
                    <span className="text-sm font-semibold text-[#2d6a4f]">
                      +{(PRICES.trainer * selectedDuration).toLocaleString()} ₽
                    </span>
                  )}
                </label>
              </div>

              <div className="mt-6 bg-[#f0fdf4] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {selectedDate && new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                    {" · "}
                    {selectedHour !== null && hourToLabel(selectedHour)}
                    {" · "}
                    {selectedDuration === 1 ? "1 час" : selectedDuration === 1.5 ? "1.5 ч" : "2 ч"}
                  </div>
                  <div className="text-lg font-bold text-[#2d6a4f]">{totalPrice.toLocaleString()} ₽</div>
                </div>
              </div>

              <button
                onClick={() => setStep("contact")}
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-3 rounded-xl transition-colors mt-4"
              >
                Забронировать
              </button>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === "contact" && (
            <div className="animate-slide-up">
              <button onClick={() => setStep("extras")} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
                <Icon name="ArrowLeft" size={14} /> Назад
              </button>
              <h4 className="font-semibold text-gray-800 mb-4">Контактные данные</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Имя *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Телефон *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors"
                  />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>

              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <div className="font-semibold mb-1">💳 Оплата</div>
                Переведите{" "}
                <span className="font-bold">{totalPrice.toLocaleString()} ₽</span> за 10 минут до начала по номеру{" "}
                <span className="font-bold">8 930 278 29 29</span> (Арсений, Т-Банк)
              </div>

              <button
                onClick={handleBook}
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-3 rounded-xl transition-colors mt-4"
              >
                Подтвердить бронирование
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;