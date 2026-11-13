import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { ReminderLocation } from "../../types";
import { useLocation } from "../../hooks/useLocation";
import { COLORS, RADIUS } from "../../constants/theme";

interface Props {
  visible: boolean;
  initialLocation?: ReminderLocation | null;
  onClose: () => void;
  onConfirm: (location: ReminderLocation) => void;
}

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationSelectedMessage {
  type: "locationSelected";
  latitude: number;
  longitude: number;
}

const DEFAULT_COORDS: Coords = {
  latitude: -34.6037,
  longitude: -58.3816,
};

const isLocationSelectedMessage = (
  value: unknown,
): value is LocationSelectedMessage => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === "locationSelected" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    !Number.isNaN(candidate.latitude) &&
    !Number.isNaN(candidate.longitude)
  );
};

const buildLeafletHtml = (initialLat: number, initialLon: number): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #e5e3df;
    }
    .custom-pin {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var marker;

    function sendLocation(lat, lng) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationSelected',
          latitude: lat,
          longitude: lng
        }));
      }
    }

    function init() {
      map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLon}], 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      var pinSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="38" height="38" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/></svg>';
      var customIcon = L.divIcon({
        className: 'custom-pin',
        html: pinSvg,
        iconSize: [38, 38],
        iconAnchor: [19, 38]
      });

      marker = L.marker([${initialLat}, ${initialLon}], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      marker.on('dragend', function() {
        var pos = marker.getLatLng();
        sendLocation(pos.lat, pos.lng);
      });

      map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        sendLocation(e.latlng.lat, e.latlng.lng);
      });
    }

    window.setCenter = function(lat, lng) {
      if (map && marker) {
        marker.setLatLng([lat, lng]);
        map.flyTo([lat, lng], 16, { duration: 0.8 });
      }
    };

    window.onload = init;
  </script>
