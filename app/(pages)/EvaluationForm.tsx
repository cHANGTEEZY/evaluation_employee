import {
  StyleSheet,
  Text as RNText,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import {
  Button,
  ProgressBar,
  useTheme,
  ActivityIndicator,
  IconButton,
  Text,
} from "react-native-paper";
import {
  FormProvider,
  useForm,
  FieldPath,
  SubmitHandler,
  Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  valuationSchema,
  ValuationFormValues,
  defaultValuationValues,
  cleanValuationValues,
} from "../../constants/form-schema";
import {
  insertValuation,
  updateValuationStatus,
  updateValuation,
  getValuationById,
  rowToFormValues,
  getPaymentsByValuationId,
  getRefNosStartingWith,
} from "../../lib/schema";
import { AuthenticationError } from "../../lib/auth-guard";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  generatePaymentReceipt,
  sharePaymentReceipt,
  receiptFileExists,
  PaymentReceiptData,
} from "../../lib/pdf-generator";

import Step0 from "../../components/evaluation-form/Step0";
import Step1 from "../../components/evaluation-form/Step1";
import Step2 from "../../components/evaluation-form/Step2";
import Step3 from "../../components/evaluation-form/Step3";
import Step4 from "../../components/evaluation-form/Step4";
import Step5 from "../../components/evaluation-form/Step5";
import { goBack } from "expo-router/build/global-state/routing";
import { generateClientRefNumber, generateShortId } from "../../lib/ref-number";
import { useAuthSession } from "../../lib/auth-store";
import { saveDraft, loadDraft, clearDraft } from "../../lib/valuation-drafts";
import { toast } from "../../lib/toast";
import { processQueue } from "../../lib/sync";

