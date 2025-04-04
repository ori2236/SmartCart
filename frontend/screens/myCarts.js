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

useEffect(() => {
  const fetchData = async () => {
    try {
      const mail = await SecureStore.getItemAsync("userMail");
      const resolvedMail = mail || "guest";
      setUserMail(resolvedMail);

      const apiUrl = `http://${config.apiServer}/api/userInCart/userInCart/mail/${resolvedMail}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.message) {
        setCarts([]);
      } else {
        setCarts(response.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  };

  fetchData();
}, []);


  const handleMenuOption = (option) => {
    setIsMenuVisible(false);
    switch (option) {
      case "create":
        console.log("CreateCart");
        //navigation.navigate("CreateCart", { userMail });
        break;
      case "join":
        console.log("JoinCart");
        //navigation.navigate("JoinCart", { userMail });
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsMenuVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu-outline" size={24} color="white" />
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
    top: 45,
  },
  menuButton: {
    position: "absolute",
    right: 20,
    top: 45,
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
