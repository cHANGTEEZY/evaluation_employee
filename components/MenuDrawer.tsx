import { StyleSheet, View, Dimensions, Pressable } from "react-native";
import { Drawer, Portal, useTheme, Text } from "react-native-paper";
import React, { useEffect } from "react";
import { useAuthSession } from "../lib/auth-store";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

type MenuDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
};

const MenuDrawer = ({ visible, onDismiss }: MenuDrawerProps) => {
  const theme = useTheme();
  const [active, setActive] = React.useState("first");
  const { signOut, session } = useAuthSession();

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-DRAWER_WIDTH, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 0.5],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      // Hide overlay when not visible to prevent blocking touches
      display: progress.value === 0 ? "none" : "flex",
    };
  });

  return (
    <Portal>
      <Animated.View
        style={[styles.overlay, { backgroundColor: "#000" }, overlayStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          { backgroundColor: theme.colors.surface, width: DRAWER_WIDTH },
          drawerStyle,
        ]}
      >
        <View style={styles.content}>
          <Drawer.Section>
            <View style={styles.titleContainer}>
              <Text
                variant="headlineSmall"
                style={[{ color: theme.colors.onSurface }]}
              >
                Welcome Back, {session?.user.name}
              </Text>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.primary }}
              >
                {session?.user.email}
              </Text>
            </View>
          </Drawer.Section>
          <Drawer.Section title="Preferences">
            <Drawer.Item
              label="Profile"
              icon="account"
              active={active === "profile"}
              onPress={() => {
                setActive("profile");
                onDismiss();
                setActive("");
                router.push("/(tabs)/profile");
              }}
            />
            <Drawer.Item
              label="Settings"
              icon="cog"
              active={active === "settings"}
              onPress={() => {
                setActive("settings");
                onDismiss();
                setActive("");
                router.push("/(pages)/Settings");
              }}
            />
            <Drawer.Item
              label="Evaluation Detail"
              icon="file-document"
              active={active === "evaluationDetail"}
              onPress={() => {
                setActive("evaluationDetail");
                onDismiss();
                setActive("");
                router.push("/(pages)/EvaluationDetail");
              }}
            />
          </Drawer.Section>
          <Drawer.Section title="Actions">
            <Drawer.Item
              label="Sign Out"
              icon="logout"
              onPress={() => {
                onDismiss();
                signOut();
              }}
            />
          </Drawer.Section>
        </View>
      </Animated.View>
    </Portal>
  );
};

export default MenuDrawer;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    height: "100%",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 50,
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 28,
    marginVertical: 20,
  },
  userNameText: {
    textTransform: "capitalize",
  },
});
