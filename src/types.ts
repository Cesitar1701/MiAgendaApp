export type CategoryType = "trabajo" | "salud" | "personal" | "urgente";

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
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { username: string };
  Create: { username?: string; reminder?: Reminder } | undefined;
};
