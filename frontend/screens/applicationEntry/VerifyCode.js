import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

const { width, height } = Dimensions.get("window");

export default function VerifyCode({ route }) {
  const { mail, explanation } = route.params;
  const navigation = useNavigation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("שדה זה הינו חובה");
      return;
    }

    if (!/^\d+$/.test(code)) {
      setError("יש להזין ספרות בלבד");
      return;
    }

    const codeObject = {
      mail,
      code,
      explanation,
    };
    try {
      const apiUrl = `http://${config.apiServer}/api/user/verifyCode`;
      const response = await axios.post(apiUrl, codeObject);
      if (
        response?.data?.message === "User verified and created successfully"
      ) {
        const userMail = response.data.userMail;
        navigation.navigate("Home");
      } else if (
        response?.data?.message === "User verified"
      ) {
        const mail = response.data.userMail;
        navigation.navigate("ReplacePassword", { mail });
      }
    } catch (error) {    
      const errorMessage = error.response.data.error || "";
      if (errorMessage.includes("Invalid verification code")) {
        setError("הקוד אינו נכון");
      } else {
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.backgroundColor}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.title}>
        <Ionicons name="lock-closed-outline" style={styles.profileIcon} />
        <Text style={styles.titleText}>קוד אימות</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.codeSentText}>נשלח אליך קוד לאימות במייל</Text>
          <TextInput
            style={styles.input}
            placeholder="הזן קוד"
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setError("");
            }}
            keyboardType="numeric"
            textAlign="right"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
          <Text style={styles.buttonText}>אישור</Text>
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
  codeSentText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: "right"
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
