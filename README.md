# AI Medical Adapter

Медицинский AI-адаптер для интеграции с Google Gemini API.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` в корне проекта:
```bash
cp .env.example .env
```

3. Добавьте ваш Gemini API ключ в `.env`:
```env
GEMINI_API_KEY=AIzaSyCTUVcmdYeuD3PoJr_XO1sERE4qnY82fTk
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

- `GEMINI_API_KEY` - API ключ Google Gemini (обязательно)
- `GEMINI_BASE_URL` - Базовый URL Gemini API (по умолчанию: https://generativelanguage.googleapis.com/v1beta)
- `GEMINI_MODEL` - Модель для использования (по умолчанию: gemini-1.5-flash)
- `PORT` - Порт сервера (по умолчанию: 3001)

## Troubleshooting

### Ошибка "GEMINI_API_KEY is not set"

1. Убедитесь, что файл `.env` существует в корне проекта
2. Проверьте, что в `.env` есть строка `GEMINI_API_KEY=your-key`
3. Убедитесь, что `dotenv` установлен: `npm install dotenv`
4. Перезапустите сервер после изменения `.env`
