import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";
import config from "../config";

export default function CreateUser() {
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");

  const handleAddUser = async () => {
    console.log("Add User button pressed!");
    if (!name || !mail || !password) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    const newUser = {
      name,
      mail,
      password,
      is_Google: false,
    };

    try {
      console.log("Sending request to server with data:", newUser);
      const apiUrl = `http://${config.apiServer}/api/user/user/`;
      const response = await axios.post(apiUrl, newUser);
      Alert.alert("Success", "User added successfully!");
      console.log("Server response:", response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to add user. Please try again.");
      console.error("Error message:", error.message);
    }
  };


  return (
    console.log("Add User hello"),
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={(text) => setName(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={mail}
        onChangeText={(text) => setMail(text)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />
      <Button title="Add User" onPress={handleAddUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
});
