export const YANDEX_CLIENT_ID =
  import.meta.env.VITE_YA_CLIENT_ID ?? 'deb6ba32a6754b02b2ffae87948f9826';

export const getYandexRedirectUri = () => {
  if (import.meta.env.VITE_YA_REDIRECT_URI) {
    return import.meta.env.VITE_YA_REDIRECT_URI;
  }

  if (typeof window === 'undefined') {
    return 'https://oauth.yandex.ru/verification_code';
  }

  return `${window.location.origin}/ya-token-helper.html`;
};
