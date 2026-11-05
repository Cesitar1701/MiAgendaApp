# Directivas del Proyecto: MiAgendaApp

## Stack Tecnológico y Entorno
- Plataforma: Expo SDK 57 (~57.0.26) en modo gestionado.
- Núcleo: React Native 0.86.3, React 19.2.3, TypeScript en modo estricto.
- Navegación: React Navigation v7.
- Persistencia y Sesión: @react-native-async-storage/async-storage.
- Estado Global Obligatorio: Zustand (reemplazando useState/prop drilling en lista principal y sesión).
- Hardware y Recursos del Dispositivo:
  - Cámara y Galería: expo-image-picker.
  - Notificaciones: expo-notifications.
  - Selectores: @react-native-community/datetimepicker.
  - Ubicación (GPS): expo-location (coordenadas o dirección asociada al recordatorio).
  - Contactos: expo-contacts (seleccionar contacto vinculado al recordatorio).
  - Calendario Nativo: expo-calendar (sincronizar evento en el calendario del teléfono).
- Testing: Jest, jest-expo, @testing-library/react-native.

## Arquitectura y Estándares
1. **Estado Global con Zustand:**
   - Crear los stores en `src/store/` (ej: `useReminderStore.ts`, `useAuthStore.ts`).
   - El store debe manejar las acciones de agregar, editar, eliminar y cargar recordatorios.
   - Las pantallas deben consumir selectores y hooks del store, eliminando el prop drilling.
2. **Manejo Obligatorio de Permisos:**
   - Utilizar siempre `requestPermissionSafely` (`src/utils/permissionHelpers.ts`) antes de invocar cámara, galería, ubicación, contactos o calendario.
   - Gestionar explícitamente los 3 estados: concedido, denegado y pendiente, mostrando alertas claras si es rechazado.
3. **Entidad Recordatorio (Reminder):**
   - Actualizar `src/types.ts` para soportar: foto adjunta (`imageUri`), ubicación (`location`), contacto asociado (`contact`) y sincronización con calendario (`calendarEventId`).
4. **Testing Automatizado:**
   - Mantener las suites existentes y asegurar que las nuevas acciones del store o helpers pasen los tests con Jest.