import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Modal,
  StatusBar,
  TextInput,
  Button,
} from "react-native";
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

  const [secretPressCount, setSecretPressCount] = useState(0);
  const [showServerModal, setShowServerModal] = useState(false);
  const [newServerUrl, setNewServerUrl] = useState("");

  useEffect(() => {
    if (secretPressCount >= 5) {
      loadExistingServerUrl();
      setShowServerModal(true);
      setSecretPressCount(0);
    }
  }, [secretPressCount]);

  const loadExistingServerUrl = async () => {
    const currentUrl = config.apiServer;
    setNewServerUrl(currentUrl || "");
  };
  
  const handleSecretPress = () => {
    setSecretPressCount((prev) => prev + 1);
  };

  const handleSaveServerUrl = async () => {
    await config.setApiServer(newServerUrl);
    setShowServerModal(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
        setCarts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showServerModal]);

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
      <StatusBar backgroundColor="#0F872B" barStyle="light-content" />

      <Modal visible={showServerModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayServer}
          activeOpacity={1}
          onPressOut={() => setShowServerModal(false)}
        >
          <View style={styles.modalContentWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>הזן כתובת שרת (IP:PORT)</Text>
              <TextInput
                value={newServerUrl}
                onChangeText={setNewServerUrl}
                placeholder="_._._._:3000"
                style={styles.modalInput}
              />
              <View style={styles.serverModalButtons}>
                <TouchableOpacity
                  style={styles.serverSaveButton}
                  onPress={handleSaveServerUrl}
                >
                  <Text style={styles.serverButtonText}>שמור</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serverCancelButton}
                  onPress={() => setShowServerModal(false)}
                >
                  <Text style={styles.serverButtonText}>ביטול</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
          <TouchableWithoutFeedback onPress={handleSecretPress}>
            <Image
              source={require("../assets/full-logo-white.png")}
              style={styles.logo}
            />
          </TouchableWithoutFeedback>
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
    height: 225,
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
    top: 30,
  },
  logo: {
    height: height * 0.15,
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
  modalOverlayServer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  modalInput: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serverModalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    gap: 40,
  },
  serverSaveButton: {
    backgroundColor: "#0F872B",
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 15,
  },
  serverCancelButton: {
    backgroundColor: "#FF7E3E",
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 15,
  },
  serverButtonText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
});

export default MyCartsScreen;
