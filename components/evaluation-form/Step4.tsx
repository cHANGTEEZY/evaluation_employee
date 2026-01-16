import { StyleSheet, View, Alert } from "react-native";
import React, { useState, useRef } from "react";
import { Button, Text, useTheme } from "react-native-paper";
import ViewShot from "react-native-view-shot";
import { File, Paths } from "expo-file-system";
import DrawingCanvas from "../DrawingCanvas";

type Step4Props = {
  onDrawingSaved?: (uri: string) => void;
};

const Step4 = ({ onDrawingSaved }: Step4Props) => {
  const [drawnPaths, setDrawnPaths] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const theme = useTheme();

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
            setDrawnPaths([]);
            setSavedUri(null);
          },
        },
      ]
    );
  };

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

      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 1 }}
        style={styles.canvasContainer}
      >
        <DrawingCanvas getCompletedPath={getCompletedPath} />
      </ViewShot>

      {savedUri && (
        <View
          style={[
            styles.savedIndicator,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onPrimaryContainer }}>
            ✓ Drawing saved
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleClearDrawing}
          disabled={drawnPaths.length === 0}
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
