import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { createService } from '../api/marketplaceService';
import { useAuthStore } from '../store/authStore';
import { getCategoryIcon } from '../utils/categoryIcons';
import { useI18n } from '../i18n/useI18n';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';

interface CreateOrderModalProps {
  onClose: () => void;
}

export function CreateOrderModal({ onClose }: CreateOrderModalProps) {
  const maxPrice = 1_000_000;
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    budget: '',
    deadline: '',
    place: '',
    type: 'payment',
  });
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories } = useCategories();
  const { user } = useAuthStore();
  const { t, dateLocale } = useI18n();

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.name === formData.category),
    [categories, formData.category],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(t('Не удалось определить пользователя.'));
      return;
    }
    if (!selectedCategory) {
      setError(t('Выберите категорию из списка.'));
      return;
    }

    const parsedPrice = Number.parseFloat(
      formData.budget.replace(',', '.').replace(/[^\d.]/g, ''),
    );
    if (!Number.isFinite(parsedPrice)) {
      setError(t('Укажите корректный бюджет.'));
      return;
    }
    if (parsedPrice > maxPrice) {
      setError(t('Сумма должна быть не больше 1 000 000.'));
      return;
    }

    if (!deadlineDate) {
      setError(t('Укажите дату завершения.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createService({
        ownerId: user.id,
        categoryId: selectedCategory.id,
        title: formData.title,
        description: formData.description,
        type: 'ORDER',
        price: parsedPrice,
        barter: formData.type === 'barter',
        place: formData.place,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось создать заказ.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-order-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 id="create-order-title">{t('Создать заказ')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('Закрыть')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Название заказа *')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('Например: Нужна помощь с курсовой по базам данных')}
              aria-label={t('Название заказа *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Категория *')}</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              aria-label={t('Категория *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('Выберите категорию')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {getCategoryIcon(cat.name)} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Описание задачи *')}</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('Подробно опишите, какая помощь вам нужна...')}
              aria-label={t('Описание задачи *')}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Budget and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">{t('Бюджет *')}</label>
              <input
                type="text"
                required
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="3000₽"
                aria-label={t('Бюджет *')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700">{t('Срок выполнения *')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start px-4 py-3 h-[46px] rounded-xl border border-gray-300 flex items-center gap-3"
                    aria-label={t('Срок выполнения *')}
                  >
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    {deadlineDate
                      ? deadlineDate.toLocaleDateString(dateLocale)
                      : t('Выберите дату')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 bg-white rounded-xl shadow-lg" align="start">
                  <Calendar
                    className="bg-white rounded-lg"
                    mode="single"
                    selected={deadlineDate ?? undefined}
                    onSelect={(date) => {
                      setDeadlineDate(date ?? null);
                      setFormData({
                        ...formData,
                        deadline: date ? date.toISOString() : '',
                      });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input type="hidden" required value={formData.deadline} readOnly />
            </div>
          </div>

          {/* Place */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Место *')}</label>
            <input
              type="text"
              required
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              placeholder={t('Например: Онлайн / Биржевая линия')}
              aria-label={t('Место *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Deal type */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Тип сделки *')}</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              aria-label={t('Тип сделки *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="payment">{t('Оплата')}</option>
              <option value="barter">{t('Бартер')}</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              {t('💡 После публикации заказа исполнители смогут откликнуться на него.')}
              <br />
              {t('Ваши контакты будут скрыты до момента начала сделки.')}
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('Отмена')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors disabled:opacity-60"
            >
              {isSubmitting ? t('Создаём...') : t('Создать заказ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
