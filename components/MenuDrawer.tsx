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
  const { signOut, session, isAuthenticated } = useAuthSession();
  const userName =
    isAuthenticated && session?.user?.name ? session.user.name : "Guest";
  const userEmail =
    isAuthenticated && session?.user?.email
      ? session.user.email
      : "Sign in to sync data";
  const handleAuthAction = () => {
    onDismiss();
    if (isAuthenticated) {
      signOut();
    } else {
      router.push("/(auth)/login");
    }
  };
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible]);
  const drawerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-DRAWER_WIDTH, 0],
      Extrapolation.CLAMP,
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
      Extrapolation.CLAMP,
    );
    return {
      opacity,
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
                {isAuthenticated
                  ? `Welcome Back, ${userName}`
                  : `Hello, ${userName}`}
              </Text>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.primary }}
              >
                {userEmail}
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
              label="Unit Converter"
              icon="swap-horizontal"
              active={active === "unit-converter"}
              onPress={() => {
                setActive("unit-converter");
                onDismiss();
                setActive("");
                router.push("/(pages)/NepalUnitConverter");
              }}
            />
            <Drawer.Item
              label="Evaluation"
              icon="file-document"
              active={active === "evaluation"}
              onPress={() => {
                setActive("evaluation");
                onDismiss();
                setActive("");
                router.push("/(tabs)/evaluations");
              }}
            />
            <Drawer.Item
              label="Sync Data"
              icon="sync"
              active={active === "sync"}
              onPress={() => {
                setActive("sync");
                onDismiss();
                setActive("");
                router.push("/(tabs)/sync");
              }}
            />
          </Drawer.Section>
          <Drawer.Section title="Actions">
            <Drawer.Item
              label={isAuthenticated ? "Sign Out" : "Sign In"}
              icon={isAuthenticated ? "logout" : "login"}
              onPress={handleAuthAction}
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
