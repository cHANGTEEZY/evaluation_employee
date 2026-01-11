import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";

const EvaluationDetail = () => {
  const { evaluation } = useLocalSearchParams<{ evaluation: string }>();

  console.log(JSON.parse(evaluation));

  return (
    <View>
      <Text>evaluation: {evaluation}</Text>
    </View>
  );
};

export default EvaluationDetail;

const styles = StyleSheet.create({});
