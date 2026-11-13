import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import CustomButton from "../components/ui/CustomButton";

describe("Componente Reutilizable: CustomButton", () => {
  test("debe renderizar el título correctamente", () => {
    render(<CustomButton title="Iniciar Sesión" onPress={() => {}} />);
    expect(screen.getByText("Iniciar Sesión")).toBeTruthy();
  });

  test("debe ejecutar la función onPress al ser presionado", () => {
    const mockOnPress = jest.fn();
    render(<CustomButton title="Guardar" onPress={mockOnPress} />);

    fireEvent.press(screen.getByText("Guardar"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
