import "react-native-get-random-values";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import MyCarts from "./screens/myCarts";
import AddProducts from "./screens/addProducts/AddProducts";
import ShoppingCart from "./screens/shoppingCart/ShoppingCart";
import Supermarkets from "./screens/supermarkets/Supermarkets";
import SupermarketBranch from "./screens/supermarkets/SupermarketBranch";
import Register from "./screens/applicationEntry/Register";
import VerifyCode from "./screens/applicationEntry/VerifyCode";
import Login from "./screens/applicationEntry/Login";
import ForgotPassword from "./screens/applicationEntry/ForgotPassword";
import ReplacePassword from "./screens/applicationEntry/ReplacePassword";
import NewCart from "./screens/applicationEntry/NewCart";
import JoinCart from "./screens/cartManagement/JoinCart";
import CartInfo from "./screens/cartManagement/CartInfo";

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userMail = await SecureStore.getItemAsync("userMail");
      if (userMail) {
        setInitialRoute("MyCarts");
      } else {
        setInitialRoute("Login");
      }
    };

    checkLoginStatus();
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
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
          name="NewCart"
          component={NewCart}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JoinCart"
          component={JoinCart}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CartInfo"
          component={CartInfo}
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
