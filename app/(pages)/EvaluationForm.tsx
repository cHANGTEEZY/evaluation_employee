import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Button, ProgressBar, useTheme } from "react-native-paper";
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
} from "../../constants/schema";

import Step1 from "../../components/evaluation-form/Step1";
import Step2 from "../../components/evaluation-form/Step2";
import Step3 from "../../components/evaluation-form/Step3";
import Step4 from "../../components/evaluation-form/Step4";

const TOTAL_STEPS = 4;

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

const step3Fields: FieldPath<ValuationFormValues>[] = [];

const step4Fields: FieldPath<ValuationFormValues>[] = [];

const EvaluationForm = () => {
  const [currentStep, setCurrentStep] = useState(4);
  const [isValidating, setIsValidating] = useState(false);

  const theme = useTheme();
  const inset = useSafeAreaInsets();

  const form = useForm<ValuationFormValues>({
    // Type assertion needed due to Zod v4 + @hookform/resolvers compatibility
    resolver: zodResolver(valuationSchema) as Resolver<ValuationFormValues>,
    defaultValues: defaultValuationValues,
    mode: "onTouched",
  });

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

  const onSubmit: SubmitHandler<ValuationFormValues> = (data) => {
    console.log("Form Data:", JSON.stringify(data, null, 2));
    // TODO: Handle submission - send to API
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
        return <Step4 />;
      default:
        return null;
    }
  };

  const progress = currentStep / TOTAL_STEPS;

  return (
    <SafeAreaView
      edges={["left"]}
      style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}
    >
      <View style={[styles.container, { paddingTop: inset.top + 10 }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            Property Valuation Form
          </Text>

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
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
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
