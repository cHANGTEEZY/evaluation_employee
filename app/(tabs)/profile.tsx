import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useAuthSession } from "../../lib/auth-store";
import { authClient } from "../../lib/auth-client";
import { Button } from "tamagui";

const Profile = () => {
  const { user } = useAuthSession();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <View>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
      <Text>{user?.role}</Text>
      <Button onPress={handleSignOut}>SignOut</Button>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({});
