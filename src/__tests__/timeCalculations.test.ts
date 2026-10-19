import {
  calcularSegundosRestantes,
  toISODateString,
  resolveReminderIsoDate,
  isTodayOrFutureReminder,
  calculateCustomLeadTime,
  formatLeadTimeLabel,
  reconstructReminderDate,
} from "../utils/dateHelpers";

describe("Lógica de Negocio: Cálculo de Notificaciones y Fechas", () => {
  test("debe calcular los segundos exactos restando la antelación", () => {
    const ahora = 1000000;
    const evento = 1000000 + 120000; // Evento en 120 segundos
    const antelacion = 30; // Notificar 30 segundos antes

    const resultado = calcularSegundosRestantes(evento, antelacion, ahora);
    expect(resultado).toBe(90); // 120 - 30 = 90
  });

  test("debe retornar 0 o negativo si la fecha ya pasó", () => {
    const resultado = calcularSegundosRestantes(50000, 0, 100000);
    expect(resultado).toBeLessThanOrEqual(0);
  });

  test("debe formatear una fecha en formato ISO YYYY-MM-DD local", () => {
    const fecha = new Date(2026, 9, 16, 14, 30); // 16 de octubre de 2026
    expect(toISODateString(fecha)).toBe("2026-10-16");
  });

  test("debe excluir recordatorios de fechas pasadas y permitir actuales o futuras en 'Ver todo'", () => {
    const hoy = new Date(2026, 9, 19, 12, 0); // 19 de octubre de 2026

    const recordatorioPasado = { date: "16 oct. 2026" };
    const recordatorioHoy = { date: "19 oct. 2026", isoDate: "2026-10-19" };
    const recordatorioFuturo = { date: "25 oct. 2026", isoDate: "2026-10-25" };

    expect(resolveReminderIsoDate(recordatorioPasado)).toBe("2026-10-16");
    expect(isTodayOrFutureReminder(recordatorioPasado, hoy)).toBe(false);
    expect(isTodayOrFutureReminder(recordatorioHoy, hoy)).toBe(true);
    expect(isTodayOrFutureReminder(recordatorioFuturo, hoy)).toBe(true);
  });

  test("debe convertir correctamente unidades de antelación personalizadas y reconstruir etiquetas", () => {
    expect(calculateCustomLeadTime(2, "hours")).toEqual({
      seconds: 7200,
      label: "2 horas antes",
    });
    expect(calculateCustomLeadTime(1, "days")).toEqual({
      seconds: 86400,
      label: "1 día antes",
    });
    expect(formatLeadTimeLabel(900)).toBe("15 minutos antes");
    expect(formatLeadTimeLabel(7200)).toBe("2 horas antes");
  });

  test("debe reconstruir un objeto Date a partir de un recordatorio para su edición", () => {
    const reconstructed = reconstructReminderDate({
      date: "20 oct. 2026",
      isoDate: "2026-10-20",
      time: "18:45",
    });
    expect(toISODateString(reconstructed)).toBe("2026-10-20");
    expect(reconstructed.getHours()).toBe(18);
    expect(reconstructed.getMinutes()).toBe(45);
  });
});
