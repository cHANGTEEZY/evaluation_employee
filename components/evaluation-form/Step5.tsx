import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { Button, Text, IconButton } from "react-native-paper";
import { useFormContext } from "react-hook-form";

type Step5Props = {
  onImagesChange?: (images: string[]) => void;
};

const MIN_IMAGES = 5;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Step5 = ({ onImagesChange }: Step5Props) => {
  const form = useFormContext();
  const existingImages = form.watch("property_images") || [];

  const [images, setImages] = useState<string[]>(
    Array.isArray(existingImages) ? existingImages : [],
  );
  const [cameraPermission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [zoom, setZoom] = useState(0);
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  // Load existing images when form value changes
  useEffect(() => {
    if (
      Array.isArray(existingImages) &&
      existingImages.length > 0 &&
      images.length === 0
    ) {
      setImages(existingImages);
    }
  }, [existingImages]);

  if (!cameraPermission) {
    // camera permissions loading
    return <View />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text variant="titleLarge">Camera permissions required</Text>
        <Text variant="bodyMedium" style={styles.permissionMessage}>
          We need camera permissions to take photos of the property.
        </Text>
        <Button onPress={requestPermission} mode="contained">
          Grant permission
        </Button>
      </View>
    );
  }

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

  const handleImagesChange = (nextImages: string[]) => {
    setImages(nextImages);
    if (onImagesChange) {
      onImagesChange(nextImages);
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        handleImagesChange([...images, photo.uri]);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const handleRemoveImage = (uri: string) => {
    const nextImages = images.filter((imageUri) => imageUri !== uri);
    handleImagesChange(nextImages);
    setPreviewImage(null);
  };

  const getFlashIcon = () => {
    if (flash === "off") return "flash-off";
    if (flash === "on") return "flash";
    return "flash-auto";
  };

  return (
    <View style={styles.container}>
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
                  {images.length} / {MIN_IMAGES}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFlash}
              >
                <Text style={styles.controlButtonText}>
                  {flash === "off" ? (
                    <IconButton icon={getFlashIcon()} size={24} />
                  ) : flash === "on" ? (
                    <IconButton icon={getFlashIcon()} size={24} />
                  ) : (
                    <IconButton icon={getFlashIcon()} size={24} />
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomOverlay}>
            <TouchableOpacity
              style={[styles.roundButton, styles.flipButton]}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.roundButtonText}>
                <IconButton icon="camera-flip" size={24} />
              </Text>
            </TouchableOpacity>

            <View style={styles.middleOverlay}>
              <View style={styles.zoomControls}>
                <TouchableOpacity
                  style={[
                    styles.zoomButton,
                    zoom === 0 && styles.zoomButtonActive,
                  ]}
                  onPress={() => handleZoomChange(0)}
                >
                  <Text
                    style={[
                      styles.zoomText,
                      zoom === 0 && styles.zoomTextActive,
                    ]}
                  >
                    1x
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.zoomButton,
                    zoom === 0.5 && styles.zoomButtonActive,
                  ]}
                  onPress={() => handleZoomChange(0.5)}
                >
                  <Text
                    style={[
                      styles.zoomText,
                      zoom === 0.5 && styles.zoomTextActive,
                    ]}
                  >
                    2x
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.zoomButton,
                    zoom === 1 && styles.zoomButtonActive,
                  ]}
                  onPress={() => handleZoomChange(1)}
                >
                  <Text
                    style={[
                      styles.zoomText,
                      zoom === 1 && styles.zoomTextActive,
                    ]}
                  >
                    3x
                  </Text>
                </TouchableOpacity>
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
          Captured photos
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
            images.length < MIN_IMAGES && styles.helperTextError,
          ]}
        >
          {images.length < MIN_IMAGES
            ? `Take at least ${MIN_IMAGES} photos to enable submit`
            : "You have selected enough photos to submit."}
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
              Tap outside to close • Swipe to delete
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Step5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  controlButtonText: {
    fontSize: 20,
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
  placeholderButton: {
    width: 56,
  },
  roundButtonText: {
    fontSize: 24,
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
  permissionContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionMessage: {
    textAlign: "center",
    marginVertical: 8,
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
