import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
  Pressable,
  Linking,
  AppState,
  type AppStateStatus,
} from "react-native";
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { Button, Text, IconButton, useTheme } from "react-native-paper";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export type PhotoCaptureScreenProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  minImages?: number;
  title?: string;
  helperText?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
};
export default function PhotoCaptureScreen({
  images,
  onImagesChange,
  minImages = 0,
  title = "Captured photos",
  helperText,
  showCloseButton = false,
  onClose,
}: PhotoCaptureScreenProps) {
  const theme = useTheme();
  const [cameraPermission, requestPermission, getPermission] =
    useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [zoom, setZoom] = useState(0);
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          void getPermission();
        }
        appStateRef.current = nextAppState;
      },
    );
    return () => subscription.remove();
  }, [getPermission]);

  const handlePermissionContinue = useCallback(async () => {
    if (!cameraPermission) return;
    if (cameraPermission.canAskAgain === false) {
      await Linking.openSettings();
      return;
    }
    await requestPermission();
  }, [cameraPermission, requestPermission]);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };
  const toggleFlash = () => {
    setFlash((current) => {
      if (current === "off") return "on";
      if (current === "on") return "auto";
      return "off";
    });
  };
  const handleZoomChange = (zoomLevel: number) => {
    setZoom(zoomLevel);
  };
  const handleTakePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onImagesChange([...images, photo.uri]);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };
  const handleRemoveImage = (uri: string) => {
    onImagesChange(images.filter((imageUri) => imageUri !== uri));
    setPreviewImage(null);
  };
  const getFlashIcon = () => {
    if (flash === "off") return "flash-off";
    if (flash === "on") return "flash";
    return "flash-auto";
  };
  const defaultHelperText =
    minImages > 0
      ? images.length < minImages
        ? `Take at least ${minImages} photos to enable submit`
        : "4 photos required for report; add more (8–12 for buildings, or more for large properties)."
      : "Tap thumbnail to view • Tap delete in preview to remove. No limit.";
  if (!cameraPermission) {
    return <View style={styles.placeholder} />;
  }
  if (!cameraPermission.granted) {
    const needsSettings = cameraPermission.canAskAgain === false;
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          Camera access
        </Text>
        <Text
          variant="bodyMedium"
          style={[
            styles.permissionMessage,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {needsSettings
            ? "Camera access was turned off. Open Settings to enable the camera so you can photograph the property for your valuation report."
            : "Camera access is used to photograph the property for your valuation report."}
        </Text>
        <Button onPress={handlePermissionContinue} mode="contained">
          {needsSettings ? "Open Settings" : "Continue"}
        </Button>
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {showCloseButton && onClose && (
        <View
          style={[
            styles.closeBar,
            {
              backgroundColor: theme.colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButtonTouchable,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <IconButton
              icon="close"
              size={26}
              iconColor={theme.colors.onSurface}
              onPress={onClose}
            />
            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onSurface }}
            >
              Close
            </Text>
          </Pressable>
          <Text
            variant="titleMedium"
            style={[styles.closeBarTitle, { color: theme.colors.onSurface }]}
          >
            {title}
          </Text>
          <Button
            mode="contained"
            compact
            onPress={onClose}
            style={styles.doneButton}
          >
            Done
          </Button>
        </View>
      )}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          zoom={zoom}
          enableTorch={flash === "on"}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.topOverlay}>
            <View style={styles.topControls}>
              <View style={styles.counterBadge}>
                <Text variant="bodyMedium" style={styles.counterText}>
                  {minImages > 0
                    ? `${images.length} photos (min ${minImages})`
                    : `${images.length} photos`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFlash}
              >
                <IconButton icon={getFlashIcon()} size={24} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomOverlay}>
            <TouchableOpacity
              style={[styles.roundButton, styles.flipButton]}
              onPress={toggleCameraFacing}
            >
              <IconButton icon="camera-flip" size={24} />
            </TouchableOpacity>

            <View style={styles.middleOverlay}>
              <View style={styles.zoomControls}>
                {([0, 0.5, 1] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.zoomButton,
                      zoom === level && styles.zoomButtonActive,
                    ]}
                    onPress={() => handleZoomChange(level)}
                  >
                    <Text
                      style={[
                        styles.zoomText,
                        zoom === level && styles.zoomTextActive,
                      ]}
                    >
                      {level === 0 ? "1x" : level === 0.5 ? "2x" : "3x"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.roundButton, styles.captureButton]}
              onPress={handleTakePicture}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.galleryContainer}>
        <Text variant="titleMedium" style={styles.galleryTitle}>
          {title}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galleryScroll}
        >
          {images.map((uri, index) => (
            <TouchableOpacity
              key={uri}
              onPress={() => setPreviewImage(uri)}
              style={styles.thumbnailWrapper}
            >
              <Image source={{ uri }} style={styles.thumbnail} />
              <View style={styles.thumbnailBadge}>
                <Text style={styles.thumbnailNumber}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text
          variant="bodySmall"
          style={[
            styles.helperText,
            minImages > 0 &&
              images.length < minImages &&
              styles.helperTextError,
          ]}
        >
          {helperText ?? defaultHelperText}
        </Text>
      </View>

      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <IconButton
              icon="close"
              iconColor="white"
              size={28}
              onPress={() => setPreviewImage(null)}
            />
            <IconButton
              icon="delete"
              iconColor="white"
              size={28}
              onPress={() => previewImage && handleRemoveImage(previewImage)}
            />
          </View>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.previewFooter}>
            <Text variant="bodyMedium" style={styles.previewText}>
              Tap close to exit • Tap delete to remove photo
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  closeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    minHeight: 56,
  },
  closeButtonTouchable: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 88,
    minHeight: 44,
  },
  doneButton: {
    minWidth: 80,
  },
  closeBarTitle: {
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionMessage: {
    textAlign: "center",
    marginVertical: 8,
  },
  cameraWrapper: {
    flex: 9,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 16,
  },
  topOverlay: {
    alignItems: "flex-start",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  counterBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    color: "white",
    fontWeight: "600",
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  middleOverlay: {
    alignItems: "center",
  },
  zoomControls: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 4,
    gap: 4,
  },
  zoomButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  zoomButtonActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  zoomText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  zoomTextActive: {
    color: "white",
  },
  bottomOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    backgroundColor: "white",
    borderWidth: 4,
    borderColor: "rgba(0,0,0,0.3)",
  },
  captureInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
  },
  flipButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  galleryContainer: {
    flex: 2,
  },
  galleryTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  galleryScroll: {
    paddingVertical: 4,
  },
  thumbnailWrapper: {
    marginRight: 8,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  thumbnailBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailNumber: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  helperText: {
    marginTop: 4,
  },
  helperTextError: {
    color: "#B00020",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 40,
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  previewFooter: {
    padding: 16,
    alignItems: "center",
  },
  previewText: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});
