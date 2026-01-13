import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { updateUserProfile } from '../api/userService';
import { ApiError } from '../api/http';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n/useI18n';
import { LoadingIndicator } from './LoadingIndicator';

interface EditProfileModalProps {
  onClose: () => void;
}

export function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, token, setUser } = useAuthStore();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: user?.profile?.name ?? '',
    surname: user?.profile?.surname ?? '',
    middleName: user?.profile?.middleName ?? '',
    faculty: user?.profile?.faculty ?? '',
    bio: user?.profile?.bio ?? '',
    email: user?.email ?? '',
    telegram: user?.profile?.telegram ?? '',
    phone: user?.profile?.phoneNumber ?? '',
  });
  const [avatarBase64, setAvatarBase64] = useState<string | null>(
    user?.profile?.avatar ?? null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.profile?.avatar ? `data:image/png;base64,${user.profile.avatar}` : null,
  );
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [isAvatarProcessing, setIsAvatarProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAvatar = useMemo(() => Boolean(avatarPreview), [avatarPreview]);
  const normalizePhone = (value: string) => value.replace(/\D/g, '');
  const isValidRussianPhone = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return true;
    }
    const digits = normalizePhone(trimmed);
    if (digits.length !== 11) {
      return false;
    }
    return digits.startsWith('7') || digits.startsWith('8');
  };
  const getProfileErrorMessage = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 403) {
        return t('Нет прав для изменения профиля.');
      }
      if (err.status === 400 || err.status === 422) {
        return t('Проверьте корректность заполнения полей.');
      }
      if (err.message) {
        return err.message;
      }
    }
    return err instanceof Error ? err.message : t('Не удалось обновить профиль.');
  };

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      return;
    }
    setIsAvatarProcessing(true);
    if (!file.type.startsWith('image/')) {
      setError(t('Можно загружать только изображения.'));
      setIsAvatarProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError(t('Не удалось обработать изображение.'));
          return;
        }

        const minSide = Math.min(image.width, image.height);
        const sx = (image.width - minSide) / 2;
        const sy = (image.height - minSide) / 2;

        ctx.drawImage(image, sx, sy, minSide, minSide, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.split(',')[1] ?? null;
        setAvatarPreview(dataUrl);
        setAvatarBase64(base64);
        setAvatarFileName(file.name);
        setError(null);
        setIsAvatarProcessing(false);
      };
      image.onerror = () => {
        setError(t('Не удалось загрузить изображение.'));
        setIsAvatarProcessing(false);
      };
      image.src = String(reader.result);
    };
    reader.onerror = () => {
      setError(t('Не удалось прочитать файл.'));
      setIsAvatarProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      setError(t('Не удалось определить пользователя.'));
      return;
    }
    if (formData.name.length > 120) {
      setError(t('Невозможно продолжить: имя должно быть не более 120 символов.'));
      return;
    }
    if (formData.surname.length > 120) {
      setError(t('Невозможно продолжить: фамилия должна быть не более 120 символов.'));
      return;
    }
    if (formData.faculty.length > 160) {
      setError(t('Невозможно продолжить: факультет должен быть не более 160 символов.'));
      return;
    }
    if (formData.telegram.length > 64) {
      setError(t('Невозможно продолжить: Telegram должен быть не более 64 символов.'));
      return;
    }
    if (formData.bio.length > 5000) {
      setError(t('Невозможно продолжить: блок "О себе" должен быть не более 5000 символов.'));
      return;
    }

    if (!isValidRussianPhone(formData.phone)) {
      setError(t('Введите корректный российский номер телефона.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await updateUserProfile(token, user.id, {
        name: formData.name,
        surname: formData.surname,
        middleName: formData.middleName || null,
        avatar: avatarBase64,
        faculty: formData.faculty || null,
        bio: formData.bio || null,
        phoneNumber: formData.phone || null,
        telegram: formData.telegram || null,
      });
      setUser(updated);
      onClose();
    } catch (err) {
      setError(getProfileErrorMessage(err));
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
        aria-labelledby="edit-profile-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 id="edit-profile-title">{t('Редактировать профиль')}</h3>
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
          {/* Name */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Имя *')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={120}
              aria-label={t('Имя *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Surname */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Фамилия *')}</label>
            <input
              type="text"
              required
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              maxLength={120}
              aria-label={t('Фамилия *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Middle Name */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Отчество')}</label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              maxLength={120}
              aria-label={t('Отчество')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Faculty */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Факультет *')}</label>
            <input
              type="text"
              required
              value={formData.faculty}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              maxLength={160}
              aria-label={t('Факультет *')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block mb-2 text-gray-700">{t('О себе')}</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              aria-label={t('О себе')}
              maxLength={5000}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              {t('Максимум {count} символов.', { count: 5000 })}
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Email')}</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              aria-label={t('Email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Фото профиля')}</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border border-gray-200 overflow-hidden bg-gray-50">
                {hasAvatar ? (
                  <img src={avatarPreview ?? ''} alt={t('Превью аватара')} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    {t('Нет фото')}
                  </div>
                )}
              </div>
              <div>
                <input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                  aria-label={t('Фото профиля')}
                  aria-hidden="true"
                  className="sr-only"
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                />
                <label
                  htmlFor="avatar-file"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t('Выбрать файл')}
                </label>
                {avatarFileName && (
                  <p className="text-xs text-gray-500 mt-1">{avatarFileName}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{t('Только изображения, будет сжато до 512×512.')}</p>
                {isAvatarProcessing && (
                  <div className="mt-2">
                    <LoadingIndicator label={t('Обрабатываем изображение...')} size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telegram */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Telegram')}</label>
            <input
              type="text"
              value={formData.telegram}
              onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              maxLength={64}
              placeholder="@username"
              aria-label={t('Telegram')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-2 text-gray-700">{t('Телефон')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 999-99-99"
              aria-label={t('Телефон')}
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
              {isSubmitting ? t('Сохраняем...') : t('Сохранить изменения')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
