import type { UseFormSetValue } from "react-hook-form";
import type { ValuationFormValues } from "../../../constants/form-schema";
import type { PropertyEvaluationData } from "../../../lib/property-evaluation-api";
import { RISK_DISTANCE_THRESHOLD_KM } from "./constants";

export function applyEvalDataToForm(
  data: PropertyEvaluationData,
  setValue: UseFormSetValue<ValuationFormValues>,
): void {
  setValue("property_evaluation_data", JSON.stringify(data), {
    shouldDirty: true,
  });
  if (data.water?.type === "river") {
    setValue("river_side", true, { shouldDirty: true });
  }
  if (data.transmissionline) {
    setValue("high_tension_area", true, { shouldDirty: true });
  }
  if (
    data.heritage &&
    data.heritage.distance < RISK_DISTANCE_THRESHOLD_KM
  ) {
    setValue("heritage_memorial_site", true, { shouldDirty: true });
  }
  const hasNearbyLandslide = data.disasters?.some(
    (d) =>
      d.disastertype === "Landslide" &&
      d.distance < RISK_DISTANCE_THRESHOLD_KM,
  );
  if (hasNearbyLandslide) {
    setValue("landslide_prone_area", true, { shouldDirty: true });
  }
  const hasNearbyFlood = data.disasters?.some(
    (d) =>
      d.disastertype === "Flood" &&
      d.distance < RISK_DISTANCE_THRESHOLD_KM,
  );
  if (hasNearbyFlood) {
    setValue("flood_prone_area", true, { shouldDirty: true });
  }
}
