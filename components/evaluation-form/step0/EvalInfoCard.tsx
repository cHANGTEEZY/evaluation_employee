import React from "react";
import { View } from "react-native";
import { List, Surface } from "react-native-paper";
import { step0Styles as styles } from "./styles";

interface EvalInfoCardProps {
  title: string;
  children: React.ReactNode;
}

export function EvalInfoCard({ title, children }: EvalInfoCardProps) {
  return (
    <Surface style={styles.evalCard} elevation={1}>
      <View style={styles.evalCardInner}>
        <List.Subheader style={styles.cardHeader}>{title}</List.Subheader>
        {children}
      </View>
    </Surface>
  );
}

interface EvalListItemProps {
  title: string;
  description: string;
  icon: string;
  descriptionNumberOfLines?: number;
  titleNumberOfLines?: number;
}

export function EvalListItem({
  title,
  description,
  icon,
  descriptionNumberOfLines,
  titleNumberOfLines,
}: EvalListItemProps) {
  return (
    <List.Item
      title={title}
      description={description}
      left={(props) => <List.Icon {...props} icon={icon} />}
      titleStyle={styles.readOnlyTitle}
      descriptionStyle={styles.readOnlyDesc}
      descriptionNumberOfLines={descriptionNumberOfLines}
      titleNumberOfLines={titleNumberOfLines}
    />
  );
}
