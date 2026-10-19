import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@usuarios";
const TOKEN_KEY = "@token";

export interface User {
  username: string;
  password: string;
}

// Función determinística de hash para evitar guardar contraseñas en texto plano
export const hashPassword = (password: string): string => {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }
  return `h_${(hash >>> 0).toString(16)}_${password.length}`;
};

// Validación reutilizable de datos de registro
export const validarRegistro = (
  usuario: string,
  pass: string,
  confirmPass: string,
):
  | "Campos vacíos"
  | "Las contraseñas no coinciden"
  | "Contraseña muy corta"
  | "Válido" => {
  if (!usuario.trim() || !pass.trim()) return "Campos vacíos";
  if (pass !== confirmPass) return "Las contraseñas no coinciden";
  if (pass.length < 6) return "Contraseña muy corta";
  return "Válido";
};

// Obtener todos los usuarios registrados
export const getUsuariosRegistrados = async (): Promise<User[]> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener los usuarios registrados:", error);
    return [];
  }
};

// Registrar un nuevo usuario
export const registrarUsuario = async (
  usuario: User,
): Promise<{ success: boolean; message: string }> => {
  try {
    const usuarios = await getUsuariosRegistrados();
    const cleanUsername = usuario.username.trim();
    const usuarioExiste = usuarios.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase(),
    );
    if (usuarioExiste) {
      return { success: false, message: "El usuario ya existe" };
    }
    usuarios.push({
      username: cleanUsername,
      password: hashPassword(usuario.password),
    });
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuarios));
    return { success: true, message: "Usuario registrado exitosamente" };
  } catch (error) {
    return { success: false, message: "Error al registrar el usuario" };
  }
};

// Validar login (compatible con contraseñas hasheadas y previas en texto plano)
export const validarLogin = async (credenciales: User): Promise<boolean> => {
  try {
    const usuarios = await getUsuariosRegistrados();
    const hashedInput = hashPassword(credenciales.password);
    const validarUsuario = usuarios.find(
      (u) =>
        u.username.toLowerCase() ===
          credenciales.username.trim().toLowerCase() &&
        (u.password === hashedInput || u.password === credenciales.password),
    );
    if (validarUsuario) {
      await AsyncStorage.setItem(
        TOKEN_KEY,
        JSON.stringify({ username: validarUsuario.username }),
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return false;
  }
};

// Obtener usuario con sesión activa
export const obtenerSesionActiva = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.username === "string" ? parsed.username : null;
  } catch (error) {
    console.error("Error al obtener la sesión activa:", error);
    return null;
  }
};

// Cerrar sesión
export const cerrarSesion = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};
