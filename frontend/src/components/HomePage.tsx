import { useState } from 'react';
import { Search, Plus, CircleHelp } from 'lucide-react';
import { ServiceCatalog } from './ServiceCatalog';
import { OrderCatalog } from './OrderCatalog';
import { CreateServiceModal } from './CreateServiceModal';
import { CreateOrderModal } from './CreateOrderModal';
import { useI18n } from '../i18n/useI18n';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface HomePageProps {
  onNavigateToService: (serviceId: string) => void;
  onNavigateToOrder: (orderId: string) => void;
}

type Tab = 'services' | 'orders';

export function HomePage({ onNavigateToService, onNavigateToOrder }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const { t } = useI18n();

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery);
  };

  const handleResetFilters = () => {
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
            <div className="flex gap-3">
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

          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-40">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-6 relative transition-colors flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{t('Предложения')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="w-4 h-4 opacity-70" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t(
                    'Предложения — те услуги, которые предлагают пользователи. Например, вы хотите найти репетитора или грузчика, ищите такие услуги именно здесь.',
                  )}
                </TooltipContent>
              </Tooltip>
              {activeTab === 'services' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-6 relative transition-colors flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{t('Заказы')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="w-4 h-4 opacity-70" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t(
                    'Заказы — те услуги, которые можно оказать. Сюда вы заходите, когда хотите подзаработать. Ну как доска объявлений в ведьмаке, смотрите заказы и решаете, какой хотите выполнить.',
                  )}
                </TooltipContent>
              </Tooltip>
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
            selectedCategory={''}
            onNavigateToService={onNavigateToService}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <OrderCatalog 
            searchQuery={appliedSearchQuery}
            selectedCategory={''}
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
