import React, { useState, useEffect, forwardRef, useImperativeHandle, } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
interface PathData {
    d: string;
    color: string;
}
export interface DrawingCanvasRef {
    clear: () => void;
}
interface DrawingCanvasProps {
    getCompletedPath: (paths: PathData[]) => void;
}
const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ getCompletedPath }, ref) => {
    const [paths, setPaths] = useState<PathData[]>([]);
    const [currentPath, setCurrentPath] = useState<string>("");
    useImperativeHandle(ref, () => ({
        clear: () => {
            setPaths([]);
            setCurrentPath("");
        },
    }));
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
    return (<GestureDetector gesture={pan}>
        <View style={styles.container}>
          <Svg style={styles.canvas}>
            
            {paths.map((path, i) => (<Path key={`path-${i}`} d={path.d} stroke={path.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none"/>))}
            
            {currentPath && (<Path d={currentPath} stroke="black" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none"/>)}
          </Svg>
        </View>
      </GestureDetector>);
});
export default DrawingCanvas;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    canvas: {
        flex: 1,
    },
});
