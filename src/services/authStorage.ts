import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@usuarios';
const TOKEN_KEY = '@token';

export interface User{
    username: string;
    password: string;
}

//Obtener todos los usuarios registrados
export const getUsuariosRegistrados = async (): Promise<User[]> => {
    try{
        const data = await AsyncStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error al obtener los usuarios registrados:', error);
        return [];
    }
};

// Resgistrar un nuevo usuario
export const registrarUsuario = async (usuario: User): Promise<{success: boolean; message: string}> => {
    try{
        const usuarios = await getUsuariosRegistrados();
        const usuarioExiste = usuarios.some(u => u.username.toLowerCase() === usuario.username.toLowerCase());
        if (usuarioExiste) {
            return { success: false, message: 'El usuario ya existe' };
        }
        usuarios.push(usuario);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuarios));
        return { success: true, message: 'Usuario registrado exitosamente' };
    }catch (error) {
        return { success: false, message: 'Error al registrar el usuario' };
    }
};

// Validar login
export const validarLogin = async (credenciales: User): Promise<boolean> => {
    try{
        const usuarios = await getUsuariosRegistrados();
        const validarUsuario = usuarios.find( u => u.username.toLowerCase() === credenciales.username.toLowerCase() && u.password === credenciales.password);
        if (validarUsuario) {
            await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify({ username: validarUsuario.username }));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return false;
    }
};

// Cerrar sesión
export const cerrarSesion = async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_KEY);
};