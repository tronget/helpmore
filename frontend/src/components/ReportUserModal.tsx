import { useState } from 'react';
import { X } from 'lucide-react';
import { createReport, type ReportType } from '../api/userService';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n/useI18n';

interface ReportUserModalProps {
  reportedUserId: number;
  onClose: () => void;
  onCreated?: () => void;
}

const reportOptions: { value: ReportType; labelKey: string }[] = [
  { value: 'spam', labelKey: 'Спам' },
  { value: 'fraud', labelKey: 'Мошенничество' },
  { value: 'insult', labelKey: 'Оскорбления' },
  { value: 'illegal', labelKey: 'Нелегальный контент' },
  { value: 'other', labelKey: 'Другое' },
];

export function ReportUserModal({ reportedUserId, onClose, onCreated }: ReportUserModalProps) {
  const { token } = useAuthStore();
  const { t } = useI18n();
  const [type, setType] = useState<ReportType>('spam');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError(t('Нет токена для отправки жалобы.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (!title.trim()) {
      setError(t('Укажите заголовок жалобы.'));
      return;
    }

    try {
      await createReport(token, {
        reportedUserId,
        type,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('Не удалось отправить жалобу.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-user-title"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 id="report-user-title">{t('Пожаловаться на пользователя')}</h3>
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
            <label className="block mb-2 text-gray-700">{t('Тип жалобы *')}</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ReportType)}
              aria-label={t('Тип жалобы *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">{t('Заголовок *')}</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              aria-label={t('Заголовок *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('Коротко опишите проблему')}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/255</p>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">{t('Описание')}</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={2048}
              aria-label={t('Описание')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder={t('Добавьте детали')}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/2048</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
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
              {isSubmitting ? t('Отправляем...') : t('Отправить жалобу')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
