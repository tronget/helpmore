import { requestJson } from './http';
import { MARKETPLACE_API_BASE_URL } from './config';

export type ServiceType = 'OFFER' | 'ORDER';
export type ServiceStatus = 'ACTIVE' | 'ARCHIVED';

export interface CategoryDto {
  id: number;
  name: string;
}

export interface CategoryRequest {
  name: string;
}

export interface ServiceDto {
  id: number;
  ownerId: number;
  ownerEmail: string;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string;
  type: ServiceType;
  status: ServiceStatus;
  price: number;
  barter: boolean;
  place?: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ServiceSearchRequest {
  ownerId?: number;
  categoryId?: number;
  type?: ServiceType;
  status?: ServiceStatus;
  titleLike?: string;
  minPrice?: number;
  maxPrice?: number;
  barterOnly?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface CreateServiceRequest {
  ownerId: number;
  categoryId: number;
  title: string;
  description: string;
  type: ServiceType;
  price: number;
  barter: boolean;
  place?: string;
}

export interface UpdateServiceRequest {
  requesterId: number;
  categoryId?: number;
  title?: string;
  description?: string;
  price?: number;
  barter?: boolean;
  place?: string;
}

export interface FeedbackDto {
  id: number;
  serviceId: number;
  senderId: number;
  rate: number;
  review: string | null;
  createdAt: string;
}

export interface CreateFeedbackRequest {
  senderId: number;
  rate: number;
  review?: string | null;
}

export interface ResponseDto {
  id: number;
  serviceId: number;
  senderId: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  comment: string | null;
  createdAt: string;
}

export interface CreateResponseRequest {
  senderId: number;
}

export interface FavoriteDto {
  userId: number;
  service: ServiceDto;
  createdAt: string;
}

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return '';
  }
  const query = new URLSearchParams();
  entries.forEach(([key, value]) => query.set(key, String(value)));
  return `?${query.toString()}`;
};

export const getCategories = async () =>
  requestJson<CategoryDto[]>(`${MARKETPLACE_API_BASE_URL}/categories`);

export const createCategory = async (payload: CategoryRequest) =>
  requestJson<CategoryDto>(`${MARKETPLACE_API_BASE_URL}/categories`, {
    method: 'POST',
    body: payload,
  });

export const updateCategory = async (categoryId: number, payload: CategoryRequest) =>
  requestJson<CategoryDto>(`${MARKETPLACE_API_BASE_URL}/categories/${categoryId}`, {
    method: 'PUT',
    body: payload,
  });

export const deleteCategory = async (categoryId: number) =>
  requestJson<void>(`${MARKETPLACE_API_BASE_URL}/categories/${categoryId}`, {
    method: 'DELETE',
  });

export const searchServices = async (
  request: ServiceSearchRequest,
  options: { page?: number; size?: number; sort?: string } = {},
) => {
  const hasFilters = Object.values(request).some((value) => value !== undefined);
  const normalizedRequest = hasFilters ? request : { titleLike: '' };
  const query = buildQuery({
    page: options.page ?? 0,
    size: options.size ?? 50,
    sort: options.sort,
  });
  return requestJson<PageResponse<ServiceDto>>(
    `${MARKETPLACE_API_BASE_URL}/services/search${query}`,
    {
      method: 'POST',
      body: normalizedRequest,
    },
  );
};

export const getService = async (serviceId: number) =>
  requestJson<ServiceDto>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}`);

export const createService = async (payload: CreateServiceRequest) =>
  requestJson<ServiceDto>(`${MARKETPLACE_API_BASE_URL}/services`, {
    method: 'POST',
    body: payload,
  });

export const updateService = async (serviceId: number, payload: UpdateServiceRequest) =>
  requestJson<ServiceDto>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}`, {
    method: 'PUT',
    body: payload,
  });

export const changeServiceStatus = async (
  serviceId: number,
  payload: { requesterId: number; status: ServiceStatus },
) =>
  requestJson<ServiceDto>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}/status`, {
    method: 'PATCH',
    body: payload,
  });

export const deleteService = async (serviceId: number, requesterId: number) =>
  requestJson<void>(
    `${MARKETPLACE_API_BASE_URL}/services/${serviceId}?requesterId=${requesterId}`,
    {
      method: 'DELETE',
    },
  );

export const getServiceFeedback = async (serviceId: number) =>
  requestJson<PageResponse<FeedbackDto>>(
    `${MARKETPLACE_API_BASE_URL}/services/${serviceId}/feedback?size=50`,
  );

export const createFeedback = async (serviceId: number, payload: CreateFeedbackRequest) =>
  requestJson<FeedbackDto>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}/feedback`, {
    method: 'POST',
    body: payload,
  });

export const createResponse = async (serviceId: number, payload: CreateResponseRequest) =>
  requestJson<ResponseDto>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}/responses`, {
    method: 'POST',
    body: payload,
  });

export const getUserResponses = async (userId: number) =>
  requestJson<PageResponse<ResponseDto>>(
    `${MARKETPLACE_API_BASE_URL}/users/${userId}/responses?size=100`,
  );

export const getUserResponsesArchived = async (userId: number) =>
  requestJson<PageResponse<ResponseDto>>(
    `${MARKETPLACE_API_BASE_URL}/users/${userId}/responses/archived?size=100`,
  );

export const deleteResponse = async (
  serviceId: number,
  responseId: number,
  requesterId: number,
) =>
  requestJson<void>(
    `${MARKETPLACE_API_BASE_URL}/services/${serviceId}/responses/${responseId}?requesterId=${requesterId}`,
    { method: 'DELETE' },
  );

export const archiveResponse = async (
  serviceId: number,
  responseId: number,
  requesterId: number,
) =>
  requestJson<ResponseDto>(
    `${MARKETPLACE_API_BASE_URL}/services/${serviceId}/responses/${responseId}/status`,
    {
      method: 'PATCH',
      body: {
        requesterId,
        status: 'ARCHIVED',
      },
    },
  );

export const getFavorites = async (userId: number) =>
  requestJson<PageResponse<FavoriteDto>>(`${MARKETPLACE_API_BASE_URL}/favorites?size=50`, {
    headers: {
      'X-User-Id': String(userId),
    },
  });

export const addFavorite = async (userId: number, serviceId: number) =>
  requestJson<FavoriteDto>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}/favorites`, {
    method: 'POST',
    headers: {
      'X-User-Id': String(userId),
    },
  });

export const removeFavorite = async (userId: number, serviceId: number) =>
  requestJson<void>(`${MARKETPLACE_API_BASE_URL}/services/${serviceId}/favorites`, {
    method: 'DELETE',
    headers: {
      'X-User-Id': String(userId),
    },
  });
