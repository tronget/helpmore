import axios, { type AxiosError } from 'axios';

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export const requestJson = async <T>(
  input: string,
  init: RequestInit = {},
): Promise<T> => {
  const headers: Record<string, string> = {};
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers as Record<string, string>);
    }
  }

  if (init.body && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await axios.request<T>({
      url: input,
      method: (init.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      headers,
      data: init.body,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.data as T;
    }

    const payload = response.data;
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: string }).message)
        : response.statusText || 'Request failed';
    throw new ApiError(message, response.status, payload);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<unknown>;
      const status = axiosError.response?.status ?? 0;
      const payload = axiosError.response?.data;
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: string }).message)
          : axiosError.message || 'Request failed';
      throw new ApiError(message, status, payload);
    }
    throw err;
  }
};
