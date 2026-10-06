import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import CustomButton from "../components/CustomButton";

describe("Componente Reutilizable: CustomButton", () => {
  test("debe renderizar el título correctamente", () => {
    // 1. Solo llamamos a render sin desestructurar nada
    render(<CustomButton title="Iniciar Sesión" onPress={() => {}} />);

    // 2. Usamos 'screen' para buscar el texto
    expect(screen.getByText("Iniciar Sesión")).toBeTruthy();
  });

  test("debe ejecutar la función onPress al ser presionado", () => {
    const mockOnPress = jest.fn();
    render(<CustomButton title="Guardar" onPress={mockOnPress} />);

    // Usamos 'screen' directamente dentro del evento
    fireEvent.press(screen.getByText("Guardar"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
