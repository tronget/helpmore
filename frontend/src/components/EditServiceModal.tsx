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
  const { categories } = useCategories();
  const { user } = useAuthStore();
  const { t } = useI18n();
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

    const parsedPrice = Number.parseFloat(formData.price.replace(',', '.'));
    if (!Number.isFinite(parsedPrice)) {
      setError(t('Укажите корректную цену.'));
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
      const message = err instanceof Error ? err.message : t('Не удалось обновить услугу.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3>{t('Редактировать услугу')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block mb-2 text-gray-700">{t('Название услуги *')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700">{t('Категория *')}</label>
            <select
              required
              value={formData.categoryId}
              onChange={(event) => setFormData({ ...formData, categoryId: event.target.value })}
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
            <label className="block mb-2 text-gray-700">{t('Описание *')}</label>
            <textarea
              required
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">{t('Цена *')}</label>
              <input
                type="text"
                required
                value={formData.price}
                onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-700">{t('Бартер')}</label>
              <input
                type="checkbox"
                checked={formData.barter}
                onChange={(event) => setFormData({ ...formData, barter: event.target.checked })}
                className="text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">{t('Место')}</label>
            <input
              type="text"
              value={formData.place}
              onChange={(event) => setFormData({ ...formData, place: event.target.value })}
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
