# ManagementService REST API

Документ описывает все публичные REST-эндпоинты сервиса, формат запросов/ответов и ключевые валидации. Базовый префикс всех путей — `/api`. Все тела передаются и возвращаются в JSON. Времена (`createdAt`, `timestamp`) сериализуются как ISO-8601 UTC строки (например, `2025-05-01T12:00:00Z`).

## Формат ошибок
- Код ответа: `400` — ошибка валидации/логики, `404` — не найдено, `409` — конфликт, `500` — внутренняя ошибка.
- Тело:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Only owner can update the service",
  "timestamp": "2025-05-01T12:00:00Z"
}
```

## Пагинация
Эндпоинты, возвращающие `Page<T>`, принимают стандартные параметры Spring Data: `page` (0-based), `size`, `sort=field,asc|desc`. Ответ содержит `content` (список DTO) и служебные поля (`totalElements`, `totalPages`, `number`, `size`, `first`, `last`, `sort` и т.д.).

## Справочники
- `ServiceType`: `OFFER`, `ORDER`.
- `ServiceStatus`: `ACTIVE`, `ARCHIVED`.
- `ResponseStatus`: `ACTIVE`, `ARCHIVED`.
- Оценка сервиса: `rate` от `1` до `5`.

## Категории
**DTO:** `CategoryDto { id, name }`  
**Запрос:** `CategoryRequest { name }` (`name` обязательное, не пустое, ≤255 символов).

- `GET /api/categories` — список категорий.  
  - Ответ: `CategoryDto[]`.
- `POST /api/categories` — создать категорию.  
  - Тело: `CategoryRequest`.  
  - Ошибки: `409`, если имя уже существует.
- `PUT /api/categories/{id}` — переименовать.  
  - Тело: `CategoryRequest`.  
  - Ошибки: `404`, если не найдено; `409`, если новое имя занято.
- `DELETE /api/categories/{id}` — удалить категорию.  
  - Ошибки: `404`, если не найдено.

## Сервисы
**DTO:** `ServiceDto { id, ownerId, ownerEmail, categoryId, categoryName, title, description, type, status, price, barter, place, createdAt }`  
`type` — `ServiceType`, `status` — `ServiceStatus`, `price` — decimal, `barter` — `true/false`, `place` опционально (≤255).

- `POST /api/services` — создать сервис.  
  - Тело: `CreateServiceRequest { ownerId, categoryId, title (обяз., не пустой, ≤255), description (обяз., не пустое, ≤5000), type, price ≥0, barter, place? }`.  
  - Ошибки: `404`, если `ownerId` или `categoryId` не найдены.
  - Ответ: `ServiceDto` со статусом `ACTIVE`.
- `PUT /api/services/{serviceId}` — частичное обновление полей.  
  - Тело: `UpdateServiceRequest { requesterId, categoryId?, title?, description?, price?, barter?, place? }`.  
  - Ошибки: `400`, если `requesterId` не владелец; `404` при отсутствии сервиса или новой категории.
  - Ответ: обновленный `ServiceDto`.
- `GET /api/services/{serviceId}` — получить по id.  
  - Ошибки: `404`, если не найдено.
- `POST /api/services/search` — поиск с фильтрами и пагинацией.  
  - Тело: `ServiceSearchRequest { ownerId?, categoryId?, type?, status?, titleLike?, minPrice?, maxPrice?, barterOnly?, createdAfter?, createdBefore? }`.  
  - Параметры запроса: `page/size/sort`.  
  - Ответ: `Page<ServiceDto>`.
- `DELETE /api/services/{serviceId}?requesterId=...` — удалить сервис.  
  - Ошибки: `400`, если удаляет не владелец; `404`, если не найдено.
  - Ответ: пустое тело (статус 200/204).
- `PATCH /api/services/{serviceId}/status` — смена статуса.  
  - Тело: `ChangeServiceStatusRequest { requesterId, status }`.  
  - Ошибки: `400`, если не владелец; `404`, если сервис не найден.
  - Ответ: обновленный `ServiceDto`.

## Отклики на сервис (responses)
**DTO:** `ResponseDto { id, serviceId, senderId, status, createdAt }`  
`status` — `ResponseStatus`.

- `GET /api/services/{serviceId}/responses` — список откликов на сервис (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<ResponseDto>`.
- `GET /api/services/{serviceId}/responses/active` — только активные отклики (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<ResponseDto>`.
- `GET /api/services/{serviceId}/responses/archived` — только архивные отклики (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<ResponseDto>`.
- `GET /api/users/{userId}/responses` — все отклики, где пользователь выступает автором отклика или владельцем сервиса (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<ResponseDto>`.
- `GET /api/users/{userId}/responses/active` — только активные отклики пользователя (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<ResponseDto>`.
- `GET /api/users/{userId}/responses/archived` — только архивные отклики пользователя (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<ResponseDto>`.
- `POST /api/services/{serviceId}/responses` — откликнуться на сервис.  
  - Тело: `CreateResponseRequest { senderId }` (`senderId` обязательное).  
  - Ошибки: `400`, если владелец откликается сам; `404`, если сервис или пользователь не найден; `409`, если отклик от этого пользователя уже есть.  
  - Ответ: созданный `ResponseDto`.
- `PATCH /api/services/{serviceId}/responses/{responseId}/status` — архивировать отклик.  
  - Тело: `ChangeResponseStatusRequest { requesterId, status }` (`status` должен быть `ARCHIVED`).  
  - Ошибки: `400`, если нет прав, статус не `ARCHIVED` или отклик уже архивирован; `404`, если отклик не найден.  
  - Ответ: обновленный `ResponseDto`.
- `DELETE /api/services/{serviceId}/responses/{responseId}?requesterId=...` — удалить отклик.  
  - Разрешено автору отклика или владельцу сервиса, только если отклик в статусе `ACTIVE`.  
  - Ошибки: `400`, если нет прав или статус не `ACTIVE`; `404`, если отклик не найден.

## Отзывы о сервисе (feedback)
**DTO:** `FeedbackDto { id, serviceId, senderId, rate, review, createdAt }` (`review` ≤5000).  
**Запросы:**  
- `CreateFeedbackRequest { senderId, rate 1..5 (обяз.), review? }`  
- `UpdateFeedbackRequest { senderId, rate 1..5 (обяз.), review? }`

- `GET /api/services/{serviceId}/feedback` — список отзывов (Page).  
  - Параметры пагинации `page/size/sort`.  
  - Ответ: `Page<FeedbackDto>`.
- `POST /api/services/{serviceId}/feedback` — оставить отзыв.  
  - Ошибки: `400`, если владелец оценивает сам; `404`, если сервис или пользователь не найден; `409`, если отзыв от пользователя уже есть.
  - Ответ: созданный `FeedbackDto`.
- `PUT /api/services/{serviceId}/feedback/{feedbackId}` — обновить отзыв.  
  - Тело: `UpdateFeedbackRequest`.  
  - Ошибки: `400`, если `senderId` не автор; `404`, если отзыв не найден.
  - Ответ: обновленный `FeedbackDto`.
- `DELETE /api/services/{serviceId}/feedback/{feedbackId}?requesterId=...` — удалить отзыв.  
  - Разрешено автору или владельцу сервиса.  
  - Ошибки: `400`, если нет прав; `404`, если не найден.

## Избранное
**DTO:** `FavoriteDto { userId, service: ServiceDto, createdAt }`  
Идентификатор пользователя передается в заголовке `X-User-Id`.

- `GET /api/favorites` — избранные сервисы пользователя.  
  - Заголовок: `X-User-Id`. Параметры пагинации.  
  - Ответ: `Page<FavoriteDto>`.
- `POST /api/services/{serviceId}/favorites` — добавить сервис в избранное.  
  - Заголовок: `X-User-Id`.  
  - Ошибки: `404`, если сервис или пользователь не найден; `409`, если уже в избранном.
  - Ответ: созданный `FavoriteDto`.
- `DELETE /api/services/{serviceId}/favorites` — убрать из избранного.  
  - Заголовок: `X-User-Id`.  
  - Ошибки: `404`, если пары пользователь/сервис нет в избранном.
  - Ответ: пустое тело (статус 200/204).
