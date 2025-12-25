import { MessageCircle } from 'lucide-react';
import logo from 'figma:asset/6ee6e9716cea49265cf2002d25a60b45f5d06fb7.png';
import { useAuthStore } from '../store/authStore';
import { AvatarPlaceholder } from './AvatarPlaceholder';
import { useI18n } from '../i18n/useI18n';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import type { Locale } from '../i18n/translations';

interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateChat: (chatId?: string, state?: { counterpartName?: string; serviceTitle?: string }) => void;
  onNavigateAdmin: () => void;
}

export function Header({ onNavigateHome, onNavigateProfile, onNavigateChat, onNavigateAdmin }: HeaderProps) {
  const { user } = useAuthStore();
  const { t, locale, setLocale, locales, localeFlagsMap, localeLabelsMap } = useI18n();
  const displayName =
    [user?.profile?.surname, user?.profile?.name, user?.profile?.middleName]
      .filter(Boolean)
      .join(' ')
      .trim() || user?.email || t('Пользователь');
  const avatarSrc = user?.profile?.avatar
    ? `data:image/png;base64,${user.profile.avatar}`
    : null;
  const hasAvatar = Boolean(avatarSrc);
  const canManage = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50" style={{ height: '72px' }}>
      <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center gap-8">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="ITMO Services" className="w-10 h-10" />
            <span className="text-gray-900">{t('Главная')}</span>
          </button>

          {canManage && (
            <button
              onClick={onNavigateAdmin}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('Панель управления')}
            </button>
          )}

        </div>

        {/* Right side - User info */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onNavigateChat}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            aria-label={t('Чаты')}
          >
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button 
            onClick={onNavigateProfile}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            {hasAvatar ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <AvatarPlaceholder className="w-10 h-10" iconClassName="w-5 h-5" />
            )}
            <span className="text-gray-900">{displayName}</span>
          </button>

          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger
              className="w-[148px] justify-between hover:bg-gray-50"
              aria-label={t('Язык')}
            >
              <span className="text-xl">{localeFlagsMap[locale]}</span>
              <span className="text-sm text-gray-900">{localeLabelsMap[locale]}</span>
            </SelectTrigger>
            <SelectContent align="end">
              {locales.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  <span className="text-xl">{localeFlagsMap[loc]}</span>
                  <span>{localeLabelsMap[loc]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
