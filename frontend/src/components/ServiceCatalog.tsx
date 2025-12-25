import { useEffect, useMemo, useState } from 'react';
import { Star, MapPin } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useUsersById } from '../hooks/useUsersById';
import { searchServices, type ServiceDto } from '../api/marketplaceService';
import { useAuthStore } from '../store/authStore';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { LoadingIndicator } from './LoadingIndicator';
import { useI18n } from '../i18n/useI18n';

interface ServiceCatalogProps {
  searchQuery: string;
  selectedCategory: string;
  onNavigateToService: (serviceId: string) => void;
  onResetFilters: () => void;
}

export function ServiceCatalog({ searchQuery, selectedCategory, onNavigateToService, onResetFilters }: ServiceCatalogProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [barterOnly, setBarterOnly] = useState(false);
  const { categories } = useCategories();
  const { token } = useAuthStore();
  const { t, locale } = useI18n();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryId = useMemo(() => {
    if (selectedCategory) {
      return categories.find((category) => category.name === selectedCategory)?.id;
    }
    if (selectedCategoryFilter !== 'all') {
      return categories.find((category) => category.name === selectedCategoryFilter)?.id;
    }
    return undefined;
  }, [categories, selectedCategory, selectedCategoryFilter]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const minPrice = Number.parseFloat(minPriceFilter.replace(',', '.'));
        const maxPrice = Number.parseFloat(maxPriceFilter.replace(',', '.'));

        const response = await searchServices({
          type: 'OFFER',
          titleLike: searchQuery || undefined,
          categoryId,
          minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
          maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
          barterOnly: barterOnly ? true : undefined,
        });
        if (!active) {
          return;
        }
        setServices(response.content);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : t('Не удалось загрузить услуги');
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
  }, [
    barterOnly,
    categoryId,
    maxPriceFilter,
    minPriceFilter,
    searchQuery,
  ]);

  const ownerIds = useMemo(() => services.map((service) => service.ownerId), [services]);
  const { users: ownersById } = useUsersById(ownerIds, token);

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

  const serviceCards = services.map((service) => {
    const owner = ownersById[service.ownerId];
    const ownerName =
      [owner?.profile?.surname, owner?.profile?.name]
        .filter(Boolean)
        .join(' ')
        .trim() || owner?.email || t('Пользователь');
    const ownerAvatar = owner?.profile?.avatar
      ? `data:image/png;base64,${owner.profile.avatar}`
      : null;
    const rate = owner?.profile?.rate ?? 0;
    return {
      ...service,
      ownerName,
      ownerAvatar,
      rate,
    };
  });

  return (
    <div className="flex gap-8">
          {/* Filters Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-[180px]">
          <h3 className="mb-4">{t('Фильтры')}</h3>
          
          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm mb-2 text-gray-700">{t('Категория')}</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              aria-label={t('Категория')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('Все категории')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div className="mb-6">
            <label className="block text-sm mb-2 text-gray-700">{t('Цена')}</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={minPriceFilter}
                onChange={(event) => setMinPriceFilter(event.target.value)}
                placeholder={t('Мин')}
                aria-label={t('Мин цена')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={maxPriceFilter}
                onChange={(event) => setMaxPriceFilter(event.target.value)}
                placeholder={t('Макс')}
                aria-label={t('Макс цена')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Barter Filter */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={barterOnly}
                onChange={(event) => setBarterOnly(event.target.checked)}
                aria-label={t('Только бартер')}
              />
              {t('Только бартер')}
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setSelectedCategoryFilter('all');
              setMinPriceFilter('');
              setMaxPriceFilter('');
              setBarterOnly(false);
              onResetFilters();
            }}
            className="w-full px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary-lighter transition-colors"
          >
            {t('Сбросить фильтры')}
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="flex-1">
        <div className="mb-4">
          <p className="text-gray-600">{t('Найдено услуг: {count}', { count: serviceCards.length })}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-6" aria-busy={isLoading}>
          {serviceCards.map((service) => (
            <div
              key={service.id}
              role="button"
              tabIndex={0}
              onClick={() => onNavigateToService(String(service.id))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onNavigateToService(String(service.id));
                }
              }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group text-left"
            >
              {/* Content */}
              <div className="p-5">
                {/* Category Badge */}
                <div className="inline-block px-3 py-1 bg-primary-lighter text-primary rounded-lg text-sm mb-3">
                  {service.categoryName}
                </div>

                {/* Title */}
                <h4 className="mb-2 line-clamp-2">{service.title}</h4>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                {/* Author */}
                <div className="flex items-center gap-2 mb-4">
                  {service.ownerAvatar ? (
                    <img
                      src={service.ownerAvatar}
                      alt={service.ownerName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarPlaceholder className="w-8 h-8" iconClassName="w-4 h-4" />
                  )}
                  <span className="text-sm text-gray-700">{service.ownerName}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{service.rate || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{service.place?.split('/')?.[0]?.trim() || t('Онлайн')}</span>
                  </div>
                  <span className="text-primary">{formatPrice(service.price, service.barter)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <LoadingIndicator label={t('Загружаем услуги...')} />
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-16">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!isLoading && !error && serviceCards.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">{t('Услуги не найдены')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
