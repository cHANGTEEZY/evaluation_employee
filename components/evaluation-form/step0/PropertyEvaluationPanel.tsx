import React from "react";
import { View } from "react-native";
import { Chip, Divider, Text, useTheme } from "react-native-paper";
import type { PropertyEvaluationData } from "../../../lib/property-evaluation-api";
import { RISK_DISTANCE_THRESHOLD_KM } from "./constants";
import { EvalInfoCard, EvalListItem } from "./EvalInfoCard";
import { step0Styles as styles } from "./styles";

interface PropertyEvaluationPanelProps {
  evalData: PropertyEvaluationData;
}

function AutoRiskChips({
  evalData,
  labelColor,
}: {
  evalData: PropertyEvaluationData;
  labelColor: string;
}) {
  return (
    <View style={styles.autoRiskRow}>
      <Text
        variant="labelMedium"
        style={{ color: labelColor, marginBottom: 6 }}
      >
        Auto-detected risk factors (editable in Step 3):
      </Text>
      <View style={styles.chipRow}>
        {evalData.water?.type === "river" && (
          <Chip icon="waves" compact style={styles.riskChip}>
            Riverside
          </Chip>
        )}
        {evalData.transmissionline && (
          <Chip icon="transmission-tower" compact style={styles.riskChip}>
            High Tension
          </Chip>
        )}
        {evalData.heritage &&
          evalData.heritage.distance < RISK_DISTANCE_THRESHOLD_KM && (
            <Chip icon="castle" compact style={styles.riskChip}>
              Heritage Site
            </Chip>
          )}
        {evalData.disasters?.some(
          (d) =>
            d.disastertype === "Landslide" &&
            d.distance < RISK_DISTANCE_THRESHOLD_KM,
        ) && (
          <Chip icon="terrain" compact style={styles.riskChip}>
            Landslide Prone
          </Chip>
        )}
        {evalData.disasters?.some(
          (d) =>
            d.disastertype === "Flood" &&
            d.distance < RISK_DISTANCE_THRESHOLD_KM,
        ) && (
          <Chip icon="waves" compact style={styles.riskChip}>
            Flood Prone
          </Chip>
        )}
      </View>
    </View>
  );
}

export function PropertyEvaluationPanel({
  evalData,
}: PropertyEvaluationPanelProps) {
  const theme = useTheme();

  return (
    <View style={styles.evalSection}>
      <Text
        variant="titleMedium"
        style={[styles.evalSectionTitle, { color: theme.colors.primary }]}
      >
        Property Evaluation Data
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
      >
        Auto-fetched from GalliMaps (read-only)
      </Text>

      {evalData.newward && (
        <EvalInfoCard title="Ward Information">
          <EvalListItem
            title="Province"
            description={evalData.newward.state}
            icon="map-marker-radius"
          />
          <Divider />
          <EvalListItem
            title="District"
            description={evalData.newward.district}
            icon="office-building"
          />
          <Divider />
          <EvalListItem
            title="Municipality / VDC"
            description={`${evalData.newward["municipality/vdc"]} (${evalData.newward["municipality/vdc_type"]})`}
            icon="city"
          />
          <Divider />
          <EvalListItem
            title="Ward"
            description={String(evalData.newward.ward)}
            icon="numeric"
          />
        </EvalInfoCard>
      )}

      {evalData.oldward && (
        <EvalInfoCard title="Old Ward Information">
          <EvalListItem
            title="District"
            description={evalData.oldward.district}
            icon="office-building"
          />
          <Divider />
          <EvalListItem
            title="Zone"
            description={evalData.oldward.zone}
            icon="earth"
          />
          <Divider />
          <EvalListItem
            title="VDC"
            description={evalData.oldward.vdc}
            icon="city-variant"
          />
          <Divider />
          <EvalListItem
            title="Ward"
            description={String(evalData.oldward.ward)}
            icon="numeric"
          />
        </EvalInfoCard>
      )}

      {evalData.conservation_area && (
        <EvalInfoCard title="Conservation Area">
          <EvalListItem
            title={evalData.conservation_area.name.replace(/_/g, " ")}
            description={`Distance: ${evalData.conservation_area.distance.toFixed(2)} km`}
            icon="pine-tree"
            titleNumberOfLines={2}
          />
        </EvalInfoCard>
      )}

      {evalData.heritage && (
        <EvalInfoCard title="Heritage Site">
          <EvalListItem
            title={evalData.heritage.name}
            description={`Distance: ${evalData.heritage.distance.toFixed(4)} km`}
            icon="castle"
            titleNumberOfLines={2}
          />
        </EvalInfoCard>
      )}

      {evalData.disasters && evalData.disasters.length > 0 && (
        <EvalInfoCard title="Nearby Disasters">
          {evalData.disasters.map((d, idx) => (
            <React.Fragment key={`disaster-card-${idx}`}>
              {idx > 0 && <Divider />}
              <EvalListItem
                title={d.disastertype}
                description={[
                  d.streetaddress?.trim() &&
                    `Location: ${d.streetaddress.trim()}`,
                  `Date: ${d.incidentOn}`,
                  `Distance: ${d.distance.toFixed(2)} km`,
                ]
                  .filter(Boolean)
                  .join("\n")}
                icon={d.disastertype === "Flood" ? "waves" : "terrain"}
                descriptionNumberOfLines={4}
              />
            </React.Fragment>
          ))}
        </EvalInfoCard>
      )}

      {evalData.water && (
        <EvalInfoCard title="Water Body">
          <EvalListItem
            title={evalData.water.name || evalData.water.type}
            description={[
              `Type: ${evalData.water.type}`,
              evalData.water.distance != null &&
                `Distance: ${evalData.water.distance.toFixed(0)} m`,
              evalData.water.bridge && `Bridge: ${evalData.water.bridge}`,
              evalData.water.tunnel && `Tunnel: ${evalData.water.tunnel}`,
            ]
              .filter(Boolean)
              .join("\n")}
            icon="water"
            descriptionNumberOfLines={5}
            titleNumberOfLines={2}
          />
        </EvalInfoCard>
      )}

      {evalData.transmissionline && (
        <EvalInfoCard title="Transmission Line">
          <EvalListItem
            title="Power Line"
            description={[
              evalData.transmissionline.distance != null &&
                `Distance: ${evalData.transmissionline.distance.toFixed(0)} m`,
              evalData.transmissionline.cables &&
                `Cables: ${evalData.transmissionline.cables}`,
              evalData.transmissionline.circuits &&
                `Circuits: ${evalData.transmissionline.circuits}`,
              evalData.transmissionline.voltage &&
                `Voltage: ${evalData.transmissionline.voltage}`,
              evalData.transmissionline.power &&
                `Power: ${evalData.transmissionline.power}`,
            ]
              .filter(Boolean)
              .join("\n")}
            icon="transmission-tower"
            descriptionNumberOfLines={6}
          />
        </EvalInfoCard>
      )}

      {evalData.worldheritage && (
        <EvalInfoCard title="World Heritage">
          <EvalListItem
            title={evalData.worldheritage.name}
            description={`Distance: ${evalData.worldheritage.distance.toFixed(4)} km`}
            icon="bank"
            titleNumberOfLines={2}
          />
        </EvalInfoCard>
      )}

      <AutoRiskChips
        evalData={evalData}
        labelColor={theme.colors.onSurfaceVariant}
      />
    </View>
  );
}
