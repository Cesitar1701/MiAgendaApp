export type CategoryType = "trabajo" | "salud" | "personal" | "urgente";

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
  isoDate: string;
  time: string;
  targetTimestamp: number;
  leadTimeSeconds?: number | null;
  category: CategoryType;
  completed: boolean;
  notificationId?: string | null;
  imageUri?: string | null;
  location?: ReminderLocation;
  contact?: ReminderContact;
  calendarEventId?: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Create: { reminder?: Reminder } | undefined;
};
