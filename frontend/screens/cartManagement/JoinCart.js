import React, { useState } from "react";
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
  Alert,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

const { width, height } = Dimensions.get("window");

export default function JoinCart({ route }) {
  const { userMail } = route.params;
  const navigation = useNavigation();
  const [cartKey, setCartKey] = useState("");
  const [error, setError] = useState("");

  const handleRequestJoinToCart = async () => {
    if (!cartKey.trim()) {
      setError("שדה זה הינו חובה");
      return;
    }

    const joinCart = {
      cartKey,
      mail: userMail,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/waitingList/waitingList`;
      const response = await axios.post(apiUrl, joinCart);
      if (response.status === 201) {
        Alert.alert("בקשתך התקבלה", "בקשת הצטרפות לעגלה נשלחה");
        navigation.navigate("MyCarts");
      }
    } catch (error) {
      const errorMessage = error.response.data.error || "";

      if (error.status === 400) {
        if (errorMessage === "The user is already in this cart") {
          setError("אתה כבר נמצא בעגלה זו");
        } else if (errorMessage === "The user is on the waiting list for this cart") {
          setError("בקשת ההצטרפות לעגלה זו כבר נשלחה");
        } else {
          setError("שדה זה הינו חובה");
        }
      } else if (error.status === 404) {
        setError("עגלה זו אינה קיימת במערכת");
      } else if (error.status === 500) {
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.backgroundColor}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={"height"}
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
            <Text style={styles.titleText}>הצטרפות לעגלה</Text>
          </View>
          <View style={styles.container}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="מפתח עגלה"
                value={cartKey}
                onChangeText={(text) => {
                  setCartKey(text);
                  setError("");
                }}
                keyboardType="text"
                textAlign="right"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.getInButton}
              onPress={handleRequestJoinToCart}
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
  inputContainer: {
    width: "95%",
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
