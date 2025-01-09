import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Dimensions, Platform } from "react-native";
import { ScrollView } from "react-native";
import config from "../config";
import axios from "axios";

const { width, height } = Dimensions.get("window");

const MyCartsScreen = ({ route }) => {
  const { userMail } = route.params;
  const navigation = useNavigation();
  const [cartNames, setCartNames] = useState([]);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const apiUrl = `http://${config.apiServer}/api/userInCart/userInCart/mail/${userMail}`;
        const response = await axios.get(apiUrl);
        const carts = response.data;
        const names = carts.map((cart) => cart.name);
        setCartNames(names);
      } catch (error) {
        console.error("Error fetching cart data:", error.message);
      }
    };

    fetchCartData();
  }, [userMail]);
  return (
    <View style={styles.backgroundColor}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Image
          source={require("../assets/full-logo-white.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.subtitle}>העגלות שלי</Text>

      <ScrollView style={styles.scrollableContainer}>
        {cartNames.map((name, index) => (
          <View key={index} style={styles.buttonWrapper}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="black"
              style={styles.info}
            />
            <TouchableOpacity style={styles.buttonCart}>
              <Text style={styles.buttonCartText}>{name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0F872B",
    height: height * 0.25,
    justifyContent: "flex-start",
    position: "relative",
    width: "100%",
    top: 0,
    paddingTop: height * 0.08,
  },
  backButton: {
    position: "absolute",
    left: 10,
    top: 20,
  },
  logo: {
    width: Platform.OS === "web" ? width * 0.4 : width * 0.6,
    height: Platform.OS === "web" ? height * 0.1 : height * 0.08,
    resizeMode: "contain",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 25,
    color: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10, // רווח קל מלמעלה
  },
  buttonCart: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7E3E",
    borderRadius: 100,
    width: width * 0.6,
    height: height * 0.06,
    marginBottom: 20,
    alignSelf: "center",
  },
  buttonCartText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  info: {
    fontSize: 28,
    marginRight: 15,
    color: "black",
    fontWeight: "bold",
  },
  buttonWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  scrollableContainer: {
    flex: 1,
  },
});

export default MyCartsScreen;
