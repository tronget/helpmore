import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { updateService, type ServiceDto } from '../api/marketplaceService';
import { useCategories } from '../hooks/useCategories';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n/useI18n';

interface EditServiceModalProps {
  service: ServiceDto;
  onClose: () => void;
  onUpdated: (service: ServiceDto) => void;
}

export function EditServiceModal({ service, onClose, onUpdated }: EditServiceModalProps) {
  const maxPrice = 1_000_000;
  const { categories } = useCategories();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const isOrder = service.type === 'ORDER';
  const [formData, setFormData] = useState({
    title: service.title,
    categoryId: String(service.categoryId),
    description: service.description,
    price: String(service.price),
    barter: service.barter,
    place: service.place ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((cat) => String(cat.id) === formData.categoryId),
    [categories, formData.categoryId],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError(t('Не удалось определить пользователя.'));
      return;
    }
    if (!selectedCategory) {
      setError(t('Выберите категорию.'));
      return;
    }
    if (formData.title.length > 255) {
      setError(t('Невозможно продолжить: название должно быть не более 255 символов.'));
      return;
    }
    if (formData.description.length > 5000) {
      setError(t('Невозможно продолжить: описание должно быть не более 5000 символов.'));
      return;
    }
    if (formData.place.length > 255) {
      setError(t('Невозможно продолжить: место должно быть не более 255 символов.'));
      return;
    }

    const parsedPrice = Number.parseFloat(formData.price.replace(',', '.'));
    if (!Number.isFinite(parsedPrice)) {
      setError(isOrder ? t('Укажите корректный бюджет.') : t('Укажите корректную цену.'));
      return;
    }
    if (parsedPrice > maxPrice) {
      setError(t('Сумма должна быть не больше 1 000 000.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await updateService(service.id, {
        requesterId: user.id,
        categoryId: selectedCategory.id,
        title: formData.title,
        description: formData.description,
        price: parsedPrice,
        barter: formData.barter,
        place: formData.place,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isOrder
            ? t('Не удалось обновить заказ.')
            : t('Не удалось обновить услугу.');
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
        aria-labelledby="edit-service-title"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 id="edit-service-title">
            {isOrder ? t('Редактировать заказ') : t('Редактировать услугу')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('Закрыть')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block mb-2 text-gray-700">
              {isOrder ? t('Название заказа *') : t('Название услуги *')}
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              maxLength={255}
              aria-label={isOrder ? t('Название заказа *') : t('Название услуги *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700">{t('Категория *')}</label>
            <select
              required
              value={formData.categoryId}
              onChange={(event) => setFormData({ ...formData, categoryId: event.target.value })}
              aria-label={t('Категория *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('Выберите категорию')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">
              {isOrder ? t('Описание задачи *') : t('Описание *')}
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              maxLength={5000}
              aria-label={isOrder ? t('Описание задачи *') : t('Описание *')}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">
                {isOrder ? t('Бюджет *') : t('Цена *')}
              </label>
              <input
                type="text"
                required
                value={formData.price}
                onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                aria-label={isOrder ? t('Бюджет *') : t('Цена *')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-700">{t('Бартер')}</label>
              <input
                type="checkbox"
                checked={formData.barter}
                onChange={(event) => setFormData({ ...formData, barter: event.target.checked })}
                aria-label={t('Бартер')}
                className="text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">
              {isOrder ? t('Место *') : t('Место')}
            </label>
            <input
              type="text"
              required={isOrder}
              value={formData.place}
              onChange={(event) => setFormData({ ...formData, place: event.target.value })}
              maxLength={255}
              aria-label={isOrder ? t('Место *') : t('Место')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

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
              {isSubmitting ? t('Сохраняем...') : t('Сохранить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
