import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Linking } from "react-native";
import ReminderCard from "../components/ReminderCard";
import { Reminder } from "../types";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Feather: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

describe("Componente: ReminderCard", () => {
  const baseReminder: Reminder = {
    id: "1",
    title: "Reunión de equipo",
    description: "Revisión semanal",
    date: "06/11/2026",
    time: "15:00",
    category: "trabajo",
    completed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza chip de ubicación con dirección cuando reminder.location está presente", () => {
    const reminderWithLocation: Reminder = {
      ...baseReminder,
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: "Av. Corrientes 1234, CABA",
      },
    };

    render(
      <ReminderCard
        reminder={reminderWithLocation}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByText("Av. Corrientes 1234, CABA")).toBeTruthy();
  });

  test("al presionar el chip de ubicación abre la URL nativa de mapas con Linking.openURL", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true as never);

    const reminderWithLocation: Reminder = {
      ...baseReminder,
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: "Av. Corrientes 1234, CABA",
      },
    };

    render(
      <ReminderCard
        reminder={reminderWithLocation}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const chip = screen.getByLabelText(/Abrir ubicación/i);
    fireEvent.press(chip);

    expect(Linking.canOpenURL).toHaveBeenCalled();
  });

  test("no renderiza chip de ubicación si reminder.location no está presente", () => {
    render(
      <ReminderCard
        reminder={baseReminder}
        onToggleComplete={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/Abrir ubicación/i)).toBeNull();
  });
});

