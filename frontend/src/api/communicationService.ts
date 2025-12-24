import { COMMUNICATION_API_BASE_URL } from './config';
import { requestJson } from './http';

export interface ChatSummary {
  response_id: number;
  service_id: number;
  service_title: string;
  sender_id: number;
  owner_id: number;
  response_created_at: string;
  last_message_id: number | null;
  last_message_at: string | null;
  last_message_text: string | null;
}

export interface MessageDto {
  id: number;
  response_id: number;
  sender_id: number;
  receiver_id: number;
  text?: string;
  image_base64?: string;
  created_at: string;
}

export interface CreateMessageRequest {
  text?: string;
  image_base64?: string;
}

const withAuth = (token: string | null | undefined) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;

export const getChatsWhereUserIsSender = async (token: string | null | undefined) =>
  requestJson<ChatSummary[]>(`${COMMUNICATION_API_BASE_URL}/responses/chats/sent`, {
    headers: withAuth(token),
  });

export const getChatsWhereUserIsOwner = async (token: string | null | undefined) =>
  requestJson<ChatSummary[]>(`${COMMUNICATION_API_BASE_URL}/responses/chats/owned`, {
    headers: withAuth(token),
  });

export const getMessages = async (
  token: string | null | undefined,
  responseId: number,
  params: { after_id?: number; limit?: number } = {},
) => {
  const search = new URLSearchParams();
  if (params.after_id) search.set('after_id', String(params.after_id));
  if (params.limit) search.set('limit', String(params.limit));
  const suffix = search.toString() ? `?${search.toString()}` : '';

  return requestJson<MessageDto[]>(
    `${COMMUNICATION_API_BASE_URL}/responses/${responseId}/messages${suffix}`,
    {
      headers: withAuth(token),
    },
  );
};

export const sendMessage = async (
  token: string | null | undefined,
  responseId: number,
  payload: CreateMessageRequest,
) =>
  requestJson<MessageDto>(`${COMMUNICATION_API_BASE_URL}/responses/${responseId}/messages`, {
    method: 'POST',
    headers: withAuth(token),
    body: payload,
  });

export const makeCommWebSocket = (token: string | null | undefined) => {
  const url = new URL(`${COMMUNICATION_API_BASE_URL}/ws`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (token) {
    url.searchParams.set('auth', token);
  }
  // Browser WebSocket cannot set custom headers; token travels as query for gateway to reuse if needed.
  return new WebSocket(url.toString());
};
