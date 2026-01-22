# User Management Microservice API

Исчерпывающее описание REST‑эндпоинтов сервиса. Формат ответов — JSON. Все URL относительно корня приложения.


## Аутентификация и авторизация
- Для всех маршрутов, кроме `/auth/**`, требуются заголовки `X-Auth-Email` и `X-Auth-Role`. Сервис не читает `Authorization: Bearer ...` и не валидирует Yandex OAuth токен на каждом запросе — эти заголовки обычно проставляет gateway.
- Роли: `user`, `moderator`, `admin`. Методная авторизация настроена через Spring Security, но проверки ролей для `/reports/**` используют роль из БД, а не из заголовка.
- Неавторизованные запросы дают `401`, недостаток прав — `403`. При отсутствии глобальных хэндлеров некоторые ошибки валятся как `500` (например, отсутствие пользователя).

## Форматы моделей
- `UserResponse`:  
  `{"id": int, "email": string, "role": "user|moderator|admin", "bannedTill": string|null, "createdAt": string, "profile": UserProfileResponse|null}`
- `UserProfileResponse`:  
  `{"name": string, "surname": string, "middleName": string|null, "avatar": "base64-string"|null, "faculty": string|null, "phoneNumber": string|null, "telegram": string|null, "rate": number}`
- `UserMeResponse`:  
  `{"id": int, "email": string, "role": "user|moderator|admin", "name": string|null, "surname": string|null, "phoneNumber": string|null, "telegram": string|null, "rate": number|null}`
- `UserRoleUpdateRequest`: `{"role": "user|moderator|admin"}`
- `UserProfileRequest`: `{"name": string!, "surname": string!, "middleName": string|null, "avatar": "base64-string"|null, "faculty": string|null, "phoneNumber": string|null, "telegram": string|null}` (name/surname обязательны; max длины: 120/120/120/160/32/64)
- `UserBanRequest`: `{"bannedTill": string|null}` (ISO-8601, OffsetDateTime; `null` — снять бан)
- `YandexTokenRequest`: `{"token": "yandex-oauth-token"}` (обязателен)
- `ReportCreateRequest`: `{"reportedUserId": int, "type": "spam|fraud|insult|illegal|other", "title": string, "description": string|null}` (`title` до 255, `description` до 2048)
- `ReportUpdateRequest`: `{"type": "spam|fraud|insult|illegal|other"|null, "title": string|null, "description": string|null}` (обновляет только переданные поля)
- `ReportResponse`: `{"id": int, "reporterId": int, "reporterName": string|null, "reporterSurname": string|null, "reportedUserId": int, "reportedUserName": string|null, "reportedUserSurname": string|null, "type": "spam|fraud|insult|illegal|other", "title": string, "description": string|null, "createdAt": string}`
- `BugReportCreateRequest`: `{"title": string, "description": string|null}` (`title` до 255, `description` до 2048)
- `BugReportUpdateRequest`: `{"title": string|null, "description": string|null}` (обновляет только переданные поля)
- `BugReportResponse`: `{"id": int, "userId": int, "userName": string|null, "userSurname": string|null, "title": string, "description": string|null, "createdAt": string}`

## Эндпоинты

### POST /auth/yandex
Логин через Yandex OAuth. Создаёт пользователя при первом заходе.
- Тело: `YandexTokenRequest`
- Успех: `200 OK`, тело `"OK"`
- Ошибки: `400` если у профиля Yandex нет email; `403` если пользователь забанен (сообщение `User is banned until <ts>`); 4xx от Yandex проксируются как есть; 5xx от Yandex превращаются в `500`.

### GET /users
Список всех пользователей.
- Требуются роли `admin` или `moderator`
- Успех: `200 OK`, тело `UserResponse[]`

### GET /users/{id}
Получение пользователя по идентификатору.
- Требуется аутентификация
- Успех: `200 OK`, тело `UserResponse`
- Ошибки: при отсутствии пользователя выбрасывается `EntityNotFoundException` (текущий ответ — `500`)

### GET /users/me
Текущий пользователь по заголовкам аутентификации.
- Требуется аутентификация
- Успех: `200 OK`, тело `UserMeResponse`

