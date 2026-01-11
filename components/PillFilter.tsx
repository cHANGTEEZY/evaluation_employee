import { StyleSheet, View, ScrollView } from "react-native";
import React from "react";
import { Chip, useTheme } from "react-native-paper";

type Filter = {
  icon: string;
  name: string;
  onPress?: () => void;
  selected?: boolean;
};

const PillFilter = ({ filters }: { filters: Filter[] }) => {
  const theme = useTheme();

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter: Filter) => (
          <Chip
            key={filter.name}
            icon={filter.icon}
            onPress={filter?.onPress}
            selected={filter.selected}
            showSelectedOverlay
            style={[
              styles.chip,
              filter.selected && {
                backgroundColor: theme.colors.secondaryContainer,
              },
            ]}
            textStyle={
              filter.selected
                ? { color: theme.colors.onSecondaryContainer }
                : undefined
            }
          >
            {filter.name}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
};

export default PillFilter;

const styles = StyleSheet.create({
  filterContainer: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
});
