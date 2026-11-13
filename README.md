# Aplicaciones Móviles: Agenda y Recordatorios

**Alumno:** César Roberto Carlos  
**Plataforma:** React Native (Expo SDK 58 - Modo Gestionado)

Aplicación móvil orientada a la gestión integral de tareas, agenda personal y programación de recordatorios con integración de hardware del dispositivo, notificaciones push locales y sincronización con el calendario nativo.

---

## Tabla de Contenidos

1. [Visión General y Nuevas Funcionalidades](#1-visión-general-y-nuevas-funcionalidades)
   - [Manejo Seguro de Permisos](#11-manejo-seguro-de-permisos)
   - [Cámara y Galería de Imágenes](#12-cámara-y-galería-de-imágenes)
   - [Ubicación GPS y Selector en Mapa](#13-ubicación-gps-y-selector-en-mapa)
   - [Integración con Contactos del Dispositivo](#14-integración-con-contactos-del-dispositivo)
   - [Sincronización con Calendario Nativo](#15-sincronización-con-calendario-nativo)
   - [Estado Global con Zustand](#16-estado-global-con-zustand)
   - [Suite de Pruebas Automatizadas (Testing)](#17-suite-de-pruebas-automatizadas-testing)
2. [Stack Tecnológico y Dependencias](#2-stack-tecnológico-y-dependencias)
3. [Instalación y Ejecución](#3-instalación-y-ejecución)
   - [Requisitos Previos](#31-requisitos-previos)
   - [Instalación de Dependencias](#32-instalación-de-dependencias)
   - [Iniciar la Aplicación](#33-iniciar-la-aplicación)
   - [Ejecutar las Pruebas Unitarias](#34-ejecutar-las-pruebas-unitarias)
4. [Documentación de Prompts Utilizados](#4-documentación-de-prompts-utilizados)
5. [Comparativa de Código (Antes vs. Después)](#5-comparativa-de-código-antes-vs-después)
   - [1. Estado Local vs. Zustand Store](#51-gestión-de-estado-usestate-vs-zustand-store)
   - [2. Solicitud Naive vs. Permisos Seguros con AppState](#52-manejo-de-permisos-solicitud-convencional-vs-requestpermissionsafely)
   - [3. Modelo de Recordatorio Básico vs. Enriquecido](#53-modelo-de-datos-recordatorio-simple-vs-multisensorial)
   - [4. Renderizado de Tarjeta: Básica vs. Con Accesorios Multimedia](#54-componente-remindercard-visualización-plana-vs-interactiva)
6. [Demostración en Video](#6-demostración-en-video)

---

## 1. Visión General y Nuevas Funcionalidades

La aplicación ha evolucionado desde una libreta de notas simple hacia un gestor de productividad multisensorial que interactúa activamente con el hardware del teléfono inteligente.

### 1.1. Manejo Seguro de Permisos
- **Ubicación:** `src/utils/permissionHelpers.ts`
- **Problema abordado:** En sistemas Android, cuando el usuario toca fuera del diálogo nativo del sistema para pedir permisos, el modal se descarta pero la promesa subyacente puede quedar en estado *pending* indefinidamente, bloqueando la interfaz de usuario.
- **Solución implementada (`requestPermissionSafely`):** Implementa un listener activo sobre `AppState.addEventListener('change')`. Cuando la aplicación vuelve al estado `active` luego de la interacción con el sistema operativo, se ejecuta una verificación fallback con la función `getPermissionsAsync()`.
- **Flujo de 3 estados:**
  1. **Granted (Concedido):** Acceso inmediato a la funcionalidad de hardware.
  2. **Denied temporalmente:** Se informa al usuario mediante alerta del motivo por el cual es necesario el permiso.
  3. **Blocked / CanAskAgain = false:** Se despliega un diálogo con acceso directo a la configuración de la app a través de `Linking.openSettings()`.

### 1.2. Cámara y Galería de Imágenes
- **Ubicación:** `src/hooks/useCamera.ts`, `src/components/ImagePreviewModal.tsx`
- **Librería:** `expo-image-picker`
- **Características:**
  - Permite capturar fotografías al instante con la cámara nativa o elegir imágenes existentes de la galería multimedia.
  - Recorte y compresión optimizada en relación de aspecto 4:3 y calidad visual del 70% (`quality: 0.7`) para minimizar el uso de memoria en almacenamiento persistente.
  - Previsualización a pantalla completa en modal con soporte para eliminar o reemplazar la imagen antes y después de guardar el recordatorio.
  - Almacenamiento seguro del identificador URI dentro del modelo `Reminder.imageUri`.

### 1.3. Ubicación GPS y Selector en Mapa
- **Ubicación:** `src/hooks/useLocation.ts`, `src/components/MapLocationPickerModal.tsx`
- **Librerías:** `expo-location`, `react-native-webview`
- **Características:**
  - **Detección GPS en tiempo real:** Obtiene latitud y longitud actuales del dispositivo mediante `getCurrentPositionAsync({ accuracy: LocationAccuracy.Balanced })`.
  - **Geocodificación Inversa (Reverse Geocoding):** Convierte las coordenadas cartográficas en una dirección legible para el usuario (calle, número de puerta, localidad y código postal) utilizando `reverseGeocodeAsync`.
  - **Selector Interactivo en Mapa (Leaflet / OpenStreetMap):** Interfaz modal con mapa interactivo web embebido donde el usuario puede tocar cualquier punto del mapa, reposicionar el marcador y confirmar la ubicación exacta sin depender de servicios pagos de Google Maps API.

### 1.4. Integración con Contactos del Dispositivo
- **Ubicación:** `src/hooks/useDeviceContacts.ts`, `src/components/ContactPickerModal.tsx`
- **Librería:** `expo-contacts/legacy`
- **Características:**
  - Lectura segura de la libreta de contactos del teléfono, normalizando nombres, teléfonos móviles y direcciones de correo electrónico.
  - Modal con buscador en tiempo real por nombre, teléfono o iniciales.
  - Vinculación del contacto seleccionado a la tarea (`Reminder.contact`).
  - Acceso directo desde la tarjeta del recordatorio para realizar llamadas telefónicas (`tel:`) o redactar correos (`mailto:`).

### 1.5. Sincronización con Calendario Nativo
- **Ubicación:** `src/hooks/useDeviceCalendar.ts`
- **Librería:** `expo-calendar/legacy`
- **Características:**
  - Sincroniza las tareas agendadas directamente con el calendario predeterminado del sistema (Google Calendar en Android / Apple Calendar en iOS).
  - Detección automática o aprovisionamiento de un calendario propio ("Mi Agenda App") en caso de no existir un calendario local editable.
  - Soporte de eventos con fecha, hora, notas y ubicación adjunta.
  - Almacena el `calendarEventId` para reflejar automáticamente modificaciones o eliminaciones de eventos en el calendario nativo.
  - Compatible tanto en clientes gestionados (Expo Go) como en builds de desarrollo y producción (*standalone*).

### 1.6. Estado Global con Zustand
- **Ubicación:** `src/store/useReminderStore.ts`
- **Librería:** `zustand` (^5.0.0)
- **Características:**
  - Reemplaza el prop drilling y el uso disperso de `useState` entre componentes y pantallas (`HomeScreen`, `CreateScreen`, `useReminders`).
  - Manejo unificado de acciones asíncronas:
    - `loadReminders(username)`: Carga las tareas desde `AsyncStorage` hacia la memoria reactiva.
    - `addReminder(reminder, username)`: Guarda y actualiza de forma atómica.
    - `updateReminder(reminder, username)`: Modifica tareas existentes manteniendo sincronizada la caché.
    - `deleteReminder(id, username)`: Remueve tareas y limpia notificaciones y eventos asociados.
  - Estado `loading` centralizado para mostrar indicadores visuales consistentes.

### 1.7. Suite de Pruebas Automatizadas (Testing)
- **Framework:** Jest, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`
- **Cobertura:** 10 suites de pruebas con **85 tests unitarios** aprobados:
  1. `authValidation.test.ts`: Validación de credenciales y registros.
  2. `timeCalculations.test.ts`: Cálculos de lead time y rangos de alerta.
  3. `CustomButton.test.tsx`: Renderizado y comportamiento de botones interactivos.
  4. `ReminderCard.test.tsx`: Despliegue de tarjetas, badges de cámara, ubicación, contactos y calendario.
  5. `useReminderStore.test.ts`: Operaciones CRUD y manejo de estado en Zustand.
  6. `useReminders.test.ts`: Hook orquestador de recordatorios y notificaciones.
  7. `useLocation.test.ts`: Solicitud de permisos GPS y geocodificación inversa.
  8. `useContacts.test.ts`: Consulta de agenda nativa y filtrado de contactos.
  9. `useCalendar.test.ts`: Creación, actualización y supresión de eventos nativos.
  10. `useLocalNotifications.test.ts`: Programación de alertas locales, canales Android y badges.

---

## 2. Stack Tecnológico y Dependencias

| Componente | Paquete / Herramienta | Versión |
| :--- | :--- | :--- |
| **Framework Base** | Expo SDK | ^58.0.0 |
| **Núcleo Móvil** | React Native | 0.88.1 |
| **Librería React** | React | 19.3.0 |
| **Lenguaje** | TypeScript | ~6.0.3 |
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

## 3. Instalación y Ejecución

### 3.1. Requisitos Previos
- **Node.js:** Versión 18 o 20 LTS instalada en el sistema.
- **npm:** Gestor de paquetes incluido con Node.js.
- **Dispositivo físico o emulador:**
  - Dispositivo físico Android o iOS con la app **Expo Go** instalada.
  - O emulador Android Studio / simulador de iOS debidamente configurado.

### 3.2. Instalación de Dependencias
Clone el repositorio y acceda a la carpeta del proyecto en su terminal:

```bash
git clone <URL_DEL_REPOSITORIO>
cd MiAgendaApp
```

Instale las dependencias del proyecto ejecutando:

```bash
npm install --legacy-peer-deps
```

> **Nota:** Se utiliza `--legacy-peer-deps` para garantizar compatibilidad estricta con las versiones más recientes de React 19 y las herramientas de testing en Expo SDK 58.

### 3.3. Iniciar la Aplicación

Inicie el servidor de desarrollo de Metro/Expo:

```bash
npx expo start
```
o mediante el script configurado:
```bash
npm start
```

**Para probar la aplicación:**
- **Dispositivo físico (Recomendado para cámara, contactos y GPS):** Abra la app Expo Go en su teléfono y escanee el código QR que se imprime en la consola.
- **Emulador de Android:** Presione la tecla `a` en la terminal donde corre Expo.
- **Simulador de iOS (macOS):** Presione la tecla `i` en la terminal.

### 3.4. Ejecutar las Pruebas Unitarias

Para ejecutar la suite completa de pruebas automatizadas con Jest:

```bash
npm test
```

Para ejecutar las pruebas en modo detallado (*verbose*):

```bash
npm test -- --verbose
```

Para ejecutar una suite de pruebas específica (por ejemplo, el store de Zustand o el calendario):

```bash
npm test useReminderStore.test.ts
npm test useCalendar.test.ts
```

---

## 4. Documentación de Prompts Utilizados

A continuación se detallan los prompts de ingeniería utilizados para orientar y guiar la implementación asistida de las nuevas capacidades del sistema:

### Prompt 1: Ampliación de Tipos y Modelo de Datos
> *"Actualizar `src/types.ts` para que la entidad `Reminder` soporte campos de hardware: foto adjunta (`imageUri?: string | null`), ubicación geográfica (`location?: ReminderLocation` con latitud, longitud y dirección textual opcional), contacto asociado (`contact?: ReminderContact` con nombre, teléfono y email) e identificador de sincronización con calendario nativo (`calendarEventId?: string`). Mantener tipado estricto con TypeScript."*

### Prompt 2: Migración de Estado a Zustand
> *"Migrar la gestión de recordatorios a Zustand creando `src/store/useReminderStore.ts`. El store debe contener `reminders: Reminder[]`, `loading: boolean` y las funciones asíncronas `loadReminders`, `addReminder`, `updateReminder` y `deleteReminder`, sincronizadas con `AsyncStorage`. Refactorizar las pantallas `HomeScreen`, `CreateScreen` y el hook `useReminders` para consumir el store, eliminando el prop drilling."*

### Prompt 3: Manejo Seguro de Permisos Multiplataforma
> *"Crear una utilidad `requestPermissionSafely` en `src/utils/permissionHelpers.ts` que reciba una función de solicitud y una función de consulta de permisos. Debe escuchar cambios en `AppState` para evitar el bug de Android donde tocar fuera del diálogo del sistema descarta el cuadro sin resolver la promesa. Si el permiso es denegado permanentemente (`canAskAgain: false`), ofrecer un botón para abrir la configuración del sistema con `Linking.openSettings()`."*

### Prompt 4: Integración de Sensores y Hardware (Cámara, GPS, Contactos, Calendario)
> *"Desarrollar hooks modulares reutilizables utilizando las librerías de Expo:
> 1. `useCamera`: tomar fotos con `launchCameraAsync` y elegir de galería con `launchImageLibraryAsync`.
> 2. `useLocation`: obtener coordenadas GPS y convertir a dirección legible mediante geocodificación inversa. Añadir modal con mapa interactivo en WebView.
> 3. `useDeviceContacts`: consultar la agenda nativa y desplegar modal con barra de búsqueda para asociar un contacto.
> 4. `useDeviceCalendar`: sincronizar tareas con el calendario nativo del teléfono, creando el evento con fecha y hora y guardando el `calendarEventId`."*

### Prompt 5: Pruebas Unitarias Automatizadas con Mocks Nativos
> *"Diseñar una suite de pruebas completa en `src/__tests__/` usando Jest y React Native Testing Library. Mockear los módulos nativos (`expo-location`, `expo-contacts`, `expo-calendar`, `expo-image-picker`, `expo-notifications` y `AsyncStorage`). Verificar estados de permisos (concedido, denegado, bloqueado), llamadas a APIs nativas y operaciones sobre el store de Zustand."*

---

## 5. Comparativa de Código (Antes vs. Después)

### 5.1. Gestión de Estado: `useState` vs. Zustand Store

#### Antes (Estado Local y Prop Drilling)
Las tareas dependían de llamadas individuales al servicio de almacenamiento dentro de cada pantalla, provocando recargas duplicadas y desincronización:

```typescript
// useReminders.ts (Versión anterior)
export function useReminders(username: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getStoredReminders(username).then((stored) => {
        if (isActive) setReminders(stored);
      });
      return () => { isActive = false; };
    }, [username])
  );

  const toggleComplete = async (id: string) => {
    const updated = await updateReminderStatus(id, username);
    setReminders(updated); // Solo actualizaba la vista local
  };
  // ...
}
```

#### Después (Store Global Centralizado con Zustand)
El estado reside en una única fuente de verdad reactiva accesible por cualquier componente de la aplicación:

```typescript
// src/store/useReminderStore.ts
export const useReminderStore = create<ReminderStore>((set) => ({
  reminders: [],
  loading: false,

  loadReminders: async (username?: string) => {
    set({ loading: true });
    const stored = await getStoredReminders(username);
    set({ reminders: stored, loading: false });
  },

  updateReminder: async (reminder: Reminder, username?: string) => {
    set({ loading: true });
    const targetUser = username ?? reminder.username;
    const success = await updateStoredReminder(reminder, targetUser);
    if (success) {
      const stored = await getStoredReminders(targetUser);
      set({ reminders: stored, loading: false });
      return true;
    }
    set({ loading: false });
    return false;
  },
  // ...
}));
```

---

### 5.2. Manejo de Permisos: Solicitud Convencional vs. `requestPermissionSafely`

#### Antes (Solicitud Simple Susceptible a Deadlocks)
Si el usuario tocaba fuera del diálogo del sistema en Android, la promesa no se completaba y la pantalla quedaba bloqueada:

```typescript
// Implementación ingenua anterior
const solicitarPermiso = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert("Error", "Permiso denegado");
    return false;
  }
  return true;
};
```

#### Después (Patrón Seguro con Listener de `AppState`)
Se previene la pérdida de promesas detectando el retorno a primer plano de la app y consultando el estado real con `getFn`:

```typescript
// src/utils/permissionHelpers.ts
export async function requestPermissionSafely<T>(
  requestFn: () => Promise<T>,
  getFn: () => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      subscription.remove();
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && !settled) {
        resumeTimer = setTimeout(async () => {
          if (!settled) {
            settled = true;
            cleanup();
            const current = await getFn();
            resolve(current);
          }
        }, 500);
      }
    });

    requestFn().then((res) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(res);
      }
    }).catch(reject);
  });
}
```

---

### 5.3. Modelo de Datos: Recordatorio Simple vs. Multisensorial

#### Antes (Modelo de Datos Plano)
```typescript
export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category: CategoryType;
  completed: boolean;
  notificationId?: string | null;
}
```

#### Después (Modelo de Datos Enriquecido con Hardware)
```typescript
// src/types.ts
export interface ReminderLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ReminderContact {
  name: string;
  phone?: string;
  email?: string;
}

export interface Reminder {
  id: string;
  username?: string;
  title: string;
  description: string;
  date: string;
  isoDate?: string;
  time: string;
  targetTimestamp?: number;
  leadTimeSeconds?: number | null;
  category: CategoryType;
  completed: boolean;
  notificationId?: string | null;
  imageUri?: string | null;          // Foto o imagen adjunta
  location?: ReminderLocation;        // Coordenadas y dirección GPS
  contact?: ReminderContact;          // Contacto asociado de la libreta
  calendarEventId?: string;          // ID de evento en calendario nativo
}
```

---

### 5.4. Componente `ReminderCard`: Visualización Plana vs. Interactiva

#### Antes (Tarjeta Básica de Texto)
La tarjeta solo exponía título, fecha y categoría en formato de texto plano sin interacción con recursos externos:

```tsx
<View style={styles.card}>
  <Text style={styles.title}>{reminder.title}</Text>
  <Text style={styles.date}>{reminder.date} {reminder.time}</Text>
  <TouchableOpacity onPress={() => onDelete(reminder.id)}>
    <Text>Eliminar</Text>
  </TouchableOpacity>
</View>
```

#### Después (Tarjeta con Badges de Sensores y Acciones Nativas)
Presenta miniaturas de fotos, badges de geolocalización, acceso a llamadas del contacto vinculado e indicador de evento sincronizado en el calendario:

```tsx
// src/components/ReminderCard.tsx (Fragmento)
<View style={[styles.card, reminder.completed && styles.cardCompleted]}>
  {/* Foto adjunta con miniatura táctil */}
  {reminder.imageUri && (
    <TouchableOpacity onPress={() => onPreviewImage?.(reminder.imageUri!)}>
      <Image source={{ uri: reminder.imageUri }} style={styles.thumbnail} />
    </TouchableOpacity>
  )}

  {/* Información de Ubicación GPS */}
  {reminder.location && (
    <View style={styles.metaRow}>
      <Feather name="map-pin" size={14} color={COLORS.primary} />
      <Text style={styles.metaText} numberOfLines={1}>
        {reminder.location.address || `${reminder.location.latitude.toFixed(4)}, ${reminder.location.longitude.toFixed(4)}`}
      </Text>
    </View>
  )}

  {/* Contacto Vinculado */}
  {reminder.contact && (
    <View style={styles.metaRow}>
      <Feather name="user" size={14} color={COLORS.secondary} />
      <Text style={styles.metaText}>{reminder.contact.name}</Text>
      {reminder.contact.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${reminder.contact.phone}`)}>
          <Feather name="phone-call" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  )}

  {/* Badge de Calendario Nativo */}
  {reminder.calendarEventId && (
    <View style={styles.calendarBadge}>
      <Feather name="calendar" size={12} color={COLORS.success} />
      <Text style={styles.calendarBadgeText}>En Calendario</Text>
    </View>
  )}
</View>
```

---

## 6. Demostración en Video

Puede acceder al video con la demostración de la aplicación en funcionamiento en el siguiente enlace:

- **Link del video:** [Ver Video en Google Drive](https://drive.google.com/file/d/1EgHf4M5Eu4Z5BwpAjh9GvGz3TfM9AnkE/view?usp=drive_link)
