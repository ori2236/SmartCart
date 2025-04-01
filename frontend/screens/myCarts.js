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
  const [carts, setCarts] = useState([]);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const apiUrl = `http://${config.apiServer}/api/userInCart/userInCart/mail/${userMail}`;
        const response = await axios.get(apiUrl);
        if (response.data && response.data.message) {
          setCarts([]);
        } else {
          setCarts(response.data);
        }
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
        <Text style={styles.subtitle}>העגלות שלי</Text>
      </View>

      <ScrollView style={styles.scrollableContainer}>
        {carts.length === 0 ? (
          <View style={styles.centerContent}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logoNoCarts}
            />
            <Text style={styles.description}>אין לך עגלות כרגע, צור עגלה</Text>
          </View>
        ) : (
          carts.map((cart, index) => (
            <View key={index} style={styles.buttonWrapper}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="black"
                style={styles.info}
              />
              <TouchableOpacity
                style={styles.buttonCart}
                onPress={() =>
                  navigation.navigate("AddProducts", { userMail, cart })
                }
              >
                <Text style={styles.buttonCartText}>{cart.name}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0F872B",
    height: height * 0.3,
    justifyContent: "flex-start",
    position: "relative",
    width: "100%",
    top: 0,
    paddingTop: height * 0.05,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "web" ? 30 : 45,
  },
  logo: {
    height: Platform.OS === "web" ? height * 0.22 : height * 0.2,
    width: Platform.OS === "web" ? width * 0.4 : width * 0.6,
    resizeMode: "contain",
    marginTop: Platform.OS === "web" ? -10 : 0,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 25,
    color: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Platform.OS === "web" ? -10 : -15,
  },
  buttonCart: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7E3E",
    borderRadius: 100,
    width: width * 0.6,
    height: height * 0.06,
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoNoCarts: {
    alignSelf: "center",
    width: 180,
    height: 150,
    marginTop: height * 0.13,
    marginBottom: 7,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    color: "#333333",
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default MyCartsScreen;
