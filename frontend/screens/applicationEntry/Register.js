import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import config from "../../config";

const { height } = Dimensions.get("window");

export default function Register() {
  const navigation = useNavigation();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [errors, setErrors] = useState({
    mail: "",
    password: "",
    confirmPassword: "",
    nickname: "",
  });

  const handleAddUser = async () => {
    let newErrors = {
      mail: "",
      password: "",
      confirmPassword: "",
      nickname: "",
    };

    if (!mail.trim()) {
      newErrors.mail = "שדה זה הינו חובה";
    }
    if (!password.trim()) {
      newErrors.password = "שדה זה הינו חובה";
    } else if (password !== confirmPassword) {
      newErrors.password = "הסיסמא חייבת להיות תואמת לוידוא"
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "שדה זה הינו חובה";
    }
    if (!nickname.trim()) {
      newErrors.nickname = "שדה זה הינו חובה";
    }
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    const newUser = {
      mail,
      password,
      nickname,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/user/register`;
      const response = await axios.post(apiUrl, newUser);
      if (response?.data?.message === "Verification code sent to email"){
        explanation = "register"
        navigation.navigate("VerifyCode", { mail, explanation });
      }
    } catch (error) {
      if (error.response) {
        
        const errorMessage = error.response.data.error || "";
        let newErrors = {
          mail: "",
          password: "",
          confirmPassword: "",
          nickname: "",
        };

        if (error.response.status === 400) {
          if (
            errorMessage.includes("mail, password and nickname are required")
          ) {
            newErrors.mail = "שדה זה הינו חובה";
            newErrors.password = "שדה זה הינו חובה";
            newErrors.nickname = "שדה זה הינו חובה";
          } else if (errorMessage.includes("Email already exists")) {
            newErrors.mail = "האימייל כבר קיים במערכת";
          } else if (errorMessage.includes("weak password")) {
            newErrors.password =
              "הסיסמא חייבת להיות לפחות 8 תווים ולכלול אות גדולה, אות קטנה, מספר ותו מיוחד.";
          } else {
            console.error(error.response?.data?.error);
          }
        } else if (errorMessage.includes("No recipients defined")) {
          newErrors.mail = "יש להזין כתובת מייל קיימת";
        }
        setErrors(newErrors);
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
      <Image
        source={require("../../assets/fullLogo.png")}
        style={styles.headerImage}
      />
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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="וידוא סיסמא"
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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="כינוי"
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              setErrors({ ...errors, nickname: "" });
            }}
            textAlign="right"
          />
          {errors.nickname ? (
            <Text style={styles.errorText}>{errors.nickname}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleAddUser}>
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
});