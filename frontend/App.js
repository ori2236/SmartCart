import React from "react";
import { View, Button, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./screens/home";
import addUser from "./screens/addUser";

const Stack = createStackNavigator();

const MainScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Button title="Go to Home" onPress={() => navigation.navigate("Home")} />
      <Button
        title="fake add user (check connection)"
        onPress={() => navigation.navigate("addUser")}
      />
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="addUser"
          component={addUser}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
