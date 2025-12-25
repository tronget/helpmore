import { useEffect, useMemo, useState } from 'react';
import { Shield, UserX, UserCheck, Trash2, Wrench, FolderPlus, FolderX } from 'lucide-react';
import {
  deleteUser,
  deleteBugReport,
  getAllReports,
  getBugReports,
  listUsers,
  updateUserBan,
  updateUserRole,
  type BugReportResponse,
  type ReportResponse,
} from '../api/userService';
import {
  changeServiceStatus,
  createCategory,
  deleteCategory,
  deleteService,
  getCategories,
  searchServices,
  updateCategory,
  type CategoryDto,
  type ServiceDto,
  type ServiceStatus,
} from '../api/marketplaceService';
import { useAuthStore } from '../store/authStore';
import { useUsersById } from '../hooks/useUsersById';
import { useI18n } from '../i18n/useI18n';

type RoleOption = 'user' | 'moderator' | 'admin';
type AdminSection = 'users' | 'services' | 'reports' | 'bugs';

export function AdminPanelPage() {
  const { token, user } = useAuthStore();
  const { t, dateLocale } = useI18n();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<Array<ReturnType<typeof normalizeUser>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [banInputs, setBanInputs] = useState<Record<number, string>>({});
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [categoryEdits, setCategoryEdits] = useState<Record<number, string>>({});
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | 'ALL'>('ALL');
  const [serviceType, setServiceType] = useState<'OFFER' | 'ORDER' | 'ALL'>('ALL');
  const [serviceOwnerId, setServiceOwnerId] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [serviceMinPrice, setServiceMinPrice] = useState('');
  const [serviceMaxPrice, setServiceMaxPrice] = useState('');
  const [serviceBarterOnly, setServiceBarterOnly] = useState(false);
  const [serviceCreatedAfter, setServiceCreatedAfter] = useState('');
  const [serviceCreatedBefore, setServiceCreatedBefore] = useState('');
  const [actionServiceId, setActionServiceId] = useState<number | null>(null);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [reportBanInputs, setReportBanInputs] = useState<Record<number, string>>({});
  const [bugReports, setBugReports] = useState<BugReportResponse[]>([]);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canManage = isAdmin || isModerator;

  const roleOptions: RoleOption[] = ['user', 'moderator', 'admin'];
  const roleLabelText = (role: RoleOption) => {
    if (role === 'admin') {
      return t('Админ');
    }
    if (role === 'moderator') {
      return t('Модератор');
    }
    return t('Пользователь');
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

  const reportUserIds = useMemo(
    () => reports.flatMap((report) => [report.userId, report.reportedUserId]),
    [reports],
  );
  const { users: reportUsersById } = useUsersById(reportUserIds, token);

  const loadUsers = async () => {
    if (!token) {
      setError(t('Нет токена для загрузки пользователей.'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await listUsers(token);
      const normalized = response.map(normalizeUser);
      setUsers(normalized);
      setError(null);
      setBanInputs((prev) => {
        const next = { ...prev };
        normalized.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = item.bannedTill ?? '';
          }
        });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось загрузить пользователей.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      setCategoryEdits((prev) => {
        const next = { ...prev };
        data.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = item.name;
          }
        });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось загрузить категории.');
      setError(message);
    }
  };

  const loadServices = async () => {
    try {
      const ownerId = Number.parseInt(serviceOwnerId, 10);
      const categoryId = Number.parseInt(serviceCategoryId, 10);
      const minPrice = Number.parseFloat(serviceMinPrice.replace(',', '.'));
      const maxPrice = Number.parseFloat(serviceMaxPrice.replace(',', '.'));
      const createdAfter = serviceCreatedAfter ? new Date(serviceCreatedAfter).toISOString() : undefined;
      const createdBefore = serviceCreatedBefore ? new Date(serviceCreatedBefore).toISOString() : undefined;

      const response = await searchServices({
        ownerId: Number.isFinite(ownerId) ? ownerId : undefined,
        categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
        type: serviceType === 'ALL' ? undefined : serviceType,
        status: serviceStatus === 'ALL' ? undefined : serviceStatus,
        titleLike: serviceQuery || undefined,
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
        barterOnly: serviceBarterOnly ? true : undefined,
        createdAfter,
        createdBefore,
      });
      setServices(response.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось загрузить услуги.');
      setError(message);
    }
  };

  const loadReports = async () => {
    if (!token) {
      return;
    }
    try {
      const data = await getAllReports(token);
      setReports(data);
      setReportBanInputs((prev) => {
        const next = { ...prev };
        data.forEach((report) => {
          if (!next[report.id]) {
            next[report.id] = '';
          }
        });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось загрузить жалобы.');
      setError(message);
    }
  };

  const loadBugReports = async () => {
    if (!token) {
      return;
    }
    try {
      const data = await getBugReports(token);
      setBugReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось загрузить баг-репорты.');
      setError(message);
    }
  };

  useEffect(() => {
    if (!canManage) {
      setIsLoading(false);
      return;
    }

    loadUsers();
    loadCategories();
    loadServices();
    loadReports();
    loadBugReports();
  }, [canManage, token]);

  const handleRoleChange = async (userId: number, role: RoleOption) => {
    if (!token) {
      return;
    }
    setActionUserId(userId);
    try {
      const updated = await updateUserRole(token, userId, { role });
      setUsers((prev) => prev.map((item) => (item.id === userId ? normalizeUser(updated) : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось обновить роль.');
      setError(message);
    } finally {
      setActionUserId(null);
    }
  };

  const handleBan = async (userId: number) => {
    if (!token) {
      return;
    }
    const value = banInputs[userId];
    if (!value) {
      setError(t('Укажите дату и время блокировки.'));
      return;
    }
    setActionUserId(userId);
    try {
      const bannedTill = new Date(value).toISOString();
      const updated = await updateUserBan(token, userId, { bannedTill });
      setUsers((prev) => prev.map((item) => (item.id === userId ? normalizeUser(updated) : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось заблокировать пользователя.');
      setError(message);
    } finally {
      setActionUserId(null);
    }
  };

  const handleUnban = async (userId: number) => {
    if (!token) {
      return;
    }
    setActionUserId(userId);
    try {
      const updated = await updateUserBan(token, userId, { bannedTill: null });
      setUsers((prev) => prev.map((item) => (item.id === userId ? normalizeUser(updated) : item)));
      setBanInputs((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось снять блокировку.');
      setError(message);
    } finally {
      setActionUserId(null);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!token) {
      return;
    }
    const confirmed = window.confirm(t('Удалить пользователя и профиль без возможности восстановления?'));
    if (!confirmed) {
      return;
    }
    setActionUserId(userId);
    try {
      await deleteUser(token, userId);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось удалить пользователя.');
      setError(message);
    } finally {
      setActionUserId(null);
    }
  };

  const handleCategoryCreate = async () => {
    const name = categoryDraft.trim();
    if (!name) {
      setError(t('Введите название категории.'));
      return;
    }
    try {
      const created = await createCategory({ name });
      setCategories((prev) => [...prev, created]);
      setCategoryEdits((prev) => ({ ...prev, [created.id]: created.name }));
      setCategoryDraft('');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось создать категорию.');
      setError(message);
    }
  };

  const handleCategoryUpdate = async (categoryId: number) => {
    const name = categoryEdits[categoryId]?.trim();
    if (!name) {
      setError(t('Введите название категории.'));
      return;
    }
    try {
      const updated = await updateCategory(categoryId, { name });
      setCategories((prev) => prev.map((item) => (item.id === categoryId ? updated : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось обновить категорию.');
      setError(message);
    }
  };

  const handleCategoryDelete = async (categoryId: number) => {
    const confirmed = window.confirm(t('Удалить категорию?'));
    if (!confirmed) {
      return;
    }
    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((item) => item.id !== categoryId));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось удалить категорию.');
      setError(message);
    }
  };

  const handleServiceStatus = async (serviceId: number, status: ServiceStatus) => {
    if (!token || !user) {
      setError(t('Нет прав для операции.'));
      return;
    }
    setActionServiceId(serviceId);
    try {
      const updated = await changeServiceStatus(serviceId, {
        requesterId: user.id,
        status,
      });
      setServices((prev) => prev.map((item) => (item.id === serviceId ? updated : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось обновить статус услуги.');
      setError(message);
    } finally {
      setActionServiceId(null);
    }
  };

  const handleServiceDelete = async (serviceId: number) => {
    if (!token || !user) {
      return;
    }
    const confirmed = window.confirm(t('Удалить услугу?'));
    if (!confirmed) {
      return;
    }
    setActionServiceId(serviceId);
    try {
      await deleteService(serviceId, user.id);
      setServices((prev) => prev.filter((item) => item.id !== serviceId));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Не удалось удалить услугу.');
      setError(message);
    } finally {
      setActionServiceId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="pt-[72px] max-w-[1200px] mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="mb-2">{t('Нет доступа')}</h2>
          <p className="text-gray-600">{t('Панель управления доступна только модераторам и администраторам.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[72px] bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="mb-1">{t('Панель управления')}</h2>
            <p className="text-gray-600 text-sm">{t('Управление пользователями')}</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="mb-1">{t('Администрирование')}</h3>
              <p className="text-sm text-gray-500">{t('Выберите раздел управления')}</p>
            </div>
            <div className="flex gap-2" role="tablist" aria-label={t('Администрирование')}>
              <button
                onClick={() => setActiveSection('users')}
                role="tab"
                id="admin-tab-users"
                aria-selected={activeSection === 'users'}
                aria-controls="admin-panel-users"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  activeSection === 'users'
                    ? 'border-primary text-primary bg-primary-lighter'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('Управление пользователями')}
              </button>
              <button
                onClick={() => setActiveSection('services')}
                role="tab"
                id="admin-tab-services"
                aria-selected={activeSection === 'services'}
                aria-controls="admin-panel-services"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  activeSection === 'services'
                    ? 'border-primary text-primary bg-primary-lighter'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('Управление услугами')}
              </button>
              <button
                onClick={() => setActiveSection('reports')}
                role="tab"
                id="admin-tab-reports"
                aria-selected={activeSection === 'reports'}
                aria-controls="admin-panel-reports"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  activeSection === 'reports'
                    ? 'border-primary text-primary bg-primary-lighter'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('Жалобы')}
              </button>
              <button
                onClick={() => setActiveSection('bugs')}
                role="tab"
                id="admin-tab-bugs"
                aria-selected={activeSection === 'bugs'}
                aria-controls="admin-panel-bugs"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  activeSection === 'bugs'
                    ? 'border-primary text-primary bg-primary-lighter'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('Баг-репорты')}
              </button>
            </div>
          </div>

          {activeSection === 'users' && (
            <div id="admin-panel-users" role="tabpanel" aria-labelledby="admin-tab-users">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="mb-1">{t('Пользователи')}</h3>
                  <p className="text-sm text-gray-500">{t('Всего: {count}', { count: users.length })}</p>
                </div>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  {t('Обновить')}
                </button>
              </div>

              {isLoading ? (
                <div className="p-6">
                  <p className="text-gray-500">{t('Загрузка пользователей...')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="mb-1">{item.displayName}</h4>
                          <p className="text-sm text-gray-500">{item.email}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            {t('ID: {id} · Роль: {role}', { id: item.id, role: roleLabelText(item.role) })}
                          </div>
                          {item.bannedTill && (
                            <div className="text-xs text-red-500 mt-1">
                              {t('Заблокирован до: {date}', {
                                date: new Date(item.bannedTill).toLocaleString(dateLocale),
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            item.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : item.role === 'moderator'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {roleLabelText(item.role)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">{t('Роль')}</label>
                          <select
                            value={item.role}
                            disabled={!isAdmin || actionUserId === item.id}
                            onChange={(event) => handleRoleChange(item.id, event.target.value as RoleOption)}
                            aria-label={t('Роль')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {roleLabelText(role)}
                              </option>
                            ))}
                          </select>
                          {!isAdmin && (
                            <span className="text-xs text-gray-400">{t('Только админ')}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">{t('Блокировка')}</label>
                          <input
                            type="datetime-local"
                            value={banInputs[item.id] ?? ''}
                            onChange={(event) =>
                              setBanInputs((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            aria-label={t('Блокировка')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleBan(item.id)}
                            disabled={actionUserId === item.id}
                            className="px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-2"
                          >
                            <UserX className="w-4 h-4" />
                            {t('Забанить')}
                          </button>
                          <button
                            onClick={() => handleUnban(item.id)}
                            disabled={actionUserId === item.id}
                            className="px-3 py-2 rounded-lg text-sm bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 flex items-center gap-2"
                          >
                            <UserCheck className="w-4 h-4" />
                            {t('Разбанить')}
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={!isAdmin || actionUserId === item.id}
                          className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('Удалить')}
                        </button>
                        {!isAdmin && (
                          <span className="text-xs text-gray-400">{t('Удаление доступно только админу')}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && !isLoading && (
                    <div className="p-6 text-gray-500">{t('Пользователи не найдены.')}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'services' && (
            <div
              id="admin-panel-services"
              role="tabpanel"
              aria-labelledby="admin-tab-services"
              className="p-6 space-y-8"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-5 h-5 text-primary" />
                  <h3>{t('Категории')}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <input
                    type="text"
                    value={categoryDraft}
                    onChange={(event) => setCategoryDraft(event.target.value)}
                    placeholder={t('Новая категория')}
                    aria-label={t('Новая категория')}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleCategoryCreate}
                    className="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-light flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    {t('Добавить')}
                  </button>
                </div>

                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex flex-wrap items-center gap-3 border border-gray-200 rounded-xl px-4 py-3"
                    >
                      <span className="text-sm text-gray-500">#{category.id}</span>
                      <input
                        type="text"
                        value={categoryEdits[category.id] ?? category.name}
                        onChange={(event) =>
                          setCategoryEdits((prev) => ({ ...prev, [category.id]: event.target.value }))
                        }
                        aria-label={t('Категории')}
                        className="flex-1 min-w-[220px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleCategoryUpdate(category.id)}
                        className="px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
                      >
                        {t('Переименовать')}
                      </button>
                      <button
                        onClick={() => handleCategoryDelete(category.id)}
                        className="px-3 py-2 rounded-lg text-sm border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FolderX className="w-4 h-4" />
                        {t('Удалить')}
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-gray-500">{t('Категории не найдены.')}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3>{t('Услуги')}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <input
                    type="text"
                    value={serviceQuery}
                    onChange={(event) => setServiceQuery(event.target.value)}
                    placeholder={t('Поиск по названию')}
                    aria-label={t('Поиск по названию')}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={serviceOwnerId}
                    onChange={(event) => setServiceOwnerId(event.target.value)}
                    placeholder="Owner ID"
                    aria-label="Owner ID"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-28"
                  />
                  <select
                    value={serviceCategoryId}
                    onChange={(event) => setServiceCategoryId(event.target.value)}
                    aria-label={t('Категория')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('Все категории')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={serviceType}
                    onChange={(event) => setServiceType(event.target.value as 'OFFER' | 'ORDER' | 'ALL')}
                    aria-label={t('Все типы')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">{t('Все типы')}</option>
                    <option value="OFFER">{t('Предложения')}</option>
                    <option value="ORDER">{t('Заказы')}</option>
                  </select>
                  <select
                    value={serviceStatus}
                    onChange={(event) => setServiceStatus(event.target.value as ServiceStatus | 'ALL')}
                    aria-label={t('Все статусы')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">{t('Все статусы')}</option>
                    <option value="ACTIVE">{t('Активные')}</option>
                    <option value="ARCHIVED">{t('Архив')}</option>
                  </select>
                  <input
                    type="text"
                    value={serviceMinPrice}
                    onChange={(event) => setServiceMinPrice(event.target.value)}
                    placeholder={t('Мин цена')}
                    aria-label={t('Мин цена')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-28"
                  />
                  <input
                    type="text"
                    value={serviceMaxPrice}
                    onChange={(event) => setServiceMaxPrice(event.target.value)}
                    placeholder={t('Макс цена')}
                    aria-label={t('Макс цена')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-28"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={serviceBarterOnly}
                      onChange={(event) => setServiceBarterOnly(event.target.checked)}
                      aria-label={t('Только бартер')}
                    />
                    {t('Только бартер')}
                  </label>
                  <input
                    type="datetime-local"
                    value={serviceCreatedAfter}
                    onChange={(event) => setServiceCreatedAfter(event.target.value)}
                    aria-label={t('Дата от')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="datetime-local"
                    value={serviceCreatedBefore}
                    onChange={(event) => setServiceCreatedBefore(event.target.value)}
                    aria-label={t('Дата до')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={loadServices}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                  >
                    {t('Найти')}
                  </button>
                </div>

                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col gap-3 border border-gray-200 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="mb-1">{service.title}</h4>
                          <p className="text-sm text-gray-500">{service.categoryName}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {t('ID: {id} · Владелец: {owner}', { id: service.id, owner: service.ownerEmail })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          service.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {service.status === 'ACTIVE' ? t('Активна') : t('Архив')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => handleServiceStatus(service.id, 'ACTIVE')}
                          disabled={actionServiceId === service.id}
                          className="px-3 py-2 rounded-lg text-sm border border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {t('Активировать')}
                        </button>
                        <button
                          onClick={() => handleServiceStatus(service.id, 'ARCHIVED')}
                          disabled={actionServiceId === service.id}
                          className="px-3 py-2 rounded-lg text-sm border border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                        >
                          {t('В архив')}
                        </button>
                        <button
                          onClick={() => handleServiceDelete(service.id)}
                          disabled={actionServiceId === service.id}
                          className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('Удалить')}
                        </button>
                      </div>
                    </div>
                  ))}

                  {services.length === 0 && (
                    <p className="text-sm text-gray-500">{t('Услуги не найдены.')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div
              id="admin-panel-reports"
              role="tabpanel"
              aria-labelledby="admin-tab-reports"
              className="p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3>{t('Жалобы')}</h3>
                  <p className="text-sm text-gray-500">{t('Всего: {count}', { count: reports.length })}</p>
                </div>
                <button
                  onClick={loadReports}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  {t('Обновить')}
                </button>
              </div>

              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-400">{t('Жалоба номер')}</span>
                        <div className="font-medium">#{report.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('Тип')}</span>
                        <div className="font-medium">{reportTypeLabel(report.type)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('Заголовок')}</span>
                        <div className="font-medium">{report.title}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('Описание')}</span>
                        <div className="font-medium">{report.description ?? '—'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-400">{t('От кого → на кого')}</span>
                        <div className="font-medium">
                          {report.reporterName?.trim() ||
                            formatReportUser(report.userId, reportUsersById)}{' '}
                          →{' '}
                          {report.reportedName?.trim() ||
                            formatReportUser(report.reportedUserId, reportUsersById)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="datetime-local"
                        value={reportBanInputs[report.id] ?? ''}
                        onChange={(event) =>
                          setReportBanInputs((prev) => ({ ...prev, [report.id]: event.target.value }))
                        }
                        aria-label={t('Укажите дату и время бана.')}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={async () => {
                          if (!token) {
                            return;
                          }
                          const value = reportBanInputs[report.id];
                          if (!value) {
                            setError(t('Укажите дату и время бана.'));
                            return;
                          }
                          try {
                            await updateUserBan(token, report.reportedUserId, {
                              bannedTill: new Date(value).toISOString(),
                            });
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : t('Не удалось забанить пользователя.');
                            setError(message);
                          }
                        }}
                        className="px-3 py-2 rounded-lg text-sm border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {t('Забанить нарушителя')}
                      </button>
                      <button
                        onClick={async () => {
                          if (!token) {
                            return;
                          }
                          const value = reportBanInputs[report.id];
                          if (!value) {
                            setError(t('Укажите дату и время бана.'));
                            return;
                          }
                          try {
                            await updateUserBan(token, report.userId, {
                              bannedTill: new Date(value).toISOString(),
                            });
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : t('Не удалось забанить пользователя.');
                            setError(message);
                          }
                        }}
                        className="px-3 py-2 rounded-lg text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        {t('Забанить автора')}
                      </button>
                    </div>
                  </div>
                ))}

                {reports.length === 0 && (
                  <div className="text-sm text-gray-500">{t('Жалоб нет.')}</div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'bugs' && (
            <div
              id="admin-panel-bugs"
              role="tabpanel"
              aria-labelledby="admin-tab-bugs"
              className="p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3>{t('Баг-репорты')}</h3>
                  <p className="text-sm text-gray-500">{t('Всего: {count}', { count: bugReports.length })}</p>
                </div>
                <button
                  onClick={loadBugReports}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  {t('Обновить')}
                </button>
              </div>

              <div className="space-y-3">
                {bugReports.map((report) => {
                  const reporter =
                    [report.userSurname, report.userName].filter(Boolean).join(' ').trim() ||
                    t('ID {id}', { id: report.userId });
                  return (
                    <div key={report.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                        <div>
                          <span className="text-gray-400">{t('Баг-репорт номер')}</span>
                          <div className="font-medium">#{report.id}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">{t('Дата')}</span>
                          <div className="font-medium">
                            {new Date(report.createdAt).toLocaleString(dateLocale)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">{t('Заголовок')}</span>
                          <div className="font-medium">{report.title}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">{t('Автор')}</span>
                          <div className="font-medium">{reporter}</div>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-400">{t('Описание')}</span>
                          <div className="font-medium">{report.description ?? '—'}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={async () => {
                            if (!token) {
                              return;
                            }
                            const confirmed = window.confirm(t('Удалить баг-репорт?'));
                            if (!confirmed) {
                              return;
                            }
                            try {
                              await deleteBugReport(token, report.id);
                              await loadBugReports();
                            } catch (err) {
                              const message =
                                err instanceof Error ? err.message : t('Не удалось удалить баг-репорт.');
                              setError(message);
                            }
                          }}
                          className="px-3 py-2 rounded-lg text-sm border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {t('Удалить')}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {bugReports.length === 0 && (
                  <div className="text-sm text-gray-500">{t('Баг-репортов нет.')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeUser(user: {
  id: number;
  email: string;
  role: RoleOption;
  bannedTill: string | null;
  profile?: {
    name?: string | null;
    surname?: string | null;
    middleName?: string | null;
  } | null;
}) {
  const nameParts = [user.profile?.surname, user.profile?.name, user.profile?.middleName].filter(Boolean);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    bannedTill: user.bannedTill,
    displayName: nameParts.length ? nameParts.join(' ') : user.email,
  };
}

function formatReportUser(
  userId: number,
  usersById: Record<number, { email: string; profile?: { name?: string | null; surname?: string | null } | null }>,
) {
  const user = usersById[userId];
  const name = [user?.profile?.surname, user?.profile?.name].filter(Boolean).join(' ').trim();
  return name || user?.email || `ID ${userId}`;
}
