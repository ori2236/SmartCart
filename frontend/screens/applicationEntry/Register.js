import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

const { width, height } = Dimensions.get("window");

export default function Register() {
  const navigation = useNavigation();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    mail: "",
    password: "",
    confirmPassword: "",
  });

  const handleAddUser = async () => {
    let newErrors = { mail: "", password: "", confirmPassword: "" };

    if (!mail.trim()) {
      newErrors.mail = "שדה זה הינו חובה";
    }
    if (!password.trim()) {
      newErrors.password = "שדה זה הינו חובה";
    } else if (password !== confirmPassword) {
      newErrors.password = "הסיסמה חייבת להיות תואמת לוידוא סיסמא";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "שדה זה הינו חובה";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    const newUser = {
      mail,
      password,
      is_Google: false,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/user/user/`;
      const response = await axios.post(apiUrl, newUser);
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.error || "";
        let newErrors = { mail: "", password: "", confirmPassword: "" };

        if (error.response.status === 400) {
          if (errorMessage.includes("mail and password are required")) {
            newErrors.mail = "שדה זה הינו חובה";
            newErrors.password = "שדה זה הינו חובה";
          } else if (errorMessage.includes("Email already exists")) {
            newErrors.mail = "האימייל כבר קיים במערכת";
          } else if (errorMessage.includes("weak password")) {
            newErrors.password =
              "הסיסמה חייבת להיות לפחות 8 תווים ולכלול אות גדולה, אות קטנה, מספר ותו מיוחד.";
          }
        }
        setErrors(newErrors);
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
        <Ionicons name="person-outline" style={styles.profileIcon} />
        <Text style={styles.titleText}>הרשמה</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="מייל"
            value={mail}
            onChangeText={(text) => {
              setMail(text);
              setErrors({ ...errors, mail: "" });
            }}
            keyboardType="email-address"
            textAlign="right"
          />
          {errors.mail ? (
            <Text style={styles.errorText}>{errors.mail}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="סיסמה"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: "" });
            }}
            secureTextEntry
            textAlign="right"
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="וידוא סיסמה"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: "" });
            }}
            secureTextEntry
            textAlign="right"
          />
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAddUser}>
          <Text style={styles.buttonText}>אישור</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>או</Text>

        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={require("../../assets/googleLogo.png")}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>הצטרף עם גוגל</Text>
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
    paddingTop: height * 0.125,
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
  orText: {
    marginTop: 18,
    marginBottom: 18,
    fontSize: 18,
    color: "#000000",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 30,
    borderRadius: 35,
  },
  googleIcon: {
    width: 50,
    height: 50,
    marginRight: 5,
  },
  googleText: {
    fontSize: 22,
  },
});