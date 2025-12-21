import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { createService } from '../api/marketplaceService';
import { useAuthStore } from '../store/authStore';
import { getCategoryIcon } from '../utils/categoryIcons';
import { useI18n } from '../i18n/useI18n';

interface CreateServiceModalProps {
  onClose: () => void;
}

export function CreateServiceModal({ onClose }: CreateServiceModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    type: 'payment',
    place: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories } = useCategories();
  const { user } = useAuthStore();
  const { t } = useI18n();

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
      formData.price.replace(',', '.').replace(/[^\d.]/g, ''),
    );
    if (!Number.isFinite(parsedPrice)) {
      setError(t('Укажите корректную цену.'));
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
        type: 'OFFER',
        price: parsedPrice,
        barter: formData.type === 'barter',
        place: formData.place,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось создать услугу.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3>{t('Создать предложение')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Название услуги *')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('Например: Репетиторство по математике')}
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
            <label className="block mb-2 text-gray-700">{t('Описание *')}</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('Подробно опишите вашу услугу...')}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Price and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">{t('Цена *')}</label>
              <input
                type="text"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1500₽"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700">{t('Тип сделки *')}</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="payment">{t('Оплата')}</option>
                <option value="barter">{t('Бартер')}</option>
              </select>
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
              placeholder={t('Например: Онлайн / Кронверкский пр.')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
              {isSubmitting ? t('Создаём...') : t('Создать предложение')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
