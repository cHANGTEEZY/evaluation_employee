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
        {filters.map((filter) => {
          const backgroundColor = filter.selected
            ? theme.colors.onBackground
            : undefined;

          const contentColor = filter.selected
            ? theme.colors.onPrimary
            : theme.colors.onSurfaceVariant;

          return (
            <Chip
              key={filter.name}
              icon={filter.icon}
              onPress={filter.onPress}
              selected={filter.selected}
              showSelectedOverlay
              selectedColor={contentColor}
              style={[styles.chip, { backgroundColor: backgroundColor }]}
            >
              {filter.name}
            </Chip>
          );
        })}
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
    // marginRight is handled by 'gap' in scrollContent, so this is optional
    // marginRight: 4,
  },
});
