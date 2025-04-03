import React, { useState } from "react";
import { View, Button, StyleSheet, Alert, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import axios from "axios";
import Home from "./screens/home";
import addUser from "./screens/addUser";
import MyCarts from "./screens/myCarts";
import AddProducts from "./screens/addProducts/AddProducts";
import ShoppingCart from "./screens/shoppingCart/ShoppingCart";
import Supermarkets from "./screens/supermarkets/Supermarkets";
import SupermarketBranch from "./screens/supermarkets/SupermarketBranch";
import Register from "./screens/applicationEntry/Register";
import VerifyCode from "./screens/applicationEntry/VerifyCode"
import Login from "./screens/applicationEntry/Login"
import ForgotPassword from "./screens/applicationEntry/ForgotPassword"
import ReplacePassword from "./screens/applicationEntry/ReplacePassword"
import config from "./config";

const Stack = createStackNavigator();

const MainScreen = ({ navigation }) => {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [userMail, setUserMail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [isGoogle, setIsGoogle] = useState(false);

  const fetchUserData = async () => {
    try {
      const email = "orile03@gmail.com";
      const apiUrl = `http://${config.apiServer}/api/user/user/${email}`;
      const response = await axios.get(apiUrl);
      const data = response.data;
      setUserId(data._id);
      setUserName(data.name);
      setUserMail(data.mail);
      setUserPassword(data.password);
      setIsGoogle(data.is_Google);

      console.log("Fetched user data:", data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user data. Please try again.");
      console.error("Error fetching user data:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Go to Home"
        onPress={() => navigation.navigate("Home", { userMail })}
        style={styles.button}
      />
      <View style={styles.spacing} />
      <Button
        title="Fake Add User (check connection)"
        onPress={() => navigation.navigate("addUser")}
        style={styles.button}
      />
      <View style={styles.spacing} />
      <Button
        title="Fetch User Data"
        onPress={fetchUserData}
        style={styles.button}
      />
      <View style={styles.spacing} />
      <Button
        title="temp register"
        onPress={() => navigation.navigate("Register")}
        style={styles.button}
      />
      <View style={styles.spacing} />
      <Button
        title="temp login"
        onPress={() => navigation.navigate("Login")}
        style={styles.button}
      />
      <View style={styles.spacing} />
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>User ID: {userId}</Text>
        <Text style={styles.infoText}>Name: {userName}</Text>
        <Text style={styles.infoText}>Email: {userMail}</Text>
        <Text style={styles.infoText}>Password: {userPassword}</Text>
        <Text style={styles.infoText}>
          Is Google Account: {isGoogle ? "Yes" : "No"}
        </Text>
      </View>
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
          name="Register"
          component={Register}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerifyCode"
          component={VerifyCode}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReplacePassword"
          component={ReplacePassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="addUser"
          component={addUser}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyCarts"
          component={MyCarts}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddProducts"
          component={AddProducts}
          options={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
        <Stack.Screen
          name="ShoppingCart"
          component={ShoppingCart}
          options={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal-inverted",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
        <Stack.Screen
          name="Supermarkets"
          component={Supermarkets}
          options={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal-inverted",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
        <Stack.Screen
          name="SupermarketBranch"
          component={SupermarketBranch}
          options={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal-inverted",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
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
  button: {
    width: 200,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  spacing: {
    height: 20,
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
  },
});
