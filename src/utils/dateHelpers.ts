export const getFormattedCurrentDate = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return now.toLocaleDateString("es-ES", options).toUpperCase();
};
