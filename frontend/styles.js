import { StyleSheet, Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0F872B",
    height: height * 0.25,
    justifyContent: "flex-start",
    position: "relative",
    width: "100%",
    top: 0,
    paddingTop: height * 0.08,
  },
  backButton: {
    position: "absolute",
    left: 10,
    top: 20,
  },
  logo: {
    width: Platform.OS === "web" ? width * 0.4 : width * 0.6,
    height: Platform.OS === "web" ? height * 0.1 : height * 0.08,
    resizeMode: "contain",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 25,
    color: "#ffffff",
    position: "absolute",
    top: height * 0.14,
    width: "100%",
    paddingTop: height * 0.08,
  },
  buttonCart: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7E3E",
    borderRadius: 100,
    width: width * 0.6,
    height: height * 0.06,
    marginBottom: 20,
    alignSelf: "center",
  },
  buttonCartText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  info: {
    fontSize: 28,
    marginRight: 15,
    color: "black",
    fontWeight: "bold",
  },
  buttonWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
});

export default styles;
