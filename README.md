# FORM / FACTOR

Одностраничный интерактивный 3D-обзор телефона. Шесть экранов, анимация появления текста и движение модели при прокрутке.

## Технологии

React, TypeScript, Vite, Three.js, React Three Fiber.

## 3D-модель

Модель расположена в `public/phone.glb` и загружается в `src/PhoneScene.tsx`. Перед использованием на коммерческом сайте проверьте лицензию исходной модели из Blendkit и права на товарные знаки.

## Запуск

```bash
npm install
npm run dev
```

Для сборки: `npm run build`. Для тестов: `npm run test:e2e`.

Предыдущая версия проекта находится в ветке `backup-kontaktium-before-phone`.
