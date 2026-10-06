// Función simulada de validación (podés importarla si ya la tenés en otro archivo)
const validarRegistro = (
  usuario: string,
  pass: string,
  confirmPass: string,
) => {
  if (!usuario.trim() || !pass.trim()) return "Campos vacíos";
  if (pass !== confirmPass) return "Las contraseñas no coinciden";
  if (pass.length < 6) return "Contraseña muy corta";
  return "Válido";
};

describe("Lógica de Negocio: Validación de Autenticación", () => {
  test("debe rechazar contraseñas que no coinciden", () => {
    const resultado = validarRegistro("cesar", "123456", "1234567");
    expect(resultado).toBe("Las contraseñas no coinciden");
  });

  test("debe validar correctamente los datos correctos", () => {
    const resultado = validarRegistro("cesar", "password123", "password123");
    expect(resultado).toBe("Válido");
  });
});
