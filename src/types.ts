export type CategoryType = "trabajo" | "salud" | "personal" | "urgente";

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

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { username: string };
  Create: undefined;
};
