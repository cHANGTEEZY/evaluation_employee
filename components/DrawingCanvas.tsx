import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
interface PathData {
  d: string;
  color: string;
}

export default function DrawingCanvas({
  getCompletedPath,
}: {
  getCompletedPath: (image: any) => void;
}) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  // Call getCompletedPath when paths change (after render)
  useEffect(() => {
    getCompletedPath(paths);
  }, [paths]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((e) => {
      setCurrentPath(`M ${e.x} ${e.y}`);
    })
    .onUpdate((e) => {
      setCurrentPath((prev) => `${prev} L ${e.x} ${e.y}`);
    })
    .onEnd(() => {
      if (currentPath) {
        setPaths((prev) => [...prev, { d: currentPath, color: "black" }]);
        setCurrentPath("");
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container}>
        <Svg style={styles.canvas}>
          {/* Render completed paths */}
          {paths.map((path, i) => (
            <Path
              key={`path-${i}`}
              d={path.d}
              stroke={path.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {/* Render current path being drawn */}
          {currentPath && (
            <Path
              d={currentPath}
              stroke="black"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  canvas: {
    flex: 1,
  },
});
