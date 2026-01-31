import { StyleSheet, View, Alert, Image, ScrollView } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Text,
  useTheme,
  Divider,
  SegmentedButtons,
} from "react-native-paper";
import ViewShot from "react-native-view-shot";
import { File, Paths } from "expo-file-system";
import { useFormContext } from "react-hook-form";
import DrawingCanvas, { DrawingCanvasRef } from "../DrawingCanvas";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

type Step4Props = {
  onDrawingSaved?: (uri: string) => void;
};

const onlinePaymentModeOptions = [
  { label: "eSewa", value: "esewa" },
  { label: "Khalti", value: "khalti" },
  { label: "Mobile Banking", value: "mobile_banking" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "FonePay", value: "fonepay" },
  { label: "Other", value: "other" },
];

const Step4 = ({ onDrawingSaved }: Step4Props) => {
  const form = useFormContext();
  const existingDrawing = form.watch("site_plan_drawing");
  const pendingDue = form.watch("payment_pending_due");

  const [paymentType, setPaymentType] = useState<"cash" | "online">("cash");
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

  // Handle payment type change
  const handlePaymentTypeChange = (value: string) => {
    setPaymentType(value as "cash" | "online");
    // Clear the other payment field when switching
    if (value === "cash") {
      form.setValue("payment_online", undefined);
      form.setValue("payment_online_mode", undefined);
    } else {
      form.setValue("payment_cash", undefined);
    }
  };

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Payment & Details Section - FIRST */}
      <Text variant="titleMedium" style={styles.title}>
        Payment & Details
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}
      >
        Enter payment details. A PDF receipt will be generated upon submission.
      </Text>

      <FormInput
        name="site_charge"
        label="Site Charge (Total Amount)"
        keyboardType="decimal-pad"
      />

      {/* Payment Type Selection */}
      <Text
        variant="labelMedium"
        style={[styles.paymentTypeLabel, { color: theme.colors.onSurface }]}
      >
        Payment Method
      </Text>
      <SegmentedButtons
        value={paymentType}
        onValueChange={handlePaymentTypeChange}
        buttons={[
          {
            value: "cash",
            label: "Cash",
            icon: "cash",
          },
          {
            value: "online",
            label: "Online",
            icon: "cellphone",
          },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Conditional Payment Fields */}
      {paymentType === "cash" ? (
        <FormInput
          name="payment_cash"
          label="Cash Payment Amount"
          keyboardType="decimal-pad"
        />
      ) : (
        <>
          <FormSelect
            name="payment_online_mode"
            label="Online Payment Mode"
            options={onlinePaymentModeOptions}
          />
          <FormInput
            name="payment_online"
            label="Online Payment Amount"
            keyboardType="decimal-pad"
          />
        </>
      )}

      <FormInput
        name="payment_pending_due"
        label="Pending Due (if any)"
        keyboardType="decimal-pad"
      />

      {/* Pending due notification indicator */}
      {pendingDue && pendingDue > 0 && (
        <View
          style={[
            styles.pendingNotice,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onErrorContainer }}>
            ⚠️ Admin will be notified about pending due of Rs. {pendingDue}
          </Text>
        </View>
      )}

      {/* Remarks Field */}
      <FormInput
        name="site_plan_note"
        label="Remarks"
        multiline
        numberOfLines={3}
      />

      {/* Divider between Payment and Site Plan */}
      <Divider style={styles.divider} />

      {/* Site Plan Drawing Section - SECOND */}
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
    </ScrollView>
  );
};

export default Step4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  helper: {
    marginBottom: 12,
  },
  paymentTypeLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  canvasContainer: {
    height: 300,
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
  divider: {
    marginVertical: 24,
  },
  pendingNotice: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
  },
});
