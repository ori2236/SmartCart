import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

const { height } = Dimensions.get("window");

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [mail, setMail] = useState("");
  const [error, setError] = useState("");

  const sendCode = async () => {
    let newError = { mail: "" };

    if (!mail.trim()) {
      setError("שדה זה הינו חובה");
      return;
    }

    try {
      const apiUrl = `http://${config.apiServer}/api/user/sendCode`;
      const response = await axios.post(apiUrl, { mail });
      if (response?.data?.message === "Verification code sent to email") {
        explanation = "forgotPassword";
        navigation.navigate("VerifyCode", { mail, explanation });
      }
    } catch (error) {
      if (error.status === 400) {
        setError("שדה זה הינו חובה");
      } else if (error.status === 404) {
        setError("מייל זה אינו קיים במערכת");
      } else if (error.status === 500) {
        console.error(error.message);
      }
    }
  };

  return (
    <View style={styles.backgroundColor}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.title}>
        <Ionicons name="lock-closed-outline" style={styles.profileIcon} />
        <Text style={styles.titleText}>שכחתי סיסמא</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.mailText}>ישלח אליך קוד לאימות במייל</Text>
          <TextInput
            style={styles.input}
            placeholder="הזן מייל"
            value={mail}
            onChangeText={(text) => {
              setMail(text);
              setError("");
            }}
            keyboardType="email-address"
            textAlign="right"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={sendCode}>
          <Text style={styles.buttonText}>שלח קוד</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: height * 0.15,
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
  mailText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: "right",
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
  button: {
    width: "75%",
    backgroundColor: "#0F872B",
    marginTop: 35,
    padding: 12,
    borderRadius: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
