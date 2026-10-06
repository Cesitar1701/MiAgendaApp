const calcularSegundosRestantes = (
  targetTime: number,
  leadTimeSeconds: number,
  currentTime: number,
) => {
  const fireTime = targetTime - leadTimeSeconds * 1000;
  return Math.floor((fireTime - currentTime) / 1000);
};

describe("Lógica de Negocio: Cálculo de Notificaciones", () => {
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
});
