import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  FlatList,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

const { height } = Dimensions.get("window");

export default function ChangeInfo({ route }) {
  const { userMail, cart, originScreen } = route.params;
  const navigation = useNavigation();
  const [cartName, setCartName] = useState(cart.name);
  const [address, setAddress] = useState(cart.address);
  const [suggestions, setSuggestions] = useState([]);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [errors, setErrors] = useState({ cartName: "", address: "" });

  const handleCreateCart = async () => {
    let newErrors = { cartName: "", address: "" };
    if (!cartName.trim()) newErrors.cartName = "שדה זה הינו חובה";
    if (!address.trim()) newErrors.address = "שדה זה הינו חובה";
    else if (!isAddressSelected && address !== cart.address) {
      newErrors.address = "יש לבחור כתובת מהרשימה";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((e) => e)) return;

    try {
      const apiUrl = `http://${config.apiServer}/api/cart/cart/${cart.cartKey}`;
      const response = await axios.put(apiUrl, {
        name: cartName,
        address,
      });
      if (response.status === 200) {
        navigation.replace("CartInfo", {
          userMail,
          cart: { ...response.data.cart, cartKey: cart.cartKey },
          originScreen,
        });
      }
    } catch (error) {
      console.error(error);
      setErrors({ cartName: "שדה זה הינו חובה", address: "שדה זה הינו חובה" });
    }
  };

  const handleAddressChange = async (text) => {
    setAddress(text);
    setIsAddressSelected(false);
    setErrors((prev) => ({ ...prev, address: "" }));

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const apiUrl = `http://${config.apiServer}/api/address/completeAddress`;
      const response = await axios.get(apiUrl, {
        params: { input: text },
      });

      setSuggestions(response.data.predictions || []);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  };

  const handleSuggestionSelect = (description) => {
    setAddress(description);
    setSuggestions([]);
    setIsAddressSelected(true);
    setErrors((prev) => ({ ...prev, address: "" }));
  };

  return (
    <View style={styles.backgroundColor}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Image
            source={require("../../assets/fullLogo.png")}
            style={styles.headerImage}
          />

          <View style={styles.title}>
            <Ionicons name="cart-outline" style={styles.profileIcon} />
            <Text style={styles.titleText}>עריכת עגלה</Text>
          </View>

          <View style={styles.container}>
            <View style={styles.inputContainerCartName}>
              <TextInput
                style={styles.input}
                placeholder="שם העגלה"
                value={cartName}
                onChangeText={(text) => {
                  setCartName(text);
                  setErrors((prev) => ({ ...prev, cartName: "" }));
                }}
                textAlign="right"
              />
              {errors.cartName ? (
                <Text style={styles.errorText}>{errors.cartName}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="כתובת"
                value={address}
                onChangeText={handleAddressChange}
                textAlign="right"
              />
              {suggestions.length > 0 && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSuggestionSelect(item.description)}
                    >
                      <Text style={styles.suggestionItem}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.suggestionList}
                />
              )}
              {errors.address ? (
                <Text style={styles.errorText}>{errors.address}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.getInButton}
              onPress={handleCreateCart}
            >
              <Text style={styles.buttonText}>אישור</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 45,
  },
  headerImage: {
    width: "80%",
    alignSelf: "center",
    marginTop: height * 0.075,
    resizeMode: "contain",
  },
  title: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
  },
  titleText: {
    color: "#0F872B",
    fontSize: 35,
    textAlign: "center",
  },
  profileIcon: {
    fontSize: 35,
    marginBottom: -6,
    marginRight: 5,
    color: "#0F872B",
  },
  container: {
    paddingTop: 65,
    alignItems: "center",
    padding: 20,
  },
  inputContainerCartName: {
    width: "95%",
  },
  inputContainer: {
    width: "95%",
    position: "relative",
    zIndex: 100,
  },
  input: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "right",
  },
  getInButton: {
    width: "75%",
    backgroundColor: "#0F872B",
    marginTop: 50,
    padding: 12,
    borderRadius: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  suggestionList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    textAlign: "right",
  },
});
