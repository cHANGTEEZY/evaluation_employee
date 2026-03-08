import { StyleSheet, View, Alert, Image, ScrollView } from "react-native";
import React, { useEffect, useRef, useState } from "react";
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
import PropertyPlotter, {
  type PlotterData,
  type PropertyPlotterRef,
} from "../PropertyPlotter";
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
  const existingPlotterData = form.watch("site_plan_plotter_data");
  const pendingDue = form.watch("payment_pending_due");

  const [paymentType, setPaymentType] = useState<"cash" | "online">("cash");
  const [plotterData, setPlotterData] = useState<PlotterData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(
    existingDrawing || null,
  );

  const viewShotRef = useRef<ViewShot>(null);
  const plotterRef = useRef<PropertyPlotterRef>(null);
  const hasLoadedInitial = useRef(false);

  const theme = useTheme();

  // Load existing drawing and plotter data on mount
  useEffect(() => {
    if (existingDrawing) setSavedUri(existingDrawing);
  }, [existingDrawing]);

  // Load plotter data into the canvas once the component is ready
  useEffect(() => {
    if (hasLoadedInitial.current) return;
    if (!existingPlotterData || !plotterRef.current) return;
    try {
      const parsed: PlotterData = JSON.parse(existingPlotterData);
      plotterRef.current.loadData(parsed);
      setPlotterData(parsed);
      hasLoadedInitial.current = true;
    } catch {
      // corrupted JSON — ignore
    }
  });

  // Handle payment type change
  const handlePaymentTypeChange = (value: string) => {
    setPaymentType(value as "cash" | "online");
    if (value === "cash") {
      form.setValue("payment_online", undefined);
      form.setValue("payment_online_mode", undefined);
    } else {
      form.setValue("payment_cash", undefined);
    }
  };

  const hasPoints = (plotterData?.points.length ?? 0) > 0;

  const handleSaveDrawing = async () => {
    if (!viewShotRef.current) return;

    if (!hasPoints) {
      Alert.alert(
        "No Drawing",
        "Please place at least one point before saving.",
      );
      return;
    }

    try {
      setIsSaving(true);

      const capturedUri = await viewShotRef.current.capture?.();

      if (capturedUri) {
        const fileName = `site_plan_${Date.now()}.png`;
        const destFile = new File(Paths.document, fileName);
        const sourceFile = new File(capturedUri);
        await sourceFile.copy(destFile);
        const destUri = destFile.uri;

        setSavedUri(destUri);
        form.setValue("site_plan_drawing", destUri, { shouldDirty: true });
        onDrawingSaved?.(destUri);
      }

      // Save plotter data (for resume editing)
      if (plotterData) {
        form.setValue("site_plan_plotter_data", JSON.stringify(plotterData), {
          shouldDirty: true,
        });
      }

      Alert.alert("Success", "Site plan saved successfully!");
    } catch (error) {
      console.error("Error saving site plan:", error);
      Alert.alert("Error", "Failed to save site plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDrawing = () => {
    Alert.alert(
      "Clear Site Plan?",
      "This will remove all points and lines. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            plotterRef.current?.clear();
            setPlotterData(null);
            setSavedUri(null);
            form.setValue("site_plan_drawing", "");
            form.setValue("site_plan_plotter_data", "");
          },
        },
      ],
    );
  };

  // Show image-only preview only when we have a saved image but no plotter data to edit.
  // When reopening a draft with plotter_data, show the plotter so the user can edit.
  const showSavedPreview =
    savedUri && !hasPoints && !existingPlotterData;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
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
          { value: "cash", label: "Cash", icon: "cash" },
          { value: "online", label: "Online", icon: "cellphone" },
        ]}
        style={styles.segmentedButtons}
      />

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

      {(pendingDue ?? 0) > 0 && (
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

      <FormInput
        name="site_plan_note"
        label="Remarks"
        multiline
        numberOfLines={3}
      />

      <Divider style={styles.divider} />

      {/* Site Plan Drawing Section */}
      <Text variant="titleMedium" style={styles.title}>
        Draw Site Plan
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}
      >
        Tap to place points and build the site plan boundary. Tap the first
        point (↩) to close the polygon. Tap any edge to enter its distance.
      </Text>

      {showSavedPreview ? (
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
              ✓ Saved site plan — clear to redraw
            </Text>
          </View>
        </View>
      ) : (
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
          style={styles.canvasContainer}
        >
          <PropertyPlotter ref={plotterRef} onDataChange={setPlotterData} />
        </ViewShot>
      )}

      {!!savedUri && hasPoints && (
        <View
          style={[
            styles.savedIndicator,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text style={{ color: theme.colors.onPrimaryContainer }}>
            ✓ Unsaved changes — press Save to update
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleClearDrawing}
          disabled={!hasPoints && !savedUri}
          style={styles.button}
          icon="eraser"
        >
          Clear
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveDrawing}
          loading={isSaving}
          disabled={isSaving || !hasPoints}
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
    height: 340,
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
