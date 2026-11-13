# Directivas del Proyecto: MiAgendaApp

## Stack Tecnológico y Entorno
- Plataforma: Expo SDK 58 (^58.0.0) en modo gestionado.
- Núcleo: React Native 0.88.1, React 19.3.0, TypeScript en modo estricto (`strict: true`).
- Navegación: React Navigation v7 (navegación declarativa basada en estado de sesión).
- Persistencia y Sesión: `@react-native-async-storage/async-storage`.
- Estado Global Obligatorio: Zustand (`useAuthStore.ts` y `useReminderStore.ts`).
- Hardware y Recursos del Dispositivo:
  - Cámara y Galería: `expo-image-picker`.
  - Notificaciones: `expo-notifications`.
  - Selectores: `@react-native-community/datetimepicker`.
  - Ubicación (GPS): `expo-location` (coordenadas y dirección asociada al recordatorio).
  - Contactos: `expo-contacts` (seleccionar contacto vinculado al recordatorio).
  - Calendario Nativo: `expo-calendar` (sincronizar evento en el calendario del teléfono).
- Testing: Jest, `jest-expo`, `@testing-library/react-native`.

## Estructura de Carpetas
- `src/navigation/`: Navegadores raíz y stacks declarativos (`RootNavigator.tsx`).
- `src/store/`: Stores globales de Zustand (`useAuthStore.ts`, `useReminderStore.ts`).
- `src/screens/`: Pantallas principales (`LoginScreen`, `RegisterScreen`, `HomeScreen`, `CreateScreen`).
- `src/components/`:
  - `ui/`: Componentes atómicos reutilizables (`CustomButton`, `CustomInput`, `AttachmentCard`, `DateTimeField`).
  - `auth/`: Componentes visuales de autenticación (`AuthBrandHeader`).
  - `reminders/`: Componentes de dominio de recordatorios (`ReminderCard`, `CategorySelector`, `ImagePreviewModal`).
  - `modals/`: Modales especializados (`ContactPickerModal`, `MapLocationPickerModal`, `NotificationModals`).
- `src/hooks/`: Hooks de hardware (`useCamera`, `useLocation`, `useDeviceContacts`, `useDeviceCalendar`, `useLocalNotifications`) y orquestador de dominio (`useReminders`).
- `src/services/`: Capa de persistencia en `AsyncStorage` (`authStorage.ts`, `reminderStorage.ts`).
- `src/utils/`: Helpers de fechas (`dateHelpers.ts`) y permisos (`permissionHelpers.ts`).
- `src/constants/`: Paleta de colores, radios y categorías (`theme.ts`, `categories.ts`).

## Reglas Estrictas de Arquitectura
1. **Estado Global con Zustand (Cero prop-drilling):**
   - `useAuthStore` es la única fuente de verdad de la sesión (`user`, `isHydrated`, `loading`, `hydrateSession`, `login`, `register`, `logout`).
   - `useReminderStore` gestiona los recordatorios y el estado de filtrado de agenda (`selectedDate`, `isFilterActive`).
   - Prohibido pasar `username` por parámetros de navegación (`RootStackParamList`).
2. **Manejo Obligatorio de Permisos:**
   - Utilizar siempre `requestPermissionSafely` y `showPermissionAlert` (`src/utils/permissionHelpers.ts`) antes de invocar cámara, galería, ubicación, contactos o calendario.
   - Gestionar explícitamente los estados concedido, denegado y bloqueado (`canAskAgain === false` con acceso directo a Ajustes).
3. **Entidad Recordatorio (`Reminder`) Canónica:**
   - `src/types.ts` exige `isoDate: string` (`YYYY-MM-DD`) y `targetTimestamp: number` como fuente de verdad temporal, junto a `imageUri`, `location`, `contact` y `calendarEventId`.
4. **Componentes Presentacionales Puros:**
   - Ningún componente visual (como `ReminderCard`) debe invocar hooks de hardware ni ejecutar efectos secundarios destructivos antes de la confirmación del usuario; toda orquestación vive en `useReminders`.
5. **Tipado Estricto Real:**
   - Prohibido el uso de `as any` o `@ts-ignore`. Todo `JSON.parse` debe validarse mediante type guards.
6. **Clean-Slate (Sin deuda legacy):**
   - No mantener fallbacks para contraseñas en texto plano ni parseos regex de fechas heredadas.
7. **Testing Automatizado:**
   - Mantener todas las suites en verde (`npx tsc --noEmit` y `npx jest`) tras cada cambio arquitectónico.
