import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Star, MapPin, Heart, MessageCircle } from 'lucide-react';
import {
  addFavorite,
  createResponse,
  deleteService,
  getFavorites,
  getService,
  getServiceFeedback,
  removeFavorite,
  type FeedbackDto,
  type ServiceDto,
} from '../api/marketplaceService';
import { useUsersById } from '../hooks/useUsersById';
import { useAuthStore } from '../store/authStore';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { EditServiceModal } from './EditServiceModal';
import { ReportUserModal } from './ReportUserModal';
import { useI18n } from '../i18n/useI18n';

interface ServicePageProps {
  serviceId: string;
  onBack: () => void;
  onNavigateToChat: (chatId?: string, state?: { counterpartName?: string; serviceTitle?: string }) => void;
}

export function ServicePage({ serviceId, onBack, onNavigateToChat }: ServicePageProps) {
  const [service, setService] = useState<ServiceDto | null>(null);
  const [feedback, setFeedback] = useState<FeedbackDto[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { token, user } = useAuthStore();
  const { t, locale, dateLocale } = useI18n();

  const loadService = async () => {
    const serviceData = await getService(Number(serviceId));
    const feedbackData = await getServiceFeedback(Number(serviceId));
    return { serviceData, feedbackData };
  };

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const { serviceData, feedbackData } = await loadService();
        if (!active) {
          return;
        }
        setService(serviceData);
        setFeedback(feedbackData.content);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось загрузить услугу');
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [serviceId]);

  const ownerIds = useMemo(() => (service ? [service.ownerId] : []), [service]);
  const { users: ownersById } = useUsersById(ownerIds, token);
  const owner = service ? ownersById[service.ownerId] : undefined;
  const ownerName =
    [owner?.profile?.surname, owner?.profile?.name]
      .filter(Boolean)
      .join(' ')
      .trim() || owner?.email || t('Пользователь');
  const ownerAvatar = owner?.profile?.avatar
    ? `data:image/png;base64,${owner.profile.avatar}`
    : null;
  const ownerFaculty = owner?.profile?.faculty ?? t('Студент ИТМО');
  const ownerRate = owner?.profile?.rate ?? 0;
  const isOwner = Boolean(service && user && service.ownerId === user.id);

  useEffect(() => {
    if (!user?.id || !service) {
      return;
    }

    let active = true;

    const loadFavorites = async () => {
      try {
        const favorites = await getFavorites(user.id);
        if (!active) {
          return;
        }
        setIsFavorite(favorites.content.some((item) => item.service.id === service.id));
      } catch {
        if (!active) {
          return;
        }
      }
    };

    loadFavorites();

    return () => {
      active = false;
    };
  }, [service, user?.id]);

  const serviceTags = useMemo(() => {
    if (!service) {
      return [];
    }
    const tags = [] as string[];
    tags.push(service.type === 'OFFER' ? t('предложение') : t('заказ'));
    tags.push(service.barter ? t('бартер') : t('оплата'));
    if (service.status === 'ARCHIVED') {
      tags.push(t('архив'));
    }
    return tags;
  }, [service, t]);

  const averageRate = feedback.length
    ? Math.round((feedback.reduce((sum, item) => sum + item.rate, 0) / feedback.length) * 10) / 10
    : 0;

  const formatPrice = (price: number, barter: boolean) => {
    if (barter) {
      return t('Бартер');
    }
    const numberLocale = locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'zh-CN';
    return new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="pt-[72px] max-w-[1440px] mx-auto px-8 py-16">
        <p>{t('Загружаем услугу...')}</p>
      </div>
    );
  }

  if (!service || error) {
    return (
      <div className="pt-[72px] max-w-[1440px] mx-auto px-8 py-16">
        <p>{error ?? t('Услуга не найдена')}</p>
      </div>
    );
  }

  return (
    <div className="pt-[72px] bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('Назад к каталогу')}
        </button>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Title and Info */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="inline-block px-3 py-1 bg-primary-lighter text-primary rounded-lg text-sm mb-3">
                    {service.categoryName}
                  </div>
                  <h2 className="mb-2">{service.title}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span>{averageRate || '—'}</span>
                      <span className="text-gray-500">({t('{count} отзывов', { count: feedback.length })})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{service.place ?? t('Онлайн')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                      >
                        {t('Редактировать')}
                      </button>
                      <button
                        onClick={async () => {
                          if (!user) {
                            return;
                          }
                          const confirmed = window.confirm(t('Удалить услугу?'));
                          if (!confirmed) {
                            return;
                          }
                          try {
                            await deleteService(service.id, user.id);
                            onBack();
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : t('Не удалось удалить услугу.');
                            setError(message);
                          }
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm"
                      >
                        {t('Удалить')}
                      </button>
                    </>
                  )}
                  {!isOwner && (
                    <button
                      onClick={async () => {
                        if (!user) {
                          return;
                        }
                        try {
                          if (isFavorite) {
                            await removeFavorite(user.id, service.id);
                            setIsFavorite(false);
                          } else {
                            await addFavorite(user.id, service.id);
                            setIsFavorite(true);
                          }
                        } catch (err) {
                          const message =
                            err instanceof Error ? err.message : t('Не удалось обновить избранное.');
                          setError(message);
                        }
                      }}
                      className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>
                  )}
                  {!isOwner && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                    >
                      {t('Пожаловаться')}
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              {serviceTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {serviceTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3">{t('Описание')}</h3>
                <p>{service.description}</p>
              </div>

              {/* Price */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{t('Стоимость услуги')}</p>
                    <p className="text-3xl text-primary">{formatPrice(service.price, service.barter)}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    service.barter
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {service.barter ? t('Бартер') : t('Оплата')}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {feedback.length > 0 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="mb-6">{t('Отзывы')}</h3>
                <div className="space-y-6">
                  {feedback.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <span>{t('Отзыв')}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rate
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.review && <p className="text-gray-600">{review.review}</p>}
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-[96px]">
                <h3 className="mb-6">{t('Исполнитель')}</h3>

                <div className="flex flex-col items-center text-center mb-6">
                  {ownerAvatar ? (
                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <AvatarPlaceholder className="w-24 h-24 mb-4" iconClassName="w-10 h-10" />
                  )}
                  <h4 className="mb-1">{ownerName}</h4>
                  <p className="text-sm text-gray-600 mb-3">{ownerFaculty}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{ownerRate || '—'}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={async () => {
                      if (!user) {
                        return;
                      }
                      try {
                        const response = await createResponse(service.id, { senderId: user.id });
                        onNavigateToChat(String(response.id), {
                          counterpartName: ownerName,
                          serviceTitle: service.title,
                        });
                      } catch (err) {
                        const message =
                          err instanceof Error ? err.message : t('Не удалось создать отклик.');
                        setError(message);
                      }
                    }}
                    className="w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('Написать сообщение')}
                  </button>
                </div>
                <div className="text-sm text-gray-500 text-center">
                  {t('Контакты скрыты до начала сделки.')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showEditModal && service && (
        <EditServiceModal
          service={service}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setService(updated);
          }}
        />
      )}
      {showReportModal && service && (
        <ReportUserModal
          reportedUserId={service.ownerId}
          onClose={() => setShowReportModal(false)}
          onCreated={() => setError(null)}
        />
      )}
    </div>
  );
}
