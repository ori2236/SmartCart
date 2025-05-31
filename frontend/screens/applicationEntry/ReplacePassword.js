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
import * as SecureStore from "expo-secure-store";
import config from "../../config";

const { height } = Dimensions.get("window");

export default function ReplacePassword({ route }) {
    const { mail } = route.params;
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleReplacing = async () => {
    let newErrors = { password: "", confirmPassword: "" };

    if (!password.trim()) {
      newErrors.password = "שדה זה הינו חובה";
    } else if (password !== confirmPassword) {
      newErrors.password = "הסיסמא חייבת להיות תואמת לוידוא";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "שדה זה הינו חובה";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    const newPassword = {
      mail,
      password,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/user/replacePassword`;
      const response = await axios.put(apiUrl, newPassword);
      if (response?.data?.message === "password replaced") {
        await SecureStore.setItemAsync("userMail", mail);
        navigation.navigate("MyCarts");
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.error || "";
        let newErrors = { mail: "", password: "", confirmPassword: "" };

        if (error.response.status === 400) {
          if (errorMessage.includes("mail and password are required")) {
            newErrors.password = "שדה זה הינו חובה";
          } else if (errorMessage.includes("weak password")) {
            newErrors.password =
              "הסיסמא חייבת להיות לפחות 8 תווים ולכלול אות גדולה, אות קטנה, מספר ותו מיוחד.";
          }
        } else {
          console.error(error);
        }
        setErrors(newErrors);
      } else {
        console.error(error);
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
        <Ionicons name="person-outline" style={styles.profileIcon} />
        <Text style={styles.titleText}>שינוי סיסמא</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="סיסמא חדשה"
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
            placeholder="וידוא סיסמא חדשה"
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

        <TouchableOpacity style={styles.button} onPress={handleReplacing}>
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
});
