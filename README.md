# AI Medical Adapter

Медицинский AI-адаптер для интеграции с OpenAI API.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` в корне проекта:
```bash
cp .env.example .env
```

3. Добавьте ваш OpenAI API ключ в `.env`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

## Использование

### Запуск в режиме разработки:
```bash
npm run dev
```

Сервер запустится на `http://localhost:3001`

### Сборка:
```bash
npm run build
npm start
```

## API Endpoints

- `POST /api/chat` - Отправка сообщения в чат
- `POST /api/finish-chat` - Завершение чата и получение диагноза

## Переменные окружения

- `OPENAI_API_KEY` - API ключ OpenAI (обязательно)
- `OPENAI_BASE_URL` - Базовый URL OpenAI API (по умолчанию: https://api.openai.com/v1)
- `OPENAI_MODEL` - Модель для использования (по умолчанию: gpt-4o-mini)
- `PORT` - Порт сервера (по умолчанию: 3001)

## Troubleshooting

### Ошибка "OPENAI_API_KEY is not set"

1. Убедитесь, что файл `.env` существует в корне проекта
2. Проверьте, что в `.env` есть строка `OPENAI_API_KEY=your-key`
3. Убедитесь, что `dotenv` установлен: `npm install dotenv`
4. Перезапустите сервер после изменения `.env`
