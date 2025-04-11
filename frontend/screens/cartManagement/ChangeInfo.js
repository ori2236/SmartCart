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
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import config from "../../config";

const { width, height } = Dimensions.get("window");

export default function ChangeInfo({ route }) {
  const { userMail, cart, originScreen } = route.params;
  const navigation = useNavigation();
  const [cartName, setCartName] = useState(cart.name);
  const [address, setAddress] = useState(cart.address);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [errors, setErrors] = useState({
    cartName: "",
    address: "",
  });
  const prevAddressRef = useRef("");

  const handleCreateCart = async () => {
    let newErrors = { cartName: "", address: "" };

    if (!cartName.trim()) {
      newErrors.cartName = "שדה זה הינו חובה";
    }
    if (!address.trim()) {
      newErrors.address = "שדה זה הינו חובה";
    } else if (!isAddressSelected && address !== cart.address) {
      newErrors.address = "יש לבחור כתובת מהרשימה";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    const changedCart = {
      name: cartName,
      address,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/cart/cart/${cart.cartKey}`;
      const response = await axios.put(apiUrl, changedCart);
      if (response.status === 200) {
        const updatedCart = {
          ...response.data.cart,
          cartKey: cart.cartKey,
        };
        navigation.replace("CartInfo", {
          userMail,
          cart: updatedCart,
          originScreen,
        });
      }
    } catch (error) {
      let newErrors = { cartName: "", address: "" };

      if (error.status === 400) {
        newErrors.cartName = "שדה זה הינו חובה";
        newErrors.address = "שדה זה הינו חובה";
      } else if (error.status === 500) {
        console.error(error);
      }
      setErrors(newErrors);
    }
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
                  setErrors({ ...errors, cartName: "" });
                }}
                keyboardType="text"
                textAlign="right"
              />
              {errors.cartName ? (
                <Text style={styles.errorText}>{errors.cartName}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <GooglePlacesAutocomplete
                placeholder=""
                onPress={(data, details = null) => {
                  const fullAddress = details?.formatted_address;
                  setAddress(fullAddress);
                  setErrors({ ...errors, address: "" });
                  setTimeout(() => setIsAddressSelected(true), 0);
                }}
                fetchDetails={true}
                textInputProps={{
                  value: address,
                  onChangeText: (text) => {
                    if (text !== prevAddressRef.current) {
                      prevAddressRef.current = text;
                      setAddress(text);
                      if (errors.address === "שדה זה הינו חובה") {
                        setErrors((prev) => ({ ...prev, address: "" }));
                      }
                      setIsAddressSelected(false);
                    }
                  },
                }}
                query={{
                  key: config.GOOGLE_MAPS_API_KEY,
                  language: "iw",
                  components: "country:il",
                }}
                debounce={300}
                minLength={2}
                enablePoweredByContainer={false}
                styles={{
                  textInput: {
                    height: 40,
                    borderBottomWidth: 1,
                    borderBottomColor: "#000",
                    marginBottom: 10,
                    backgroundColor: "#fff",
                    fontSize: 16,
                    textAlign: "right",
                    direction: "rtl",
                  },
                  row: {
                    flexDirection: "row-reverse",
                  },
                  description: {
                    textAlign: "right",
                    direction: "rtl",
                  },
                  listView: {
                    backgroundColor: "#fff",
                    position: "absolute",
                    top: 50,
                    zIndex: 200,
                  },
                }}
              />
              {errors.address ? (
                <Text style={styles.errorTextAddress}>{errors.address}</Text>
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
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inputContainerCartName: {
    width: "95%",
  },
  inputContainer: {
    width: "95%",
    height: 80,
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
  errorTextAddress: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "right",
  },
  forgotPasswordText: {
    fontSize: 15,
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
});
