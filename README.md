# MiAgendaApp — Gestión de Agenda y Recordatorios

**Autor:** César Roberto Carlos  
**Plataforma:** React Native (Expo SDK 58 — Modo Gestionado)

Aplicación móvil orientada a la gestión integral de tareas, agenda personal y programación de recordatorios con integración nativa de hardware del dispositivo, notificaciones locales interactivas, selector de ubicación en mapa, sincronización con calendario nativo y gestión de estado global con Zustand.

---

## Tabla de Contenidos

1. [Arquitectura y Estructura del Proyecto](#1-arquitectura-y-estructura-del-proyecto)
2. [Funcionalidades Principales](#2-funcionalidades-principales)
   - [Autenticación y Navegación Declarativa (`useAuthStore`)](#21-autenticación-y-navegación-declarativa-useauthstore)
   - [Gestión de Recordatorios y Filtros (`useReminderStore` + `useReminders`)](#22-gestión-de-recordatorios-y-filtros-usereminderstore--usereminders)
   - [Manejo Seguro y Unificado de Permisos](#23-manejo-seguro-y-unificado-de-permisos)
   - [Cámara y Galería de Imágenes](#24-cámara-y-galería-de-imágenes)
   - [Ubicación GPS y Mapa Interactivo Optimizado](#25-ubicación-gps-y-mapa-interactivo-optimizado)
   - [Integración con Contactos del Dispositivo](#26-integración-con-contactos-del-dispositivo)
   - [Sincronización con Calendario Nativo](#27-sincronización-con-calendario-nativo)
   - [Notificaciones Locales y Ciclo de Vida](#28-notificaciones-locales-y-ciclo-de-vida)
   - [Suite de Pruebas Automatizadas (Testing)](#29-suite-de-pruebas-automatizadas-testing)
3. [Stack Tecnológico y Dependencias](#3-stack-tecnológico-y-dependencias)
4. [Instalación y Ejecución](#4-instalación-y-ejecución)
   - [Requisitos Previos](#41-requisitos-previos)
   - [Instalación de Dependencias](#42-instalación-de-dependencias)
   - [Iniciar la Aplicación](#43-iniciar-la-aplicación)
   - [Verificación de Tipos y Pruebas Unitarias](#44-verificación-de-tipos-y-pruebas-unitarias)
5. [Demostración en Video](#5-demostración-en-video)

---

## 1. Arquitectura y Estructura del Proyecto

El proyecto sigue una arquitectura modular con separación estricta entre **estado global (Zustand)**, **orquestación de dominio y hardware (`hooks/`)**, **persistencia (`services/`)**, **componentes presentacionales (`components/`)** y **navegación declarativa (`navigation/`)**:

```text
MiAgendaApp/
├── App.tsx                                 # Punto de entrada: hidrata sesión y listeners de notificaciones
├── app.json                                # Configuración de Expo y permisos declarados
├── src/
│   ├── types.ts                            # Entidades canónicas (Reminder, RootStackParamList)
│   ├── navigation/
│   │   └── RootNavigator.tsx               # Stack declarativo según estado de sesión en useAuthStore
│   ├── store/
│   │   ├── useAuthStore.ts                 # Estado global de autenticación e hidratación
│   │   └── useReminderStore.ts             # Estado global de recordatorios y filtros de agenda
│   ├── screens/
│   │   ├── LoginScreen.tsx                 # Inicio de sesión conectado a useAuthStore
│   │   ├── RegisterScreen.tsx              # Registro de usuarios conectado a useAuthStore
│   │   ├── HomeScreen.tsx                  # Agenda diaria/próxima con filtros globales
│   │   └── CreateScreen.tsx                # Formulario modal de creación/edición de recordatorios
│   ├── components/
│   │   ├── ui/                             # Átomos reutilizables puros
│   │   │   ├── AttachmentCard.tsx          # Tarjeta unificada para foto, ubicación y contacto
│   │   │   ├── CustomButton.tsx            # Botón con variantes e íconos
│   │   │   ├── CustomInput.tsx             # Input reutilizable con soporte de contraseña y multiline
│   │   │   └── DateTimeField.tsx           # Selector de fecha/hora unificado (Android/iOS)
│   │   ├── auth/
│   │   │   └── AuthBrandHeader.tsx         # Encabezado visual de Login/Registro
│   │   ├── reminders/
│   │   │   ├── CategorySelector.tsx        # Selector visual de categorías
│   │   │   ├── ImagePreviewModal.tsx       # Modal de vista previa de imagen adjunta
│   │   │   └── ReminderCard.tsx            # Tarjeta 100% presentacional de recordatorio
│   │   └── modals/
│   │       ├── ContactPickerModal.tsx      # Selector con búsqueda en agenda del dispositivo
│   │       ├── MapLocationPickerModal.tsx  # Selector en mapa Leaflet/OpenStreetMap vía WebView
│   │       └── NotificationModals.tsx      # Modales de antelación predefinida y personalizada
│   ├── hooks/
│   │   ├── useReminders.ts                 # Orquestador de CRUD, notificaciones y calendario nativo
│   │   ├── useCamera.ts                    # Acceso a cámara y galería
│   │   ├── useLocation.ts                  # GPS y geocodificación inversa
│   │   ├── useDeviceContacts.ts            # Lectura y normalización de contactos
│   │   ├── useDeviceCalendar.ts            # Creación/edición/eliminación en calendario nativo
│   │   └── useLocalNotifications.ts        # Notificaciones locales, canales Android, acciones y badges
│   ├── services/
│   │   ├── authStorage.ts                  # Persistencia de usuarios con hash y validación de tipos
│   │   └── reminderStorage.ts              # Persistencia de recordatorios aislada por usuario
│   ├── utils/
│   │   ├── dateHelpers.ts                  # Formateo, cálculos de lead time y fechas ISO/timestamp
│   │   └── permissionHelpers.ts            # requestPermissionSafely y showPermissionAlert
│   ├── constants/
│   │   ├── categories.ts                   # Configuración de categorías e íconos
│   │   └── theme.ts                        # Tokens de colores y radios
│   └── __tests__/                          # Suite completa de tests unitarios (Jest)
```

---

## 2. Funcionalidades Principales

### 2.1. Autenticación y Navegación Declarativa (`useAuthStore`)
- **Ubicación:** `src/store/useAuthStore.ts`, `src/navigation/RootNavigator.tsx`
- **Características:**
  - Elimina por completo el *prop drilling* de `username` por rutas y las navegaciones imperativas (`navigation.replace`).
  - `hydrateSession()` restaura la sesión al iniciar la app desde `@react-native-async-storage/async-storage`.
  - `RootNavigator` conmuta automáticamente entre el stack público (`Login`, `Register`) y el stack autenticado (`Home`, `Create`) al cambiar `user` en el store.
  - `logout()` limpia la sesión persistida y resetea inmediatamente la memoria de `useReminderStore`.
  - Validación de contraseñas hasheadas en `authStorage.ts` con type guards sobre los datos leídos del almacenamiento.

### 2.2. Gestión de Recordatorios y Filtros (`useReminderStore` + `useReminders`)
- **Ubicación:** `src/store/useReminderStore.ts`, `src/hooks/useReminders.ts`
- **Características:**
  - El store mantiene tanto la lista de `reminders` como los filtros activos (`selectedDate`, `isFilterActive`).
  - `saveReminder` y `updateReminder` retornan directamente la lista filtrada y ordenada del usuario activo, evitando lecturas dobles de disco en `AsyncStorage`.
  - `useReminders` centraliza toda la lógica de dominio: `saveOrUpdateReminder`, `toggleComplete`, `confirmAndDelete` y `cancelUserNotifications`.
  - Los componentes visuales como `ReminderCard` son **100% presentacionales** y no ejecutan efectos secundarios destructivos antes de la confirmación del usuario.

### 2.3. Manejo Seguro y Unificado de Permisos
- **Ubicación:** `src/utils/permissionHelpers.ts`
- **Características:**
  - `requestPermissionSafely`: Escucha `AppState` para evitar que en Android tocar fuera del diálogo nativo deje la promesa de permiso en estado *pending* indefinidamente.
  - `showPermissionAlert`: Unifica la gestión de alertas cuando un permiso es denegado o bloqueado permanentemente (`canAskAgain === false`), ofreciendo acceso directo a los ajustes del sistema mediante `Linking.openSettings()`.

### 2.4. Cámara y Galería de Imágenes
- **Ubicación:** `src/hooks/useCamera.ts`, `src/components/reminders/ImagePreviewModal.tsx`
- **Librería:** `expo-image-picker`
- **Características:**
  - Captura con cámara nativa o selección desde galería con relación de aspecto `4:3` y compresión al `70%` (`quality: 0.7`).
  - Previsualización modal a pantalla completa y soporte de reemplazo/eliminación vía `AttachmentCard`.

### 2.5. Ubicación GPS y Mapa Interactivo Optimizado
- **Ubicación:** `src/hooks/useLocation.ts`, `src/components/modals/MapLocationPickerModal.tsx`
- **Librerías:** `expo-location`, `react-native-webview`
- **Características:**
  - Prioriza la última ubicación conocida en caché (`getLastKnownPositionAsync`) para respuesta instantánea con fallback a `getCurrentPositionAsync({ accuracy: Accuracy.Balanced })` y geocodificación inversa (`reverseGeocodeAsync`).
  - Mapa interactivo embebido con Leaflet + OpenStreetMap sin recargas del `WebView`: el HTML inicial se memoriza con `useMemo` y los cambios de posición GPS se ejecutan mediante `injectJavaScript` (`window.setCenter`), validando los mensajes recibidos con type guards.

### 2.6. Integración con Contactos del Dispositivo
- **Ubicación:** `src/hooks/useDeviceContacts.ts`, `src/components/modals/ContactPickerModal.tsx`
- **Librería:** `expo-contacts`
- **Características:**
  - Lectura y normalización alfabética de contactos (nombre, teléfono, email) con filtro en tiempo real.
  - Acceso directo a llamadas (`tel:`) desde el chip del contacto en `ReminderCard`.

### 2.7. Sincronización con Calendario Nativo
- **Ubicación:** `src/hooks/useDeviceCalendar.ts`
- **Librería:** `expo-calendar`
- **Características:**
  - Sincroniza creación, actualización y eliminación de eventos en el calendario editable del dispositivo almacenando `calendarEventId` en el recordatorio.
  - Al eliminar un recordatorio, la supresión del evento nativo ocurre exclusivamente después de confirmar el diálogo de borrado en `useReminders.confirmAndDelete`.

### 2.8. Notificaciones Locales y Ciclo de Vida
- **Ubicación:** `src/hooks/useLocalNotifications.ts`, `App.tsx`
- **Librería:** `expo-notifications`
- **Características:**
  - Los listeners, categorías interactivas (`✔ Completar tarea`) y handler se inicializan dentro del ciclo de vida de React mediante `setupNotificationListeners()` en `App.tsx`, limpiando las suscripciones al desmontar.
  - Actualización automática del contador de badge según tareas pendientes y tipado estricto en respuestas de notificación.

### 2.9. Suite de Pruebas Automatizadas (Testing)
- **Framework:** Jest, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`
- **Cobertura:** **11 suites de pruebas** alineadas a la arquitectura final:
  1. `authValidation.test.ts`: Validaciones de registro y hashing de contraseñas.
  2. `timeCalculations.test.ts`: Cálculos de *lead time*, fechas ISO y reconstrucción por `targetTimestamp`.
  3. `CustomButton.test.tsx`: Renderizado e interacción de `components/ui/CustomButton`.
  4. `ReminderCard.test.tsx`: Renderizado presentacional, chips de ubicación/contacto, badges y delegación de eventos.
  5. `useAuthStore.test.ts`: Hidratación de sesión, login, registro y logout con limpieza de stores.
  6. `useReminderStore.test.ts`: CRUD optimizado en Zustand, filtros de fecha y reseteo de estado.
  7. `useReminders.test.ts`: Orquestación completa (`saveOrUpdateReminder`, `toggleComplete`, `confirmAndDelete` con calendario nativo y notificaciones).
  8. `useLocation.test.ts`: Permisos GPS y geocodificación inversa.
  9. `useContacts.test.ts`: Consulta y formateo de contactos nativos.
  10. `useCalendar.test.ts`: Permisos, selección de calendario y eventos nativos.
  11. `useLocalNotifications.test.ts`: Canales Android, acciones rápidas, badges y ciclo de vida con `setupNotificationListeners`.

---

## 3. Stack Tecnológico y Dependencias

| Componente | Paquete / Herramienta | Versión |
| :--- | :--- | :--- |
| **Framework Base** | Expo SDK | ^58.0.0 |
| **Núcleo Móvil** | React Native | 0.88.1 |
| **Librería React** | React | 19.3.0 |
| **Lenguaje** | TypeScript (`strict: true`) | ~6.0.3 |
| **Navegación** | React Navigation (Native Stack) | ^7.20.0 |
| **Gestión de Estado** | Zustand | ^5.0.16 |
| **Persistencia Local** | @react-native-async-storage/async-storage | 2.2.0 |
| **Cámara y Fotos** | expo-image-picker | ~58.0.10 |
| **Ubicación y GPS** | expo-location | ~58.0.20 |
| **Contactos** | expo-contacts | ~58.0.10 |
| **Calendario** | expo-calendar | ~58.0.6 |
| **Notificaciones** | expo-notifications | ~58.1.8 |
| **Mapas Web** | react-native-webview (Leaflet / OpenStreetMap) | 14.0.1 |
| **Test Runner** | Jest & jest-expo | ~30.5.2 / ~58.0.14 |
| **Testing UI** | @testing-library/react-native | ^13.3.0 |

---

## 4. Instalación y Ejecución

### 4.1. Requisitos Previos
- **Node.js:** Versión 18 o 20 LTS.
- **Dispositivo físico o emulador:**
  - Dispositivo físico Android o iOS con **Expo Go** o Development Build (`npx expo run:android` / `npx expo run:ios` para calendario nativo completo).

### 4.2. Instalación de Dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd MiAgendaApp
npm install --legacy-peer-deps
```

### 4.3. Iniciar la Aplicación
```bash
npx expo start
```
o mediante npm:
```bash
npm start
```

### 4.4. Verificación de Tipos y Pruebas Unitarias
Verificar tipado estricto de TypeScript:
```bash
npx tsc --noEmit
```

Ejecutar la suite completa de pruebas unitarias:
```bash
npm test
```

Ejecutar una suite específica:
```bash
npm test useAuthStore.test.ts
npm test useReminders.test.ts
```

---

## 5. Demostración en Video

- **Link del video 1:** [Ver Video en Google Drive](https://drive.google.com/file/d/1EgHf4M5Eu4Z5BwpAjh9GvGz3TfM9AnkE/view?usp=drive_link)

- **Link del video 2:** [Ver Video en Google Drive](https://drive.google.com/file/d/10edCzQvEG3rfk38Hidt7GGWbl4M_2aFg/view?usp=drive_link)