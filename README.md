# Aplicaciones Móviles: Agenda y Recordatorios

**Alumno:** César Roberto Carlos

Una aplicación móvil desarrollada en React Native y Expo orientada a la gestión de tareas, agenda y programación de recordatorios locales.

## Funcionalidades Principales

- **Autenticación Local:** Sistema de Registro y Login persistente utilizando `AsyncStorage`. Incluye validación de campos obligatorios, coincidencia de claves y longitud mínima de contraseña (6 caracteres).
- **Gestión de Recordatorios (CRUD):** Creación de nuevas tareas con título, fecha, hora y nivel de antelación para la alerta. Visualización en lista, marcado de tareas completadas y eliminación.
- **Filtros por Fecha:** Calendario interactivo integrado en la cabecera (Header) para filtrar y visualizar únicamente las tareas correspondientes al día seleccionado.
- **Notificaciones Push Locales:** Integración nativa con `expo-notifications` para programar alertas automáticas previas a los eventos (ej. 5, 15 o 30 minutos antes).
- **Testing:** Suite de pruebas unitarias implementada con Jest y React Native Testing Library (RNTL) cubriendo renderizado de componentes y lógica de negocio.

## Tecnologías Utilizadas

- React Native / Expo (SDK 57)
- React Navigation (Native Stack)
- AsyncStorage
- Expo Notifications
- Jest & React Native Testing Library

## Instalación y Ejecución

1. Clonar el repositorio en tu máquina local.
2. Abrir una terminal en la carpeta del proyecto e instalar las dependencias:
   ```bash
   npm install --legacy-peer-deps
   ```

## Iniciar el servidor de desarrollo de Expo

````bash
npx expo start
**Escanear el código QR resultante con la aplicación Expo Go en un dispositivo físico Android/iOS o presionar a para abrir en un emulador Android.

## Ejecución de Pruebas Unitarias
```bash
npm test
````

## Link del video

https://drive.google.com/file/d/1EgHf4M5Eu4Z5BwpAjh9GvGz3TfM9AnkE/view?usp=drive_link
