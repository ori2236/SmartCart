import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Dimensions, Platform } from "react-native";
import { ScrollView } from "react-native";
import config from "../config";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

const MyCartsScreen = () => {
  const [userMail, setUserMail] = useState("");
  const navigation = useNavigation();
  const [carts, setCarts] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const mail = await SecureStore.getItemAsync("userMail");
      const resolvedMail = mail || "guest";
      setUserMail(resolvedMail);
      const nickname = await SecureStore.getItemAsync("nickname");

      const apiUrl = `http://${config.apiServer}/api/userInCart/userInCart/mail/${resolvedMail}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.message) {
        setCarts([]);
      } else {
        setCarts(response.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);


  const handleMenuOption = (option) => {
    setIsMenuVisible(false);
    switch (option) {
      case "create":
        navigation.navigate("NewCart", { userMail });
        break;
      case "join":
        navigation.navigate("JoinCart", { userMail });
        break;
      case "logout":
        navigation.navigate("Login");
        break;
      default:
        break;
    }
  };



  return (
    <View style={styles.backgroundColor}>
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.modalMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption("create")}
            >
              <Text style={styles.menuText}>צור עגלה</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption("join")}
            >
              <Text style={styles.menuText}>הצטרף לעגלה</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption("logout")}
            >
              <Text style={styles.menuText}>התנתקות</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setIsMenuVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu-outline" size={36} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Image
            source={require("../assets/full-logo-white.png")}
            style={styles.logo}
          />
          <Text style={styles.subtitle}>העגלות שלי</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollableContainer}>
        {!isLoading && carts.length === 0 ? (
          <View style={styles.centerContent}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logoNoCarts}
            />
            <Text style={styles.description}>אין לך עגלות כרגע</Text>
            <Text
              style={styles.createCart}
              onPress={() => {
                navigation.navigate("NewCart", { userMail });
              }}
            >
              לחץ כאן ליצירת עגלה
            </Text>
          </View>
        ) : (
          carts.map((cart, index) => (
            <View key={index} style={styles.buttonWrapper}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("CartInfo", {
                    userMail,
                    cart,
                    originScreen: "MyCarts",
                  })
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="black"
                  style={styles.info}
                />
              </TouchableOpacity>
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
    backgroundColor: "#0F872B",
    height: height * 0.3,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
    position: "relative",
  },
  headerContent: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  menuButton: {
    position: "absolute",
    right: 20,
    top: 55,
  },
  logo: {
    width: width * 0.6,
    resizeMode: "contain",
  },
  subtitle: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
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
  },
  createCart: {
    textAlign: "center",
    fontSize: 16,
    color: "#FFFFFF",
    backgroundColor: "#FF7E3E",
    fontWeight: "bold",
    borderRadius: 100,
    marginTop: 120,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalMenu: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  menuText: {
    fontSize: 18,
    textAlign: "center",
  },
});

export default MyCartsScreen;
