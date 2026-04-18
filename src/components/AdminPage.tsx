import { useState } from "react";
import { Booking, BlockedSlot, CourtPhoto } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface AdminPageProps {
  bookings: Booking[];
  photos: CourtPhoto[];
  blockedSlots: BlockedSlot[];
  onBack: () => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onAddBlockedSlot: (slot: BlockedSlot) => void;
  onRemoveBlockedSlot: (id: string) => void;
  onAddPhoto: (photo: CourtPhoto) => void;
  onRemovePhoto: (id: string) => void;
}

const ADMIN_PASSWORD = "Pinkpups07";

const formatDateRU = (d: string) =>
  new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });

const statusLabel = (s: string) => {
  if (s === "pending") return { label: "Ожидает оплаты", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (s === "confirmed") return { label: "Подтверждено", cls: "bg-green-50 text-green-700 border-green-200" };
  return { label: "Отменено", cls: "bg-gray-100 text-gray-500 border-gray-200" };
};

const SEASON_START = "2026-04-20";
const SEASON_END = "2026-11-01";

function getDatesInRange() {
  const dates: string[] = [];
  const cur = new Date(SEASON_START);
  const end = new Date(SEASON_END);
  while (cur <= end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const HOURS = Array.from({ length: 32 }, (_, i) => 7 + i * 0.5);
function hourToLabel(h: number) {
  return `${Math.floor(h).toString().padStart(2, "0")}:${h % 1 === 0.5 ? "30" : "00"}`;
}

const AdminPage = ({
  bookings,
  photos,
  blockedSlots,
  onBack,
  onConfirm,
  onCancel,
  onDelete,
  onAddBlockedSlot,
  onRemoveBlockedSlot,
  onAddPhoto,
  onRemovePhoto,
}: AdminPageProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [tab, setTab] = useState<"bookings" | "blocks" | "photos">("bookings");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  // Block form
  const [blockType, setBlockType] = useState<"court" | "trainer">("court");
  const [blockDate, setBlockDate] = useState("");
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockHours, setBlockHours] = useState<number[]>([]);

  // Photo
  const [photoUrl, setPhotoUrl] = useState("");

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      setPasswordError("Неверный пароль");
    }
  };

  const handleAddBlock = () => {
    if (!blockDate) return;
    const slot: BlockedSlot = {
      id: Date.now().toString(),
      type: blockType,
      date: blockDate,
      hours: blockAllDay ? [] : blockHours,
      allDay: blockAllDay,
    };
    onAddBlockedSlot(slot);
    setBlockDate("");
    setBlockHours([]);
  };

  const handleAddPhoto = () => {
    if (!photoUrl.trim()) return;
    onAddPhoto({ id: Date.now().toString(), url: photoUrl.trim() });
    setPhotoUrl("");
  };

  const toggleHour = (h: number) => {
    setBlockHours((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  };

  const filtered = bookings.filter((b) =>
    filterStatus === "all" ? true : b.status === filterStatus
  ).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Icon name="ArrowLeft" size={18} />
            </button>
            <span className="font-bold text-gray-900">Администратор</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Lock" size={24} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Вход для администратора</h2>
            <p className="text-sm text-gray-500 mb-6">Введите пароль для доступа</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              placeholder="Пароль"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] mb-3"
            />
            {passwordError && <p className="text-red-500 text-xs mb-3">{passwordError}</p>}
            <button
              onClick={handlePasswordSubmit}
              className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Icon name="ArrowLeft" size={18} />
            </button>
            <span className="font-bold text-gray-900">Панель администратора</span>
          </div>
          <button onClick={() => setAuthenticated(false)} className="text-sm text-gray-400 hover:text-gray-600">
            Выйти
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-3">
          {(["bookings", "blocks", "photos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-[#2d6a4f] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t === "bookings" ? "Бронирования" : t === "blocks" ? "Блокировки" : "Фото"}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Bookings tab */}
        {tab === "bookings" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {s === "all" ? "Все" : s === "pending" ? "Ожидают" : s === "confirmed" ? "Подтверждены" : "Отменены"}
                  <span className="ml-1.5 opacity-60">
                    {s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length}
                  </span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
                Нет бронирований
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((b) => {
                  const st = statusLabel(b.status);
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">{formatDateRU(b.date)}</div>
                          <div className="text-sm text-gray-500">
                            {b.startTime} · {b.duration === 1 ? "1 час" : b.duration === 1.5 ? "1.5 ч" : "2 ч"}
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Клиент</span>
                          <div className="font-medium text-gray-800">{b.userName}</div>
                          <div className="text-gray-500 text-xs">{b.phone}</div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Сумма</span>
                          <div className="font-bold text-gray-900">{b.totalPrice.toLocaleString()} ₽</div>
                        </div>
                      </div>
                      {(b.extras.balls || b.extras.rackets > 0 || b.extras.trainer) && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {b.extras.balls && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Мячи</span>}
                          {b.extras.rackets > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Ракетки × {b.extras.rackets}</span>}
                          {b.extras.trainer && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Тренер</span>}
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {b.status === "pending" && (
                          <button
                            onClick={() => onConfirm(b.id)}
                            className="flex-1 bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                          >
                            Подтвердить
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => onCancel(b.id)}
                            className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-2 rounded-lg transition-colors"
                          >
                            Отменить
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(b.id)}
                          className="border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          <Icon name="Trash2" size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Blocks tab */}
        {tab === "blocks" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Заблокировать время</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setBlockType("court")}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      blockType === "court" ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "border-gray-200 text-gray-700 hover:border-[#2d6a4f]"
                    }`}
                  >
                    🎾 Корт
                  </button>
                  <button
                    onClick={() => setBlockType("trainer")}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      blockType === "trainer" ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "border-gray-200 text-gray-700 hover:border-[#2d6a4f]"
                    }`}
                  >
                    👤 Тренер
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Дата</label>
                  <input
                    type="date"
                    value={blockDate}
                    min={SEASON_START}
                    max={SEASON_END}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockAllDay}
                    onChange={(e) => setBlockAllDay(e.target.checked)}
                    className="w-4 h-4 accent-[#2d6a4f]"
                  />
                  <span className="text-sm text-gray-700">Весь день</span>
                </label>

                {!blockAllDay && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Выберите часы</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          onClick={() => toggleHour(h)}
                          className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            blockHours.includes(h)
                              ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                              : "border-gray-200 text-gray-600 hover:border-[#2d6a4f]"
                          }`}
                        >
                          {hourToLabel(h)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddBlock}
                  disabled={!blockDate || (!blockAllDay && blockHours.length === 0)}
                  className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Заблокировать
                </button>
              </div>
            </div>

            {/* Active blocks */}
            {blockedSlots.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Активные блокировки</h3>
                <div className="space-y-2">
                  {blockedSlots.map((s) => (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {s.type === "court" ? "🎾 Корт" : "👤 Тренер"} · {formatDateRU(s.date)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {s.allDay ? "Весь день" : s.hours.map(hourToLabel).join(", ")}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveBlockedSlot(s.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photos tab */}
        {tab === "photos" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Добавить фото</h3>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Вставьте ссылку на фото..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
                />
                <button
                  onClick={handleAddPhoto}
                  disabled={!photoUrl.trim()}
                  className="bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-200 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Добавить
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden">
                  <img src={p.url} alt="Корт" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => onRemovePhoto(p.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
