import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const Home = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/37d41429-5f49-485d-af2f-09673923b052",
          }}
          resizeMode="contain"
          style={styles.largeImage}
        />
        <Text style={styles.welcomeText}>{"ברוך הבא!"}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => alert("Pressed!")}
        >
          <Text style={styles.buttonText}>{"הצטרף לעגלה"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => alert("Pressed!")}
        >
          <Text style={styles.buttonText}>{"צור עגלה"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => alert("Pressed!")}
        >
          <Text style={styles.buttonText}>{"העגלות שלי"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 25,
  },
  largeImage: {
    height: 200,
    marginBottom: 10,
    marginHorizontal: 82,
  },
  welcomeText: {
    color: "#FF7E3E",
    fontSize: 40,
    marginBottom: 60,
    marginHorizontal: 110,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0F872B",
    borderRadius: 100,
    paddingVertical: 13,
    marginBottom: 30,
    marginHorizontal: 100,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
});

export default Home;
