# pochta-russia-mcp

MCP-сервер для API Почты России — отслеживание, расчёт тарифов, сроки доставки, поиск отделений, индексы, нормализация адресов.

## Возможности (6 инструментов)

| Инструмент | Описание |
|---|---|
| `track` | Отслеживание отправления по трек-номеру |
| `calculate` | Расчёт стоимости и сроков доставки |
| `delivery_time` | Расчёт сроков доставки между индексами |
| `get_offices` | Поиск почтовых отделений |
| `zip_lookup` | Информация по почтовому индексу |
| `normalize_address` | Нормализация адреса через API |

## Быстрый старт

### Stdio (по умолчанию)

```json
{
  "mcpServers": {
    "pochta": {
      "command": "npx",
      "args": ["-y", "@theyahia/pochta-russia-mcp"],
      "env": {
        "POCHTA_TOKEN": "<YOUR_ACCESS_TOKEN>",
        "POCHTA_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

### Streamable HTTP

```bash
npx @theyahia/pochta-russia-mcp --http --port=3000
```

MCP endpoint: `http://localhost:3000/mcp`
Health check: `http://localhost:3000/health`

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `POCHTA_TOKEN` | Да | Access-токен для X-User-Authorization |
| `POCHTA_KEY` | Да | API-ключ (Authorization header) |

### Обратная совместимость

Также поддерживаются legacy-переменные:

| Переменная | Описание |
|---|---|
| `POCHTA_LOGIN` | Логин от API (формирует Basic auth) |
| `POCHTA_PASSWORD` | Пароль от API |
| `POCHTA_TOKEN` | Access-токен |

Получите ключи: [Кабинет отправителя](https://otpravka.pochta.ru/) -> Настройки -> API.

## Авторизация

Сервер использует двойную авторизацию Почты России:
- `Authorization`: API-ключ (POCHTA_KEY) или Basic auth (из POCHTA_LOGIN/PASSWORD)
- `X-User-Authorization: accessToken <POCHTA_TOKEN>`

Отслеживание использует SOAP API трекинга Почты России (login/password).

## Skills (Claude Code)

| Команда | Описание |
|---|---|
| `/track <номер>` | Отследить посылку Почты России |
| `/calculate <от> <до> <вес>` | Расчёт стоимости отправления |
| `/parcel <от> <до> <вес>` | Полный расчёт с ближайшим отделением |

## Тесты

```bash
npm test
```

## Лицензия

MIT
