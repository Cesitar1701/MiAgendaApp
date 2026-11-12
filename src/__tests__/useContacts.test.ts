import { renderHook, act } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";
import * as Contacts from "expo-contacts/legacy";
import { useDeviceContacts } from "../hooks/useDeviceContacts";

jest.mock("expo-contacts/legacy", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  Fields: {
    Name: "name",
    PhoneNumbers: "phoneNumbers",
    Emails: "emails",
  },
  SortTypes: {
    FirstName: "firstName",
  },
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

describe("useDeviceContacts Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devuelve los contactos formateados y ordenados cuando el permiso ya está concedido", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "granted",
      canAskAgain: true,
    });

    (Contacts.getContactsAsync as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          id: "2",
          name: "Carlos Gómez",
          phoneNumbers: [{ number: "+54 11 9876-5432", label: "mobile" }],
          emails: [{ email: "carlos@example.com" }],
        },
        {
          id: "1",
          name: "Ana Pérez",
          phoneNumbers: [{ number: "+54 11 1234-5678", label: "work" }],
        },
      ],
    });

    const { result } = renderHook(() => useDeviceContacts());

    let contactosResult;
    await act(async () => {
      contactosResult = await result.current.cargarContactos();
    });

    expect(contactosResult).toEqual([
      {
        name: "Ana Pérez",
        phone: "+54 11 1234-5678",
        email: undefined,
      },
      {
        name: "Carlos Gómez",
        phone: "+54 11 9876-5432",
        email: "carlos@example.com",
      },
    ]);
    expect(result.current.contacts).toEqual(contactosResult);
    expect(result.current.loading).toBe(false);
  });

  it("solicita permisos cuando el estado inicial no es granted y los concede", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "undetermined",
      canAskAgain: true,
    });

    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "granted",
      canAskAgain: true,
    });

    (Contacts.getContactsAsync as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          firstName: "Martín",
          lastName: "Fierro",
          phoneNumbers: [{ number: "11223344" }],
        },
      ],
    });

    const { result } = renderHook(() => useDeviceContacts());

    let contactosResult;
    await act(async () => {
      contactosResult = await result.current.cargarContactos();
    });

    expect(Contacts.requestPermissionsAsync).toHaveBeenCalled();
    expect(contactosResult).toEqual([
      {
        name: "Martín Fierro",
        phone: "11223344",
        email: undefined,
      },
    ]);
  });

  it("muestra alerta y retorna lista vacía cuando el permiso es denegado temporalmente (canAskAgain: true)", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
      canAskAgain: true,
    });

    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
      canAskAgain: true,
    });

    const { result } = renderHook(() => useDeviceContacts());

    let contactosResult;
    await act(async () => {
      contactosResult = await result.current.cargarContactos();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Permiso denegado",
      "No se puede acceder a la agenda sin conceder el permiso correspondiente.",
    );
    expect(contactosResult).toEqual([]);
    expect(result.current.contacts).toEqual([]);
  });

  it("muestra opción para abrir ajustes cuando canAskAgain es false", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
      canAskAgain: false,
    });

    const { result } = renderHook(() => useDeviceContacts());

    let contactosResult;
    await act(async () => {
      contactosResult = await result.current.cargarContactos();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Permiso de contactos desactivado",
      "Debes habilitar el acceso a los contactos desde los Ajustes del dispositivo para asociar contactos a tus recordatorios.",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancelar" }),
        expect.objectContaining({ text: "Abrir ajustes" }),
      ]),
    );

    // Verificamos que al presionar el botón de abrir ajustes se llama a Linking.openSettings
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const buttons = alertCalls[0][2];
    const openSettingsBtn = buttons.find((b: any) => b.text === "Abrir ajustes");
    expect(openSettingsBtn).toBeDefined();

    openSettingsBtn.onPress();
    expect(Linking.openSettings).toHaveBeenCalled();
    expect(contactosResult).toEqual([]);
  });

  it("maneja errores de forma segura si la lectura de contactos falla", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "granted",
      canAskAgain: true,
    });

    (Contacts.getContactsAsync as jest.Mock).mockRejectedValueOnce(
      new Error("Fallo en hardware de contactos"),
    );

    const { result } = renderHook(() => useDeviceContacts());

    let contactosResult;
    await act(async () => {
      contactosResult = await result.current.cargarContactos();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "No se pudieron obtener los contactos del dispositivo.",
    );
    expect(contactosResult).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
