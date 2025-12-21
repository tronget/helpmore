import { useEffect, useMemo, useState } from 'react';
import { Mail, Send, Phone, Star, Plus, Heart, LogOut, Flag } from 'lucide-react';
import { CreateServiceModal } from './CreateServiceModal';
import { EditProfileModal } from './EditProfileModal';
import { useAuthStore } from '../store/authStore';
import {
  deleteBugReport,
  getMyBugReports,
  getMyReports,
  getUserById,
  type BugReportResponse,
  type ReportResponse,
} from '../api/userService';
import {
  deleteService,
  getFavorites,
  removeFavorite,
  searchServices,
  type ServiceDto,
} from '../api/marketplaceService';
import { useUsersById } from '../hooks/useUsersById';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { EditServiceModal } from './EditServiceModal';
import { BugReportModal } from './BugReportModal';
import { useI18n } from '../i18n/useI18n';

interface ProfilePageProps {
  onNavigateToService: (serviceId: string) => void;
  onLogout: () => void;
}

export function ProfilePage({ onNavigateToService, onLogout }: ProfilePageProps) {
  const { user, token, setUser } = useAuthStore();
  const { t, locale, dateLocale } = useI18n();
  const [activeTab, setActiveTab] = useState<'services' | 'favorites' | 'reports' | 'bugs'>('services');
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDto | null>(null);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [favorites, setFavorites] = useState<ServiceDto[]>([]);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [bugReports, setBugReports] = useState<BugReportResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !user?.id) {
      return;
    }

    let active = true;

    const loadProfile = async () => {
      try {
        const freshUser = await getUserById(token, user.id);
        if (!active) {
          return;
        }
        setUser(freshUser);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось обновить профиль.');
        setError(message);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [setUser, token, user?.id]);

  const loadData = async (userId: number, authToken: string) => {
    const [myServices, favoritesResponse, myReports, myBugReports] = await Promise.all([
      searchServices({ ownerId: userId, type: 'OFFER' }),
      getFavorites(userId),
      getMyReports(authToken),
      getMyBugReports(authToken),
    ]);
    setServices(myServices.content);
    setFavorites(favoritesResponse.content.map((item) => item.service));
    setReports(myReports);
    setBugReports(myBugReports);
  };

  useEffect(() => {
    if (!user?.id || !token) {
      return;
    }

    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        await loadData(user.id, token);
        if (!active) {
          return;
        }
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось загрузить данные профиля.');
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
  }, [token, user?.id]);

  const favoriteOwnerIds = useMemo(() => favorites.map((service) => service.ownerId), [favorites]);
  const { users: ownersById } = useUsersById(favoriteOwnerIds, token);
  const reportedIds = useMemo(() => reports.map((report) => report.reportedUserId), [reports]);
  const { users: reportedById } = useUsersById(reportedIds, token);

  const userName = useMemo(() => {
    if (!user) {
      return t('Пользователь');
    }
    const parts = [user.profile?.surname, user.profile?.name, user.profile?.middleName].filter(Boolean);
    return parts.length ? parts.join(' ') : user.email;
  }, [t, user]);

  const userEmail = user?.email ?? '—';
  const avatarSrc = user?.profile?.avatar
    ? `data:image/png;base64,${user.profile.avatar}`
    : null;
  const hasAvatar = Boolean(avatarSrc);

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

  const reportTypeLabel = (type: ReportResponse['type']) => {
    switch (type) {
      case 'spam':
        return t('Спам');
      case 'fraud':
        return t('Мошенничество');
      case 'insult':
        return t('Оскорбления');
      case 'illegal':
        return t('Нелегальный контент');
      case 'other':
        return t('Другое');
      default:
        return type;
    }
  };

  return (
    <div className="pt-[72px] bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8">
          <div className="flex gap-8">
            {/* Avatar */}
            {hasAvatar ? (
              <img
                src={avatarSrc}
                alt={userName}
                className="w-32 h-32 rounded-2xl object-cover"
              />
            ) : (
              <AvatarPlaceholder className="w-32 h-32 rounded-2xl" iconClassName="w-14 h-14" />
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="mb-2">{userName}</h2>
                  <p className="text-gray-600 mb-4">
                    {user?.profile?.faculty ?? t('Профиль подтверждён')}
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span>{user?.profile?.rate ?? '—'}</span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium text-gray-900">{services.length}</span> {t('услуг')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {t('Редактировать профиль')}
                  </button>
                  <button
                    onClick={() => setShowBugReportModal(true)}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {t('Сообщить о баге')}
                  </button>
                  <button
                    onClick={onLogout}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('Выйти')}
                  </button>
                </div>
              </div>

              {/* Contacts */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{userEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{user?.profile?.telegram ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{user?.profile?.phoneNumber ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 rounded-xl transition-colors ${
              activeTab === 'services'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t('Мои услуги')}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Heart className="w-5 h-5" />
            {t('Избранное')}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Flag className="w-5 h-5" />
            {t('Мои жалобы')}
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`px-6 py-3 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'bugs'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Flag className="w-5 h-5" />
            {t('Баг-репорты')}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-6">{error}</p>}

        {/* Content */}
        {activeTab === 'services' && (
          <div>
            {/* Add Service Button */}
            <button
              onClick={() => setShowCreateServiceModal(true)}
              className="w-full bg-white rounded-2xl p-8 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-lighter transition-all mb-6 flex items-center justify-center gap-3 text-gray-600 hover:text-primary"
            >
              <Plus className="w-6 h-6" />
              <span>{t('Добавить новую услугу')}</span>
            </button>

            {/* Services Grid */}
            <div className="grid grid-cols-3 gap-6">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onNavigateToService(String(service.id))}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group text-left"
                >
                  <div className="p-5">
                    <div className="inline-block px-3 py-1 bg-primary-lighter text-primary rounded-lg text-sm mb-3">
                      {service.categoryName}
                    </div>
                    <h4 className="mb-2 line-clamp-2">{service.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{user?.profile?.rate ?? '—'}</span>
                      </div>
                      <span className="text-primary">{formatPrice(service.price, service.barter)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingService(service);
                        }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        {t('Редактировать')}
                      </button>
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!user) {
                            return;
                          }
                          const confirmed = window.confirm(t('Удалить услугу?'));
                          if (!confirmed) {
                            return;
                          }
                          try {
                            await deleteService(service.id, user.id);
                            await loadData(user.id, token);
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : t('Не удалось удалить услугу.');
                            setError(message);
                          }
                        }}
                        className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        {t('Удалить')}
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {!isLoading && services.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">{t('У вас пока нет услуг')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {favorites.map((service) => {
                  const owner = ownersById[service.ownerId];
                  const ownerName =
                    [owner?.profile?.surname, owner?.profile?.name]
                      .filter(Boolean)
                      .join(' ')
                      .trim() || owner?.email || t('Пользователь');
                  const ownerAvatar = owner?.profile?.avatar
                    ? `data:image/png;base64,${owner.profile.avatar}`
                    : null;

                  return (
                    <button
                      key={service.id}
                      onClick={() => onNavigateToService(String(service.id))}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group text-left relative"
                    >
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!user) {
                            return;
                          }
                          try {
                            await removeFavorite(user.id, service.id);
                            await loadData(user.id, token);
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : t('Не удалось удалить из избранного.');
                            setError(message);
                          }
                        }}
                        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                      <div className="p-5">
                        <div className="inline-block px-3 py-1 bg-primary-lighter text-primary rounded-lg text-sm mb-3">
                          {service.categoryName}
                        </div>
                        <h4 className="mb-2 line-clamp-2">{service.title}</h4>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          {ownerAvatar ? (
                            <img
                              src={ownerAvatar}
                              alt={ownerName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <AvatarPlaceholder className="w-8 h-8" iconClassName="w-4 h-4" />
                          )}
                          <span className="text-sm text-gray-700">{ownerName}</span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{owner?.profile?.rate ?? '—'}</span>
                          </div>
                          <span className="text-primary">{formatPrice(service.price, service.barter)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="mb-2">{t('Пока нет избранных услуг')}</h3>
                <p className="text-gray-600">{t('Добавляйте понравившиеся услуги в избранное')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h3>{t('Мои жалобы')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('Всего: {count}', { count: reports.length })}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {reports.map((report) => {
                const reportedUser = reportedById[report.reportedUserId];
                const reportedName =
                  [reportedUser?.profile?.surname, reportedUser?.profile?.name]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || reportedUser?.email || `ID ${report.reportedUserId}`;
                return (
                  <div key={report.id} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="mb-1">{reportedName}</h4>
                        <p className="text-sm text-gray-500">{reportTypeLabel(report.type)}</p>
                        <p className="text-sm text-gray-700">{report.title}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleString(dateLocale)}
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-sm text-gray-600">{report.description}</p>
                    )}
                  </div>
                );
              })}
              {reports.length === 0 && (
                <div className="p-6 text-gray-500">{t('Жалоб пока нет.')}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bugs' && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3>{t('Мои баг-репорты')}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('Всего: {count}', { count: bugReports.length })}
                </p>
              </div>
              <button
                onClick={() => setShowBugReportModal(true)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                {t('Новый баг')}
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {bugReports.map((report) => (
                <div key={report.id} className="p-6 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="mb-1">{report.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleString(dateLocale)}
                    </p>
                    {report.description && (
                      <p className="text-sm text-gray-600 mt-2">{report.description}</p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!token || !user) {
                        return;
                      }
                      const confirmed = window.confirm(t('Удалить баг-репорт?'));
                      if (!confirmed) {
                        return;
                      }
                      try {
                        await deleteBugReport(token, report.id);
                        await loadData(user.id, token);
                      } catch (err) {
                        const message =
                          err instanceof Error ? err.message : t('Не удалось удалить баг-репорт.');
                        setError(message);
                      }
                    }}
                    className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    {t('Удалить')}
                  </button>
                </div>
              ))}
              {bugReports.length === 0 && (
                <div className="p-6 text-gray-500">{t('Баг-репортов пока нет.')}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateServiceModal && (
        <CreateServiceModal onClose={() => setShowCreateServiceModal(false)} />
      )}
      {showEditProfileModal && (
        <EditProfileModal onClose={() => setShowEditProfileModal(false)} />
      )}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onUpdated={async () => {
            if (user?.id) {
              await loadData(user.id, token);
            }
          }}
        />
      )}
      {showBugReportModal && (
        <BugReportModal onClose={() => setShowBugReportModal(false)} />
      )}
    </div>
  );
}
