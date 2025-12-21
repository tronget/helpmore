import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Clock, MessageCircle } from 'lucide-react';
import { createResponse, getService, type ServiceDto } from '../api/marketplaceService';
import { useUsersById } from '../hooks/useUsersById';
import { useAuthStore } from '../store/authStore';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { ReportUserModal } from './ReportUserModal';
import { useI18n } from '../i18n/useI18n';

interface OrderPageProps {
  orderId: string;
  onBack: () => void;
  onNavigateToChat: (chatId?: string, state?: { counterpartName?: string; serviceTitle?: string }) => void;
}

export function OrderPage({ orderId, onBack, onNavigateToChat }: OrderPageProps) {
  const [order, setOrder] = useState<ServiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const { token, user } = useAuthStore();
  const { t, locale, dateLocale } = useI18n();

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const data = await getService(Number(orderId));
        if (!active) {
          return;
        }
        setOrder(data);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось загрузить заказ');
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
  }, [orderId]);

  const ownerIds = useMemo(() => (order ? [order.ownerId] : []), [order]);
  const { users: ownersById } = useUsersById(ownerIds, token);
  const owner = order ? ownersById[order.ownerId] : undefined;
  const ownerName =
    [owner?.profile?.surname, owner?.profile?.name]
      .filter(Boolean)
      .join(' ')
      .trim() || owner?.email || t('Пользователь');
  const ownerAvatar = owner?.profile?.avatar
    ? `data:image/png;base64,${owner.profile.avatar}`
    : null;
  const isOwner = Boolean(order && user && order.ownerId === user.id);

  const formatPrice = (price: number) => {
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
        <p>{t('Загружаем заказ...')}</p>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="pt-[72px] max-w-[1440px] mx-auto px-8 py-16">
        <p>{error ?? t('Заказ не найден')}</p>
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
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="inline-block px-3 py-1 bg-primary-lighter text-primary rounded-lg text-sm">
                      {order.categoryName}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm ${
                      order.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status === 'ACTIVE' ? t('Активен') : t('Завершён')}
                    </div>
                  </div>
                  <h2 className="mb-4">{order.title}</h2>
                  
                  {/* Details */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span>{new Date(order.createdAt).toLocaleDateString(dateLocale)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{order.place ?? t('Онлайн')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageCircle className="w-5 h-5 text-gray-400" />
                      <span>{t('Отклики по запросу')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3">{t('Описание задачи')}</h3>
                <p>{order.description}</p>
              </div>

              {/* Budget */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{t('Бюджет')}</p>
                    <p className="text-3xl text-primary">{formatPrice(order.price)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="mb-4">{t('Требования')}</h3>
              <ul className="space-y-2 text-gray-600">
                <li>{t('• Опыт работы в данной области')}</li>
                <li>{t('• Соблюдение установленных сроков')}</li>
                <li>{t('• Качественное выполнение работы')}</li>
              </ul>
            </div>
          </div>

          {/* Sidebar - Author Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-[96px]">
              <h3 className="mb-6">{t('Заказчик')}</h3>

              {/* Author */}
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
                <p className="text-sm text-gray-600 mb-3">{owner?.profile?.faculty ?? t('Студент ИТМО')}</p>
              </div>

              {/* Contact Button */}
              {!isOwner && (
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={async () => {
                      if (!user || !order) {
                        return;
                      }
                      try {
                        const response = await createResponse(order.id, { senderId: user.id });
                        onNavigateToChat(String(response.id), {
                          counterpartName: ownerName,
                          serviceTitle: order.title,
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
                    {t('Откликнуться на заказ')}
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {t('Пожаловаться')}
                  </button>
                </div>
              )}
              {isOwner && (
                <div className="text-sm text-gray-500 text-center mb-6">
                  {t('Нельзя откликаться на собственный заказ.')}
                </div>
              )}

              {/* Info */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {t('Опубликовано: {date}', { date: new Date(order.createdAt).toLocaleDateString(dateLocale) })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showReportModal && order && (
        <ReportUserModal
          reportedUserId={order.ownerId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