</body>
</html>
`;

export default function MapLocationPickerModal({
  visible,
  initialLocation,
  onClose,
  onConfirm,
}: Props) {
  const {
    obtenerUbicacionActual,
    obtenerDireccionDeCoordenadas,
    loading: gpsLoading,
  } = useLocation();

  const [mapInitialCoords, setMapInitialCoords] = useState<Coords>({
    latitude: initialLocation?.latitude ?? DEFAULT_COORDS.latitude,
    longitude: initialLocation?.longitude ?? DEFAULT_COORDS.longitude,
  });

  const [currentCoords, setCurrentCoords] = useState<Coords>({
    latitude: initialLocation?.latitude ?? DEFAULT_COORDS.latitude,
    longitude: initialLocation?.longitude ?? DEFAULT_COORDS.longitude,
  });

  const [address, setAddress] = useState<string>(
    initialLocation?.address ?? "Cargando dirección...",
  );
  const [resolvingAddress, setResolvingAddress] = useState<boolean>(false);
  const webViewRef = useRef<WebView<{}>>(null);
  const geocodeRequestIdRef = useRef<number>(0);

  const moveMapCenter = useCallback((latitude: number, longitude: number) => {
    const jsCode = `if (window.setCenter) { window.setCenter(${latitude}, ${longitude}); } true;`;
    webViewRef.current?.injectJavaScript(jsCode);
  }, []);

  const handleResolveAddress = useCallback(
    async (latitude: number, longitude: number) => {
      const requestId = ++geocodeRequestIdRef.current;
      setResolvingAddress(true);
      try {
        const addr = await obtenerDireccionDeCoordenadas({
          latitude,
          longitude,
        });
        if (requestId === geocodeRequestIdRef.current) {
          setAddress(addr);
        }
      } catch {
        if (requestId === geocodeRequestIdRef.current) {
          setAddress(
            `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
          );
        }
      } finally {
        if (requestId === geocodeRequestIdRef.current) {
          setResolvingAddress(false);
        }
      }
    },
    [obtenerDireccionDeCoordenadas],
  );

  // Sincronizar coordenadas solo al abrir el modal sin recargar WebView tras cada toque
  useEffect(() => {
    if (!visible) return;

    if (initialLocation) {
      const coords = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      };
      setMapInitialCoords(coords);
      setCurrentCoords(coords);
      if (initialLocation.address) {
        setAddress(initialLocation.address);
      } else {
        void handleResolveAddress(coords.latitude, coords.longitude);
      }
    } else {
      setMapInitialCoords(DEFAULT_COORDS);
      setCurrentCoords(DEFAULT_COORDS);
      void obtenerUbicacionActual().then((loc) => {
        if (loc) {
          setCurrentCoords({
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
          setAddress(loc.address || "Ubicación actual detectada");
          moveMapCenter(loc.latitude, loc.longitude);
        } else {
          void handleResolveAddress(
            DEFAULT_COORDS.latitude,
            DEFAULT_COORDS.longitude,
          );
        }
      });
    }
  }, [
    visible,
    initialLocation,
    handleResolveAddress,
    obtenerUbicacionActual,
    moveMapCenter,
  ]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const parsed: unknown = JSON.parse(event.nativeEvent.data);
      if (isLocationSelectedMessage(parsed)) {
        setCurrentCoords({
          latitude: parsed.latitude,
          longitude: parsed.longitude,
        });
        void handleResolveAddress(parsed.latitude, parsed.longitude);
      }
    } catch (err) {
      console.warn(
        "[MapLocationPickerModal] Error procesando mensaje de WebView:",
        err,
      );
    }
  };

  const handleCenterOnGPS = async () => {
    const loc = await obtenerUbicacionActual();
    if (loc) {
      moveMapCenter(loc.latitude, loc.longitude);
      setCurrentCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setAddress(
        loc.address ??
          `Lat: ${loc.latitude.toFixed(4)}, Lon: ${loc.longitude.toFixed(4)}`,
      );
    }
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      address,
    });
    onClose();
  };

  const leafletHtml = useMemo(
    () =>
      buildLeafletHtml(mapInitialCoords.latitude, mapInitialCoords.longitude),
    [mapInitialCoords.latitude, mapInitialCoords.longitude],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Cabecera del modal */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Cerrar mapa"
          >
            <Feather name="x" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Seleccionar Ubicación</Text>
            <Text style={styles.headerSubtitle}>
              Toca o arrastra el marcador para fijar el punto
            </Text>
          </View>
        </View>

        {/* Mapa con Leaflet / OpenStreetMap en WebView */}
        <View style={styles.mapContainer}>
          <WebView<{}>
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: leafletHtml }}
            onMessage={handleMessage}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapLoader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.mapLoaderText}>Cargando mapa...</Text>
              </View>
            )}
          />

          {/* Botón flotante para centrar en GPS */}
          <TouchableOpacity
            style={styles.gpsFloatingButton}
            onPress={handleCenterOnGPS}
            activeOpacity={0.8}
            disabled={gpsLoading}
            accessibilityLabel="Centrar en mi ubicación actual"
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Feather name="crosshair" size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Tarjeta inferior con dirección detectada y confirmación */}
        <View style={styles.bottomSheet}>
          <View style={styles.addressSection}>
            <View style={styles.addressIconBox}>
              <Feather name="map-pin" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.addressTextBox}>
              <Text style={styles.addressLabel}>Dirección detectada</Text>
              {resolvingAddress ? (
                <View style={styles.resolvingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.resolvingText}>
                    Resolviendo dirección...
                  </Text>
                </View>
              ) : (
                <Text style={styles.addressValue} numberOfLines={2}>
                  {address}
                </Text>
              )}
              <Text style={styles.coordsText}>
                {`Lat: ${currentCoords.latitude.toFixed(5)}, Lon: ${currentCoords.longitude.toFixed(5)}`}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Feather name="check" size={18} color={COLORS.surface} />
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  mapLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLoaderText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  gpsFloatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 12 : 20,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  addressTextBox: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resolvingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  resolvingText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  addressValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.textPlaceholder,
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.surface,
  },
});
