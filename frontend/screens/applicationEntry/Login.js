import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
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

export default function Login() {
  const navigation = useNavigation();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    mail: "",
    password: "",
  });

  const handleCheckUser = async () => {
    let newErrors = { mail: "", password: "", confirmPassword: "" };

    if (!mail.trim()) {
      newErrors.mail = "שדה זה הינו חובה";
    }
    if (!password.trim()) {
      newErrors.password = "שדה זה הינו חובה";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    const existingUser = {
      mail,
      password,
      is_Google: false,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/user/login`;
      const response = await axios.post(apiUrl, existingUser);
      if (response?.data?.message === "Login successful") {
        
        const userMail = response.data.userMail
        navigation.navigate("Home", { userMail });
      }
    } catch (error) {
      let newErrors = { mail: "", password: ""};

      if (error.status === 400) {
        newErrors.mail = "שדה זה הינו חובה";
        newErrors.password = "שדה זה הינו חובה";
      } else if (error.status === 401 || error.status === 404) {
        newErrors.mail = "מייל או סיסמא לא נכונים";
        newErrors.password = "מייל או סיסמא לא נכונים";
      } else if (error.status === 500) {
        console.error(error);
      } 
      setErrors(newErrors);
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
        <Text style={styles.titleText}>התחברות</Text>
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
            placeholder="סיסמא"
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

        <TouchableOpacity style={styles.button} onPress={handleCheckUser}>
          <Text style={styles.buttonText}>כניסה</Text>
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
