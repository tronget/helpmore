export interface YandexAuthSuggestConfig {
  client_id: string;
  response_type: 'token';
  redirect_uri: string;
}

export interface YandexAuthSuggestHandler {
  handler: () => Promise<YandexAuthResponse>;
}

export interface YandexAuthResponse {
  access_token?: string;
  token?: string;
  expires_in?: number;
  default_email?: string;
  default_phone?: string;
  default_user_first_name?: string;
  default_user_last_name?: string;
  default_user_middle_name?: string;
  default_user_avatar_id?: string;
  [key: string]: unknown;
}

export interface YandexAuthSuggest {
  init: (
    config: YandexAuthSuggestConfig,
    origin: string,
    options?: Record<string, unknown>
  ) => Promise<YandexAuthSuggestHandler>;
}

export type YandexSendToken = (origin: string, options?: Record<string, unknown>) => void;

declare global {
  interface Window {
    YaAuthSuggest?: YandexAuthSuggest;
    YaSendSuggestToken?: YandexSendToken;
  }
}

export {};
