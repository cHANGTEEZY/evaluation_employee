import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  Button,
  ProgressBar,
  useTheme,
  ActivityIndicator,
  IconButton,
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
import {
  generateClientRefNumber,
} from "../../lib/ref-number";
import { useAuthSession } from "../../lib/auth-store";

const TOTAL_STEPS = 6;

const stepTitles: Record<number, string> = {
  0: "Property Location",
  1: "Basic Details",
  2: "Property Details",
  3: "Building & Documents",
  4: "Site Plan & Payment",
  5: "Property Images",
};

// Fields to validate for each step
const step0Fields: FieldPath<ValuationFormValues>[] = ["latitude", "longitude"];

// Fields to validate for each step (matching actual schema fields)
const step1Fields: FieldPath<ValuationFormValues>[] = [
  "valuation_date",
  "branch",
  "client_name",
  "contact_number",
  "client_address_nagrita",
  "owner_of_property",
  "property_address_deed",
  "present_property_address",
  "district",
  "valuation_for",
];

const step2Fields: FieldPath<ValuationFormValues>[] = [
  "property_type",
  "property_ownership_type",
  "ownership_transferred_through",
  "hold_type",
  "road_type",
  "access_road_direction",
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
  const { user } = useAuthSession();

  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [drawingSaved, setDrawingSaved] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const theme = useTheme();
  const inset = useSafeAreaInsets();
  const router = useRouter();

  const form = useForm<ValuationFormValues>({
    // Type assertion needed due to Zod v4 + @hookform/resolvers compatibility
    resolver: zodResolver(valuationSchema) as Resolver<ValuationFormValues>,
    defaultValues: defaultValuationValues,
    mode: "onTouched",
  });

  // Load existing valuation data in edit mode
  useEffect(() => {
    const loadValuation = async () => {
      if (isEditMode && id) {
        try {
          setIsLoading(true as any);
          const data = await getValuationById(id);
          if (data) {
            const formValues = rowToFormValues(data);
            form.reset(formValues as ValuationFormValues);

            // Load payment receipt only if the file still exists (app files folder)
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

  // Generate ref_no from ClientName_First3letter_district_PlotNo when client_name, district, plot_no are available
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
      try {
        const base = generateClientRefNumber(name, dist, plot);
        const existing = await getRefNosStartingWith(base, id ?? undefined);
        let candidate = base;
        let n = 2;
        while (existing.includes(candidate)) {
          candidate = `${base}_${n}`;
          n += 1;
        }
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
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prevStep) => prevStep - 1);
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
      } else {
        // Create new valuation (include employee ID so we know who synced to Google)
        valuationId = await insertValuation(data, {
          employeeId: user?.id ?? undefined,
        });
        console.log("Valuation saved with ID:", valuationId);

        // Update status to pending
        await updateValuationStatus(valuationId, "pending", "pending");
      }

      // Generate PDF receipt if site_charge is provided
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

          const pdfUri = await generatePaymentReceipt(valuationId, receiptData);
          console.log("PDF receipt generated:", pdfUri);

          // Receipt is saved in app files (visible in Edit). Offer to open/share so user can also "Save to Files" if they want a copy on device.
          Alert.alert(
            "Success",
            isEditMode
              ? "Valuation updated. Receipt saved in app – open it from Edit, or share to save a copy to Files."
              : "Valuation saved. Receipt saved in app – open it from Edit, or share to save a copy to Files.",
            [
              {
                text: "Open / Save Receipt",
                onPress: async () => {
                  try {
                    await sharePaymentReceipt(pdfUri);
                  } catch (shareError) {
                    console.error("Error sharing receipt:", shareError);
                  }
                  router.back();
                },
              },
              {
                text: "Done",
                onPress: () => router.back(),
              },
            ],
          );
        } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          // Still show success for the valuation save
          Alert.alert(
            "Partial Success",
            "Valuation saved but receipt generation failed.",
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ],
          );
        }
      } else {
        Alert.alert(
          "Success",
          isEditMode
            ? "Valuation has been updated successfully!"
            : "Valuation has been saved successfully!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ],
        );
      }
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
              onPress={form.handleSubmit(onSubmit)}
              style={styles.button}
              icon="check"
              contentStyle={styles.buttonContent}
              loading={isSubmitting}
              disabled={isSubmitting || propertyImages.length < 5}
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
