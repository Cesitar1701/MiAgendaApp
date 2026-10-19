import { validarRegistro, hashPassword } from "../services/authStorage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("Lógica de Negocio: Validación de Autenticación", () => {
  test("debe rechazar campos vacíos", () => {
    const resultado = validarRegistro("   ", "123456", "123456");
    expect(resultado).toBe("Campos vacíos");
  });

  test("debe rechazar contraseñas que no coinciden", () => {
    const resultado = validarRegistro("cesar", "123456", "1234567");
    expect(resultado).toBe("Las contraseñas no coinciden");
  });

  test("debe rechazar contraseñas menores a 6 caracteres", () => {
    const resultado = validarRegistro("cesar", "12345", "12345");
    expect(resultado).toBe("Contraseña muy corta");
  });

  test("debe validar correctamente los datos correctos", () => {
    const resultado = validarRegistro("cesar", "password123", "password123");
    expect(resultado).toBe("Válido");
  });

  test("debe generar un hash determinístico distinto del texto plano", () => {
    const hashA = hashPassword("password123");
    const hashB = hashPassword("password123");
    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe("password123");
  });
});