### PATCH /users/{id}/role
Изменение роли пользователя.
- Требуется роль `admin`
- Тело: `UserRoleUpdateRequest`
- Успех: `200 OK`, тело `UserResponse`
- Ошибки: если пользователь не найден — `500` (см. выше)

### PATCH /users/{id}/profile
Обновление профиля пользователя (имя, фамилия обязательны).
- Требуется аутентификация
- Тело: `UserProfileRequest`
- Успех: `200 OK`, тело `UserResponse` (профиль создаётся, если его ещё нет)
- Примечание: проверка владельца профиля отсутствует — любой аутентифицированный пользователь может обновить профиль по `id`

### PATCH /users/{id}/ban
Бан или разбан пользователя.
- Требуются роли `admin` или `moderator`
- Тело: `UserBanRequest` (`bannedTill: null` снимает бан; при бане токен пользователя сбрасывается в `"Banned"`)
- Успех: `200 OK`, тело `UserResponse`

### DELETE /users/{id}
Удаление пользователя и его профиля.
- Требуется роль `admin`
- Успех: `204 No Content`
- Ошибки: отсутствие пользователя — `500` (нет хэндлера)

### POST /reports
Создание жалобы на пользователя.
- Требуется аутентификация
- Тело: `ReportCreateRequest`
- Успех: `201 Created`, тело `ReportResponse`
- Ошибки: `500` если пользователь не найден (EntityNotFoundException); `401` если неавторизован

### GET /reports/me
Список жалоб, созданных текущим пользователем.
- Требуется аутентификация
- Успех: `200 OK`, тело `ReportResponse[]`
- Пагинации нет, возвращается весь список

### GET /reports
Список всех жалоб (для модерации).
- Требуются роли `admin` или `moderator`
- Успех: `200 OK`, тело `ReportResponse[]`
- Пагинации нет, возвращается весь список

### PATCH /reports/{id}
Редактирование жалобы.
- Требуется аутентификация (редактировать может автор жалобы или `admin`/`moderator`)
- Тело: `ReportUpdateRequest`
- Успех: `200 OK`, тело `ReportResponse`
- Ошибки: `500` если жалоба не найдена (EntityNotFoundException); `403` если нет прав

### DELETE /reports/{id}
Удаление жалобы.
- Требуется аутентификация (удалить может автор жалобы или `admin`/`moderator`)
- Успех: `204 No Content`
- Ошибки: `500` если жалоба не найдена (EntityNotFoundException); `403` если нет прав

### POST /bug-reports
Создание баг-репорта.
- Требуется аутентификация
- Тело: `BugReportCreateRequest`
- Успех: `201 Created`, тело `BugReportResponse`

### PATCH /bug-reports/{id}
Редактирование баг-репорта.
- Требуется аутентификация (редактировать может только автор)
- Тело: `BugReportUpdateRequest`
- Успех: `200 OK`, тело `BugReportResponse`
- Ошибки: `500` если баг-репорт не найден (EntityNotFoundException); `403` если нет прав

### DELETE /bug-reports/{id}
Удаление баг-репорта.
- Требуется аутентификация (удалить может только автор)
- Успех: `204 No Content`
- Ошибки: `500` если баг-репорт не найден (EntityNotFoundException); `403` если нет прав

### GET /bug-reports
Список всех баг-репортов.
- Требуется аутентификация
- Успех: `200 OK`, тело `BugReportResponse[]`

### GET /bug-reports/me
Список баг-репортов текущего пользователя.
- Требуется аутентификация
- Успех: `200 OK`, тело `BugReportResponse[]`

## Примеры запросов
```bash
# Логин через Yandex OAuth
curl -X POST http://localhost:8282/auth/yandex \
  -H "Content-Type: application/json" \
  -d '{"token":"<yandex-oauth-token>"}'

# Получить пользователей (нужны X-Auth-Email и X-Auth-Role: admin/moderator)
curl http://localhost:8282/users \
  -H "X-Auth-Email: user@example.com" \
  -H "X-Auth-Role: admin"
```