// Full-screen overlay with centered loader when submitting
function SubmitOverlay({ visible }: { visible: boolean }) {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1
    );
  }, [visible]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.loaderCard,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.onSurface,
            },
          ]}
        >
          <View style={styles.loaderWrap}>
            <Animated.View
              style={[
                styles.ring,
                ringStyle,
                {
                  borderTopColor: theme.colors.primary,
                  borderRightColor: theme.colors.primary + "40",
                },
              ]}
            />
            <View style={[styles.loaderInner, { backgroundColor: theme.colors.surface }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          </View>
          <Text
            variant="titleMedium"
            style={[styles.submitText, { color: theme.colors.onSurface }]}
          >
            Submitting…
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const TOTAL_STEPS = 6;

const stepTitles: Record<number, string> = {
  0: "Property Location",
  1: "Basic Details",
  2: "Property Details",
  3: "Building & Documents",
  4: "Site Plan & Payment",
  5: "Property Images",
};

const step0Fields: FieldPath<ValuationFormValues>[] = ["latitude", "longitude"];

const step1Fields: FieldPath<ValuationFormValues>[] = [
  "valuation_date",
  "branch",
  "client_name",
  "contact_number",
  "owner_of_property",
  "plot_no",
  "present_property_address",
  "district",
  "valuation_for",
];

const step2Fields: FieldPath<ValuationFormValues>[] = [
  "property_type",
  "hold_type",
  "road_type",
  "access_road_direction",
  "landslide_prone_area",
  "river_side",
  "high_tension_area",
  "canal_area",
  "watchlist_category",
  "heritage_memorial_site",
];

const step3Fields: FieldPath<ValuationFormValues>[] = [
  "building_type",
  "building_purpose",
];

const step4Fields: FieldPath<ValuationFormValues>[] = [
  "site_plan_drawing",
  "site_charge",
];

const step5Fields: FieldPath<ValuationFormValues>[] = [];

const EvaluationForm = () => {
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = mode === "edit" && id;
  const { user, sessionInfo } = useAuthSession();

  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [drawingSaved, setDrawingSaved] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  /** When user saves a draft (new form), we create/update a DB row and keep its id so they can come back to it from the evaluations list. */
  const [draftValuationId, setDraftValuationId] = useState<string | null>(null);

  const theme = useTheme();
  const inset = useSafeAreaInsets();
  const router = useRouter();

  const USE_DEMO_DEFAULTS = true;

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationSchema) as Resolver<ValuationFormValues>,
    defaultValues: USE_DEMO_DEFAULTS
      ? defaultValuationValues
      : cleanValuationValues,
    mode: "onTouched",
  });

  useEffect(() => {
    const maybeLoadDraft = async () => {
      if (isEditMode) return;
      const draft = await loadDraft();
      if (!draft) return;

      // Alert.alert(
      //   "Restore draft?",
      //   "A saved draft was found for this valuation. Do you want to restore it?",
      //   [
      //     {
      //       text: "Discard",
      //       style: "destructive",
      //       onPress: () => {
      //         clearDraft().catch(() => {});
      //       },
      //     },
      //     {
      //       text: "Restore",
      //       onPress: () => {
      //         form.reset(draft.values);
      //         setCurrentStep(draft.currentStep ?? 0);
      //         if (draft.valuationId) setDraftValuationId(draft.valuationId);
      //       },
      //     },
      //   ],
      // );
    };

    void maybeLoadDraft();
  }, [isEditMode]);

  useEffect(() => {
    const loadValuation = async () => {
      if (isEditMode && id) {
        try {
          setIsLoading(true as any);
          const data = await getValuationById(id);
          if (data) {
            const formValues = rowToFormValues(data);
            form.reset(formValues as ValuationFormValues);

            const images = formValues?.property_images;
            setPropertyImages(Array.isArray(images) ? images : []);

            const payments = await getPaymentsByValuationId(id);
            if (
              payments &&
              payments.length > 0 &&
              payments[0].pdf_uri &&
              (await receiptFileExists(payments[0].pdf_uri))
            ) {
              setReceiptUri(payments[0].pdf_uri);
            }
          }
        } catch (error) {
          console.error("Error loading valuation:", error);
          Alert.alert("Error", "Failed to load valuation data");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadValuation();
  }, [id, isEditMode]);

  const clientName = form.watch("client_name");
  const district = form.watch("district");
  const plotNo = form.watch("plot_no");

  useEffect(() => {
    const generateRefNo = async () => {
      if (isEditMode) return;
      const name = (clientName ?? "").trim();
      const dist = (district ?? "").trim();
      const plot = plotNo != null && plotNo !== "" ? String(plotNo).trim() : "";
      if (!name || !dist || !plot) return;
      const currentRef = form.getValues("ref_no") ?? "";
      const base = generateClientRefNumber(name, dist, plot);
      // If we already have a ref for this base (e.g. from a previous run), keep it to avoid changing ref on every re-render
      if (currentRef && currentRef.startsWith(base)) return;
      try {
        const existing = await getRefNosStartingWith(base, id ?? undefined);
        let candidate = base;
        let n = 2;
        while (existing.includes(candidate)) {
          candidate = `${base}_${n}`;
          n += 1;
        }
        // Append unique suffix so ref is unique in Google Sheets (same client/district/plot on different devices/syncs)
        candidate = `${candidate}_${generateShortId()}`;
        form.setValue("ref_no", candidate);
      } catch (error) {
        console.error("Error generating ref_no:", error);
      }
    };
    generateRefNo();
  }, [isEditMode, clientName, district, plotNo, id]);

  const getFieldsForStep = (step: number): FieldPath<ValuationFormValues>[] => {
    switch (step) {
      case 0:
        return step0Fields;
      case 1:
        return step1Fields;
      case 2:
        return step2Fields;
      case 3:
        return step3Fields;
      case 4:
        return step4Fields;
      case 5:
        return step5Fields;
      default:
        return [];
    }
  };

  const getStepForField = (field: FieldPath<ValuationFormValues>): number => {
    for (let step = 0; step < TOTAL_STEPS; step++) {
      if (getFieldsForStep(step).includes(field)) return step;
    }
    return 0;
  };

  // Form values watched so we can compute if submit is allowed (same criteria as bottom Submit)
  const formValues = form.watch();
  const canSubmit = useMemo(() => {
    const parsed = valuationSchema.safeParse(formValues);
    return parsed.success && propertyImages.length >= 4;
  }, [formValues, propertyImages.length]);

  const handleSubmitWithValidation = () => {
    form.handleSubmit(onSubmit, (errors) => {
      const firstErrorKey = Object.keys(errors)[0] as
        | FieldPath<ValuationFormValues>
        | undefined;
      const firstErrorObj = firstErrorKey
        ? (errors as Record<string, { message?: string }>)[firstErrorKey]
        : undefined;
      const firstError =
        firstErrorObj?.message ?? "Please complete required fields.";
      const stepWithError = firstErrorKey
        ? getStepForField(firstErrorKey)
        : currentStep;
      setCurrentStep(stepWithError);
      toast({
        title: "Cannot submit",
        message: firstError,
        preset: "error",
      });
    })();
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);

    if (fieldsToValidate.length > 0) {
      setIsValidating(true);
      const isValid = await form.trigger(fieldsToValidate);
      setIsValidating(false);

      if (!isValid) {
        return;
      }
    }

    if (currentStep < TOTAL_STEPS - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Save draft on step change
      const values = form.getValues();
      saveDraft(values, nextStep).catch(() => {});
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prevStep) => prevStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getValues();
      let savedId: string;

      if (isEditMode && id) {
        await updateValuation(id, values);
        savedId = id;
      } else if (draftValuationId) {
        await updateValuation(draftValuationId, values);
        savedId = draftValuationId;
      } else {
        savedId = await insertValuation(values, {
          employeeId: user?.id ?? undefined,
        });
        setDraftValuationId(savedId);
      }

      await saveDraft(values, currentStep, savedId);
      toast({
        title: "Draft saved",
        message: "You can continue later from Evaluations → Drafts.",
        preset: "done",
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      if (error instanceof AuthenticationError) {
        Alert.alert(
          "Authentication Required",
          "You must be logged in to save drafts. Please sign in and try again.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
        );
      } else {
        toast({
          title: "Draft save failed",
          message: "Please try again.",
          preset: "error",
        });
      }
    }
  };

  const handleViewReceipt = async () => {
    if (!receiptUri) return;
    try {
      const exists = await receiptFileExists(receiptUri);
      if (!exists) {
        Alert.alert(
          "Receipt not found",
          "The payment receipt PDF is no longer on this device. It may have been deleted or this valuation was opened on another device.",
        );
        return;
      }
      await sharePaymentReceipt(receiptUri);
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Could not open receipt");
    }
  };

  const onSubmit: SubmitHandler<ValuationFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      console.log("Form Data:", JSON.stringify(data, null, 2));

      let valuationId: string;

      if (isEditMode && id) {
        // Update existing valuation
        await updateValuation(id, data);
        await updateValuationStatus(id, "pending", "pending");
        valuationId = id;
        console.log("Valuation updated with ID:", id);
      } else if (draftValuationId) {
        // Submit from a previously saved draft: update that row and mark pending
        await updateValuation(draftValuationId, data);
        await updateValuationStatus(draftValuationId, "pending", "pending");
        valuationId = draftValuationId;
        console.log("Valuation submitted from draft ID:", draftValuationId);
      } else {
        // Create new valuation (include employee ID so we know who synced to Google)
        valuationId = await insertValuation(data, {
          employeeId: user?.id ?? undefined,
        });
        console.log("Valuation saved with ID:", valuationId);

        // Update status to pending
        await updateValuationStatus(valuationId, "pending", "pending");
      }

      // Clear any saved draft after a successful save
      await clearDraft().catch(() => {});
      setDraftValuationId(null);

      // Generate PDF receipt *before* sync so the payment row exists when we sync to Drive
      let pdfUri: string | null = null;
      if (data.site_charge && data.site_charge > 0) {
        try {
          const receiptData: PaymentReceiptData = {
            refNo: data.ref_no || "",
            clientName: data.client_name || "",
            valuationDate: data.valuation_date || new Date(),
            siteCharge: data.site_charge || 0,
            cashPayment: data.payment_cash || 0,
            onlinePayment: data.payment_online || 0,
            onlinePaymentMode: data.payment_online_mode,
            pendingDue: data.payment_pending_due || 0,
          };
          pdfUri = await generatePaymentReceipt(valuationId, receiptData);
          console.log("PDF receipt generated:", pdfUri);
        } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
        }
      }

      // Sync to backend (includes receipt if we just generated it)
      let syncResult: {
        synced: number;
        failed: number;
        errors: string[];
      } | null = null;
      if (sessionInfo?.token && user?.id) {
        try {
          syncResult = await processQueue(sessionInfo.token, user.id);
          if (syncResult.synced > 0) {
            toast({
              title: "Synced to server",
              message: "Valuation saved and sent to the server.",
              preset: "done",
            });
          } else if (syncResult.failed > 0 && syncResult.errors.length > 0) {
            toast({
              title: "Saved locally",
              message: `Sync failed: ${syncResult.errors[0]}. Use Sync tab to retry.`,
              preset: "error",
            });
          }
        } catch (syncErr) {
          console.error("Sync after submit failed:", syncErr);
          toast({
            title: "Saved locally",
            message: "Sync to server failed. Use Sync tab to retry.",
            preset: "error",
          });
        }
      }

      // Close form immediately; show toast (no blocking alert)
      if (pdfUri) {
        toast({
          title: "Saved",
          message:
            "Receipt saved. Open it from Evaluations → valuation → View receipt.",
          preset: "done",
        });
      } else if (data.site_charge && data.site_charge > 0) {
        toast({
          title: "Saved",
          message: "Valuation saved (receipt generation failed).",
          preset: "done",
        });
      } else {
        toast({
          title: "Saved",
          message: isEditMode ? "Valuation updated." : "Valuation saved.",
          preset: "done",
        });
      }
      router.back();
    } catch (error) {
      console.error("Error saving valuation:", error);

      // Handle authentication errors specifically
      if (error instanceof AuthenticationError) {
        Alert.alert(
          "Authentication Required",
          "You must be logged in to save evaluations. Please sign in and try again.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login"),
            },
          ],
        );
      } else {
        Alert.alert("Error", "Failed to save valuation. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step0 />;
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return (
          <Step4
            onDrawingSaved={(uri) => {
              form.setValue("site_plan_drawing", uri);
              setDrawingSaved(true);
            }}
          />
        );
      case 5:
        return (
          <Step5
            onImagesChange={(images) => {
              setPropertyImages(images);
              form.setValue("property_images", images);
            }}
          />
        );
      default:
        return null;
    }
  };

  const progress = currentStep / TOTAL_STEPS;

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["left"]}
        style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}
      >
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Loading valuation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["left"]}
      style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}
    >
      <SubmitOverlay visible={isSubmitting} />
      <View style={[styles.container, { paddingTop: inset.top + 10 }]}>
        <View style={styles.header}>
          {/* Header Row with Back Button and Title */}
          <View style={styles.headerRow}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={goBack}
              style={{ marginLeft: -8 }}
            />
            <Text
              style={[styles.title, { color: theme.colors.primary, flex: 1 }]}
              numberOfLines={1}
            >
              {isEditMode ? "Edit Valuation" : "Property Valuation Form"}
            </Text>
            <Button
              mode="contained"
              onPress={handleSubmitWithValidation}
              compact
              loading={isSubmitting}
              disabled={!canSubmit || isSubmitting}
              style={styles.headerSubmit}
              contentStyle={styles.headerSubmitContent}
            >
              Submit
            </Button>
            {receiptUri && (
              <IconButton
                icon="file-document-outline"
                size={24}
                onPress={handleViewReceipt}
                iconColor={theme.colors.primary}
                style={{ marginRight: -8 }}
              />
            )}
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={[styles.stepText, { color: theme.colors.onSurface }]}>
              Step {currentStep + 1} of {TOTAL_STEPS}
            </Text>
            <Text
              style={[
                styles.stepTitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {stepTitles[currentStep]}
            </Text>
          </View>

          {/* Progress Bar */}
          <ProgressBar
            progress={progress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>
        <FormProvider {...form}>
          {/* Form Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
            // keyboardVerticalOffset={100}
          >
            <View style={styles.formContent}>{renderStepContent()}</View>
          </KeyboardAvoidingView>
        </FormProvider>
        <View
          style={[
            styles.buttonContainer,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Button
            mode="outlined"
            onPress={handleBack}
            disabled={currentStep === 0}
            style={styles.button}
            icon="arrow-left"
          >
            Back
          </Button>

          <Button
            mode="outlined"
            onPress={handleSaveDraft}
            style={styles.button}
            icon="content-save"
          >
            Save Draft
          </Button>

          {currentStep < TOTAL_STEPS - 1 ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.button}
              icon="arrow-right"
              contentStyle={styles.buttonContent}
              loading={isValidating}
              disabled={isValidating}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmitWithValidation}
              style={styles.button}
              icon="check"
              contentStyle={styles.buttonContent}
              loading={isSubmitting}
              disabled={isSubmitting || propertyImages.length < 4}
            >
              Submit
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EvaluationForm;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderCard: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: "center",
    minWidth: 200,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  loaderWrap: {
    position: "relative",
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  loaderInner: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    marginTop: 20,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerSubmit: {
    marginRight: 4,
  },
  headerSubmitContent: {
    height: 36,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepTitle: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  keyboardView: {
    flex: 1,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 45,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row-reverse",
  },
});
