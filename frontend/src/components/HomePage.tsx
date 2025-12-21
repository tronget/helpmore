import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { getCategoryIcon } from '../utils/categoryIcons';
import { ServiceCatalog } from './ServiceCatalog';
import { OrderCatalog } from './OrderCatalog';
import { CreateServiceModal } from './CreateServiceModal';
import { CreateOrderModal } from './CreateOrderModal';
import { useI18n } from '../i18n/useI18n';

interface HomePageProps {
  onNavigateToService: (serviceId: string) => void;
  onNavigateToOrder: (orderId: string) => void;
}

type Tab = 'services' | 'orders';

export function HomePage({ onNavigateToService, onNavigateToOrder }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const { categories, error: categoriesError } = useCategories();
  const { t } = useI18n();

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery);
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setAppliedSearchQuery('');
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setAppliedSearchQuery('');
    setSearchQuery('');
  };

  return (
    <div className="pt-[72px]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-lighter to-white py-16">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="max-w-[1000px] mx-auto">
            <h1 className="text-center mb-8">{t('Найдите услуги и помощь от студентов ИТМО')}</h1>
            
            {/* Search Bar */}
            <div className="flex gap-3 mb-12">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t('Поиск услуг и специалистов...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="w-full px-6 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button 
                onClick={handleSearch}
                className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                {t('Найти')}
              </button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`px-6 py-3 bg-white rounded-xl border transition-all flex items-center gap-2 ${
                    selectedCategory === category.name
                      ? 'border-primary bg-primary-lighter'
                      : 'border-gray-200 hover:border-primary hover:bg-primary-lighter'
                  }`}
                >
                  <span className="text-gray-900">{category.name}</span>
                </button>
              ))}
              {categories.length === 0 && categoriesError && (
                <p className="text-sm text-red-500">{t('Не удалось загрузить категории')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-40">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-6 relative transition-colors ${
                activeTab === 'services'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Предложения')}
              {activeTab === 'services' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-6 relative transition-colors ${
                activeTab === 'orders'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Заказы')}
              {activeTab === 'orders' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Create Button */}
        <div className="flex justify-end mb-6">
          {activeTab === 'services' ? (
            <button
              onClick={() => setShowCreateServiceModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('Создать предложение')}
            </button>
          ) : (
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('Создать заказ')}
            </button>
          )}
        </div>

        {/* Catalog */}
        {activeTab === 'services' ? (
          <ServiceCatalog 
            searchQuery={appliedSearchQuery}
            selectedCategory={selectedCategory}
            onNavigateToService={onNavigateToService}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <OrderCatalog 
            searchQuery={appliedSearchQuery}
            selectedCategory={selectedCategory}
            onNavigateToOrder={onNavigateToOrder}
            onResetFilters={handleResetFilters}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateServiceModal && (
        <CreateServiceModal onClose={() => setShowCreateServiceModal(false)} />
      )}
      {showCreateOrderModal && (
        <CreateOrderModal onClose={() => setShowCreateOrderModal(false)} />
      )}
    </div>
  );
}
