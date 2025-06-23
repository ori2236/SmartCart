import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Image,
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

export default function Login() {
  const navigation = useNavigation();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    mail: "",
    password: "",
  });

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
    axios
      .get(`http://${config.apiServer}/healthcheck`)
      .catch((err) => alert("השרת אינו מחובר" + err.message));
  }, []);

  useEffect(() => {
    SecureStore.deleteItemAsync("userMail");
  }, []);

  const handleForgotPassword = async () => {
    try {
      const apiUrl = `http://${config.apiServer}/api/user/user/${mail}`;
      const response = await axios.get(apiUrl);
      if (response?.status === 200) {
        try {
          const apiUrl = `http://${config.apiServer}/api/user/sendCode`;
          const response = await axios.post(apiUrl, { mail });
          if (response?.data?.message === "Verification code sent to email") {
            const explanation = "forgotPassword";
            navigation.navigate("VerifyCode", { mail, explanation });
          }
        } catch (error) {
          console.error(error);
        }
      }
    } catch {
      navigation.navigate("ForgotPassword");
    }
  };

  const handleCheckUser = async () => {
    let newErrors = { mail: "", password: "" };

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
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/user/login`;
      const response = await axios.post(apiUrl, existingUser);
      if (response?.data?.message === "Login successful") {
        const userMail = response.data.userMail;
        await SecureStore.setItemAsync("userMail", userMail);
        const nickname = response.data.nickname;
        await SecureStore.setItemAsync("nickname", nickname);
        navigation.navigate("MyCarts");
      }
    } catch (error) {
      let newErrors = { mail: "", password: "" };

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
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

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

      <TouchableWithoutFeedback onPress={handleSecretPress}>
        <Image
          source={require("../../assets/fullLogo.png")}
          style={styles.headerImage}
        />
      </TouchableWithoutFeedback>
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

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>שכחתי סיסמא</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.getInButton} onPress={handleCheckUser}>
          <Text style={styles.buttonText}>כניסה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Ionicons name="person-outline" style={styles.profileIconRegister} />
          <Text style={styles.buttonText}>צור משתמש</Text>
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
  forgotPasswordText: {
    fontSize: 15,
    textAlign: "right",
  },
  getInButton: {
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
  registerButton: {
    flexDirection: "row",
    width: "75%",
    backgroundColor: "#0F872B",
    marginTop: 150,
    padding: 12,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  profileIconRegister: {
    fontSize: 35,
    color: "#FFFFFF",
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
