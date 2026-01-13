import { useEffect, useMemo, useState } from 'react';
import { Star, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUsersById } from '../hooks/useUsersById';
import {
  getServiceFeedback,
  searchServices,
  type FeedbackDto,
} from '../api/marketplaceService';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { useI18n } from '../i18n/useI18n';

interface UserProfileModalProps {
  userId: number;
  onClose: () => void;
  showContacts?: boolean;
}

export function UserProfileModal({ userId, onClose, showContacts = true }: UserProfileModalProps) {
  const { token } = useAuthStore();
  const { t, dateLocale } = useI18n();
  const { users: usersById } = useUsersById([userId], token);
  const [feedback, setFeedback] = useState<FeedbackDto[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const profileUser = usersById[userId];
  const profileName =
    [profileUser?.profile?.surname, profileUser?.profile?.name, profileUser?.profile?.middleName]
      .filter(Boolean)
      .join(' ')
      .trim() || profileUser?.email || t('Пользователь');
  const profileAvatar = profileUser?.profile?.avatar
    ? `data:image/png;base64,${profileUser.profile.avatar}`
    : null;
  const feedbackSenderIds = useMemo(() => feedback.map((item) => item.senderId), [feedback]);
  const { users: feedbackSendersById } = useUsersById(feedbackSenderIds, token);
  const averageRate = feedback.length
    ? Math.round((feedback.reduce((sum, item) => sum + item.rate, 0) / feedback.length) * 10) / 10
    : null;

  useEffect(() => {
    if (!token || !userId) {
      setFeedback([]);
      setFeedbackError(null);
      setIsFeedbackLoading(false);
      return;
    }

    let active = true;
    setIsFeedbackLoading(true);
    setFeedbackError(null);

    const loadFeedback = async () => {
      try {
        const services = await searchServices({ ownerId: userId }, { size: 100 });
        const feedbackEntries = await Promise.all(
          services.content.map(async (service) => {
            const data = await getServiceFeedback(service.id);
            return data.content;
          }),
        );
        if (!active) {
          return;
        }
        setFeedback(feedbackEntries.flat());
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось загрузить отзывы.');
        setFeedbackError(message);
      } finally {
        if (active) {
          setIsFeedbackLoading(false);
        }
      }
    };

    loadFeedback();

    return () => {
      active = false;
    };
  }, [token, userId, t]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-title"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 id="user-profile-title">{t('Профиль пользователя')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('Закрыть')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {!profileUser ? (
            <p className="text-gray-500">{t('Загрузка профиля...')}</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <AvatarPlaceholder className="w-16 h-16 rounded-2xl" iconClassName="w-6 h-6" />
                )}
                <div>
                  <h4 className="mb-1">{profileName}</h4>
                  <p className="text-sm text-gray-600">
                    {profileUser.profile?.faculty ?? t('Профиль подтверждён')}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{averageRate ?? profileUser.profile?.rate ?? '—'}</span>
                  </div>
                </div>
              </div>
              {showContacts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{t('Email')}</p>
                    <p className="text-sm text-gray-700">{profileUser.email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('Телефон')}</p>
                    <p className="text-sm text-gray-700">
                      {profileUser.profile?.phoneNumber ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('Telegram')}</p>
                    <p className="text-sm text-gray-700">{profileUser.profile?.telegram ?? '—'}</p>
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">{t('О себе')}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {profileUser.profile?.bio ?? t('Пользователь пока не добавил описание.')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4>{t('Отзывы')}</h4>
                  <span className="text-sm text-gray-600">
                    {t('Выполненных заказов')}: {feedback.length}
                  </span>
                </div>
                {isFeedbackLoading && (
                  <p className="text-sm text-gray-500">{t('Загрузка...')}</p>
                )}
                {feedbackError && <p className="text-sm text-red-500">{feedbackError}</p>}
                {!isFeedbackLoading && !feedbackError && feedback.length === 0 && (
                  <p className="text-sm text-gray-500">{t('Отзывов пока нет.')}</p>
                )}
                <div className="space-y-4">
                  {feedback.map((review) => {
                    const sender = feedbackSendersById[review.senderId];
                    const senderName =
                      [sender?.profile?.surname, sender?.profile?.name]
                        .filter(Boolean)
                        .join(' ')
                        .trim() || sender?.email || t('Пользователь');
                    return (
                      <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-900">{senderName}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{review.rate}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                          </span>
                        </div>
                        {review.review && (
                          <p className="text-sm text-gray-600 mt-3">{review.review}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
