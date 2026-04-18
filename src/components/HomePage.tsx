import { useState } from "react";
import { Review, CourtPhoto } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface HomePageProps {
  photos: CourtPhoto[];
  reviews: Review[];
  currentUser: { phone: string; name: string } | null;
  setCurrentUser: (u: { phone: string; name: string } | null) => void;
  onBook: () => void;
  onProfile: () => void;
  onAdmin: () => void;
  onDeleteReview: (id: string) => void;
  onAddReview: (r: Review) => void;
}

const HomePage = ({
  photos,
  reviews,
  currentUser,
  setCurrentUser,
  onBook,
  onProfile,
  onAdmin,
  onDeleteReview,
  onAddReview,
}: HomePageProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loginError, setLoginError] = useState("");

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.startsWith("7") || digits.startsWith("8")) {
      const d = digits.slice(1, 11);
      let res = "+7";
      if (d.length > 0) res += " (" + d.slice(0, 3);
      if (d.length >= 3) res += ") " + d.slice(3, 6);
      if (d.length >= 6) res += "-" + d.slice(6, 8);
      if (d.length >= 8) res += "-" + d.slice(8, 10);
      return res;
    }
    return val;
  };

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11;
  };

  const handleLogin = () => {
    if (!isValidPhone(loginPhone)) {
      setLoginError("Введите корректный номер телефона");
      return;
    }
    if (!loginName.trim()) {
      setLoginError("Введите ваше имя");
      return;
    }
    setCurrentUser({ phone: loginPhone, name: loginName.trim() });
    setShowLoginModal(false);
    setLoginError("");
  };

  const handleAddReview = () => {
    if (!reviewText.trim()) return;
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    const review: Review = {
      id: Date.now().toString(),
      authorPhone: currentUser.phone,
      authorName: currentUser.name,
      text: reviewText.trim(),
      createdAt: new Date().toISOString(),
    };
    onAddReview(review);
    setReviewText("");
    setShowReviewModal(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎾</span>
            <div>
              <div className="font-bold text-gray-900 text-lg leading-tight">Теннисный корт</div>
              <div className="text-xs text-gray-400">Бурцево</div>
            </div>
          </div>
          {currentUser ? (
            <button
              onClick={onProfile}
              className="flex items-center gap-2 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332] transition-colors"
            >
              <Icon name="User" size={16} />
              {currentUser.name}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Войти
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-white">
          {photos.length > 0 && (
            <div className="h-[340px] md:h-[440px] overflow-hidden">
              <img
                src={photos[0].url}
                alt="Теннисный корт"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-2 drop-shadow-lg">
              Теннисный корт
            </h1>
            <p className="text-white/80 text-base mb-6 text-center drop-shadow">
              Богородский район · деревня Бурцево · Вишнёвый переулок 17б
            </p>
            <button
              onClick={onBook}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold px-8 py-3 rounded-xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Забронировать корт
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={onBook}
              className="group bg-white border border-gray-200 hover:border-[#2d6a4f] rounded-2xl p-6 text-left transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#c8e6c9] transition-colors">
                <Icon name="CalendarDays" size={20} className="text-[#2d6a4f]" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Забронировать корт</div>
              <div className="text-sm text-gray-500">Выбери дату, время и услуги</div>
            </button>

            <button
              onClick={currentUser ? onProfile : () => setShowLoginModal(true)}
              className="group bg-white border border-gray-200 hover:border-[#2d6a4f] rounded-2xl p-6 text-left transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#c8e6c9] transition-colors">
                <Icon name="UserCircle" size={20} className="text-[#2d6a4f]" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Личный кабинет</div>
              <div className="text-sm text-gray-500">Мои бронирования и история</div>
            </button>

            <button
              onClick={() => {
                if (!currentUser) {
                  setShowLoginModal(true);
                } else {
                  setShowReviewModal(true);
                }
              }}
              className="group bg-white border border-gray-200 hover:border-[#2d6a4f] rounded-2xl p-6 text-left transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 bg-[#e8f5e9] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#c8e6c9] transition-colors">
                <Icon name="MessageSquare" size={20} className="text-[#2d6a4f]" />
              </div>
              <div className="font-semibold text-gray-900 mb-1">Оставить отзыв</div>
              <div className="text-sm text-gray-500">Поделитесь впечатлениями</div>
            </button>
          </div>
        </section>

        {/* Photos gallery */}
        {photos.length > 1 && (
          <section className="max-w-5xl mx-auto px-4 pb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Фото корта</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt="Корт"
                  className="w-full h-48 object-cover rounded-xl"
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Отзывы</h2>
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowLoginModal(true);
                } else {
                  setShowReviewModal(true);
                }
              }}
              className="text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332] transition-colors flex items-center gap-1"
            >
              <Icon name="Plus" size={14} />
              Написать отзыв
            </button>
          </div>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              <Icon name="MessageCircle" size={32} className="mx-auto mb-2 opacity-30" />
              <p>Отзывов пока нет. Будьте первым!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 group relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{r.authorName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDate(r.createdAt)}</div>
                    </div>
                    {currentUser && currentUser.phone === r.authorPhone && (
                      <button
                        onClick={() => onDeleteReview(r.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm mt-2 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Цены</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Аренда корта</span><span className="font-semibold text-gray-900">1 300 ₽/час</span></div>
                <div className="flex justify-between"><span>Ракетка</span><span className="font-semibold text-gray-900">350 ₽/час</span></div>
                <div className="flex justify-between"><span>Мячи</span><span className="font-semibold text-gray-900">150 ₽/час</span></div>
                <div className="flex justify-between"><span>Услуга тренера</span><span className="font-semibold text-gray-900">800 ₽/час</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Время работы</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Ежедневно</span><span className="font-semibold text-gray-900">07:00 — 23:00</span></div>
                <div className="flex justify-between"><span>Сезон</span><span className="font-semibold text-gray-900">20 апр — 1 ноя</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1">Есть вопросы? Звоните</div>
                <div className="flex items-center gap-2">
                  <Icon name="Phone" size={14} className="text-[#2d6a4f]" />
                  <span className="font-semibold text-gray-800">8 930 278 29 29</span>
                  <span className="text-xs text-gray-400">(Арсений)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon name="MapPin" size={14} className="text-[#2d6a4f]" />
              Богородский район, деревня Бурцево, Вишнёвый переулок 17б
            </div>
            <button
              onClick={onAdmin}
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              Войти в админку
            </button>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Вход</h3>
              <button onClick={() => { setShowLoginModal(false); setLoginError(""); }} className="text-gray-400 hover:text-gray-600">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Имя</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Телефон</label>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors"
                />
              </div>
              {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
              <button
                onClick={handleLogin}
                className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-1"
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Оставить отзыв</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon name="X" size={20} />
              </button>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Поделитесь вашими впечатлениями..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2d6a4f] resize-none transition-colors"
            />
            <button
              onClick={handleAddReview}
              disabled={!reviewText.trim()}
              className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-3"
            >
              Опубликовать
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;