# pochta-russia-mcp

MCP-сервер для API Почты России — отслеживание, расчёт тарифов, поиск отделений.

## Возможности (3 инструмента)

| Инструмент | Описание |
|---|---|
| `track` | Отслеживание отправления по трек-номеру |
| `calculate` | Расчёт стоимости и сроков доставки |
| `get_offices` | Поиск почтовых отделений |

## Быстрый старт

```json
{
  "mcpServers": {
    "pochta": {
      "command": "npx",
      "args": ["-y", "@theyahia/pochta-russia-mcp"],
      "env": {
        "POCHTA_LOGIN": "<YOUR_LOGIN>",
        "POCHTA_PASSWORD": "<YOUR_PASSWORD>",
        "POCHTA_TOKEN": "<YOUR_ACCESS_TOKEN>"
      }
    }
  }
}
```

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `POCHTA_LOGIN` | Да | Логин от API Почты России |
| `POCHTA_PASSWORD` | Да | Пароль от API Почты России |
| `POCHTA_TOKEN` | Да | Access-токен для X-User-Authorization |

Получите ключи: [Кабинет отправителя](https://otpravka.pochta.ru/) -> Настройки -> API.

## Авторизация

Сервер использует двойную авторизацию:
- `Authorization: Basic base64(login:password)`
- `X-User-Authorization: accessToken <token>`

Отслеживание использует SOAP API трекинга Почты России.

## Лицензия

MIT
