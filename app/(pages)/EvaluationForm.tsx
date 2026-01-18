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
} from "../../lib/schema";
import { useRouter, useLocalSearchParams } from "expo-router";

import Step1 from "../../components/evaluation-form/Step1";
import Step2 from "../../components/evaluation-form/Step2";
import Step3 from "../../components/evaluation-form/Step3";
import Step4 from "../../components/evaluation-form/Step4";
import Step5 from "../../components/evaluation-form/Step5";
import { goBack } from "expo-router/build/global-state/routing";

const TOTAL_STEPS = 5;

const stepTitles: Record<number, string> = {
  1: "Basic Details",
  2: "Property Details",
  3: "Building & Documents",
  4: "Site Plan",
};

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

const step4Fields: FieldPath<ValuationFormValues>[] = ["site_plan_drawing"];

const step5Fields: FieldPath<ValuationFormValues>[] = [];

const EvaluationForm = () => {
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = mode === "edit" && id;

  const [currentStep, setCurrentStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [drawingSaved, setDrawingSaved] = useState(false);

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

  const getFieldsForStep = (step: number): FieldPath<ValuationFormValues>[] => {
    switch (step) {
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

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prevStep) => prevStep - 1);
    }
  };

  const onSubmit: SubmitHandler<ValuationFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      console.log("Form Data:", JSON.stringify(data, null, 2));

      if (isEditMode && id) {
        // Update existing valuation
        await updateValuation(id, data);
        await updateValuationStatus(id, "pending", "pending");
        console.log("Valuation updated with ID:", id);

        Alert.alert("Success", "Valuation has been updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        // Create new valuation
        const valuationId = await insertValuation(data);
        console.log("Valuation saved with ID:", valuationId);

        // Update status to pending
        await updateValuationStatus(valuationId, "pending", "pending");

        Alert.alert("Success", "Valuation has been saved successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error saving valuation:", error);
      Alert.alert("Error", "Failed to save valuation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={[styles.stepText, { color: theme.colors.onSurface }]}>
              Step {currentStep} of {TOTAL_STEPS}
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
            disabled={currentStep === 1}
            style={styles.button}
            icon="arrow-left"
          >
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
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
    padding: 16,
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
