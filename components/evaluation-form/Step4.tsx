import { StyleSheet, View, Alert, Image } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Button, Text, useTheme } from "react-native-paper";
import ViewShot from "react-native-view-shot";
import { File, Paths } from "expo-file-system";
import { useFormContext } from "react-hook-form";
import DrawingCanvas, { DrawingCanvasRef } from "../DrawingCanvas";

type Step4Props = {
  onDrawingSaved?: (uri: string) => void;
};

const Step4 = ({ onDrawingSaved }: Step4Props) => {
  const form = useFormContext();
  const existingDrawing = form.watch("site_plan_drawing");

  const [drawnPaths, setDrawnPaths] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(
    existingDrawing || null,
  );
  const viewShotRef = useRef<ViewShot>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const theme = useTheme();

  // Load existing drawing on mount
  useEffect(() => {
    if (existingDrawing) {
      setSavedUri(existingDrawing);
    }
  }, [existingDrawing]);

  const getCompletedPath = (paths: any[]) => {
    setDrawnPaths(paths);
  };

  const handleSaveDrawing = async () => {
    if (!viewShotRef.current) return;

    if (drawnPaths.length === 0) {
      Alert.alert("No Drawing", "Please draw something before saving.");
      return;
    }

    try {
      setIsSaving(true);

      // Capture the drawing as PNG
      const capturedUri = await viewShotRef.current.capture?.();

      if (capturedUri) {
        // Generate unique filename and save to document directory
        const fileName = `site_plan_${Date.now()}.png`;
        const destFile = new File(Paths.document, fileName);
        const sourceFile = new File(capturedUri);

        // Copy the captured file to permanent location
        await sourceFile.copy(destFile);

        const destUri = destFile.uri;
        setSavedUri(destUri);
        onDrawingSaved?.(destUri);

        Alert.alert("Success", "Drawing saved successfully!");
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
      Alert.alert("Error", "Failed to save drawing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDrawing = () => {
    Alert.alert(
      "Clear Drawing?",
      "This will remove all your drawings. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            // Clear the canvas via ref
            canvasRef.current?.clear();
            setDrawnPaths([]);
            setSavedUri(null);
            // Also clear from form
            form.setValue("site_plan_drawing", "");
          },
        },
      ],
    );
  };

  // If we have a saved drawing and no new paths, show the saved image
  const showSavedPreview = savedUri && drawnPaths.length === 0;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Draw Site Plan
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}
      >
        Use your finger to draw the site plan. Save when complete.
      </Text>

      {showSavedPreview ? (
        // Show saved drawing preview
        <View style={styles.canvasContainer}>
          <Image
            source={{ uri: savedUri }}
            style={styles.savedImage}
            resizeMode="contain"
          />
          <View
            style={[
              styles.savedOverlay,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text style={{ color: theme.colors.onPrimaryContainer }}>
              ✓ Saved drawing - Draw to create new
            </Text>
          </View>
        </View>
      ) : (
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
          style={styles.canvasContainer}
        >
          <DrawingCanvas ref={canvasRef} getCompletedPath={getCompletedPath} />
        </ViewShot>
      )}

      {savedUri && drawnPaths.length > 0 && (
        <View
          style={[
            styles.savedIndicator,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onPrimaryContainer }}>
            ✓ New drawing ready to save
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleClearDrawing}
          disabled={drawnPaths.length === 0 && !savedUri}
          style={styles.button}
          icon="eraser"
        >
          Clear
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveDrawing}
          loading={isSaving}
          disabled={isSaving || drawnPaths.length === 0}
          style={styles.button}
          icon="content-save"
        >
          {savedUri ? "Resave" : "Save Drawing"}
        </Button>
      </View>
    </View>
  );
};

export default Step4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  helper: {
    marginBottom: 12,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  savedImage: {
    flex: 1,
    width: "100%",
  },
  savedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    alignItems: "center",
  },
  savedIndicator: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
  },
});
