import { useState } from 'react';
import { X } from 'lucide-react';
import { createBugReport } from '../api/userService';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n/useI18n';

interface BugReportModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

export function BugReportModal({ onClose, onCreated }: BugReportModalProps) {
  const { token } = useAuthStore();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError(t('Нет токена для отправки баг-репорта.'));
      return;
    }
    if (!title.trim()) {
      setError(t('Укажите заголовок.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createBugReport(token, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('Не удалось отправить баг-репорт.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3>{t('Сообщить о баге')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block mb-2 text-gray-700">{t('Заголовок *')}</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder={t('Опишите, что произошло')}
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
              {isSubmitting ? t('Отправляем...') : t('Отправить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
