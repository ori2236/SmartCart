import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Linking,
  FlatList,
} from "react-native";
import SupermarketProductsList from "./SupermarketProductsList";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const SupermarketBranch = ({ route }) => {
  const {
    name,
    address,
    logo,
    price,
    product_prices,
    product_images,
    userMail,
    cart,
  } = route.params;
  const navigation = useNavigation();

  const openWaze = () => {
    const encodedAddress = encodeURIComponent(address);
    const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;
    Linking.openURL(wazeUrl).catch((err) =>
      console.error("Cannot open Waze", err)
    );
  };

  const openGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(googleMapsUrl).catch((err) =>
      console.error("Cannot open Google Maps", err)
    );
  };

  const handleBottomRow = (button) => {
    if (button == "home") {
      navigation.navigate("Home", { userMail });
    } else if (button == "addProducts") {
      navigation.navigate("AddProducts", { userMail, cart });
    } else if (button == "shoppingCart") {
      navigation.navigate("ShoppingCart", { userMail, cart });
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Image
          source={require("../../assets/full-logo-white.png")}
          style={styles.logo}
        />
      </View>
      <FlatList
        data={product_images}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={
          <View>
            <View style={styles.contentContainer}>
              <Text style={styles.storeName}>{name}</Text>
              <Text style={styles.address}>{address}</Text>
              <Image
                style={styles.storeImage}
                source={
                  logo
                    ? {
                        uri: logo.startsWith("data:image")
                          ? logo
                          : `data:image/png;base64,${logo}`,
                      }
                    : require("../../assets/logo.png")
                }
                resizeMode="contain"
              />
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={openGoogleMaps}
                >
                  <Image
                    source={require("../../assets/googleMapsLogo.png")}
                    style={styles.buttonImage}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={openWaze}>
                  <Image
                    source={require("../../assets/wazeLogo.png")}
                    style={styles.buttonImage}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.cartPrice}>מחיר העגלה: {price} ₪</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SupermarketProductsList
            product_images={[item]}
            product_prices={product_prices}
          />
        )}
      />
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity>
          <Image
            source={require("../../assets/super-branches.png")}
            style={styles.LocationIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("shoppingCart")}>
          <Image
            source={require("../../assets/shopping-list.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("addProducts")}>
          <Image
            source={require("../../assets/add-products.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("home")}>
          <Image
            source={require("../../assets/home.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0F872B",
    height: height * 0.2,
    justifyContent: "flex-start",
    position: "relative",
    width: "100%",
    top: 0,
    paddingTop: height * 0.05,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "web" ? 30 : 45,
  },
  logo: {
    height: Platform.OS === "web" ? height * 0.22 : height * 0.2,
    width: Platform.OS === "web" ? width * 0.4 : width * 0.5,
    resizeMode: "contain",
    marginTop: Platform.OS === "web" ? -10 : -20,
  },
  contentContainer: {
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 20,
  },
  scrollContainer: {
    alignItems: "center",
    paddingBottom: 100,
  },
  storeName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
  },
  address: {
    fontSize: 18,
    paddingTop: 5,
    textAlign: "center",
    color: "#000000",
  },
  storeImage: {
    width: 300,
    height: 120,
    marginVertical: 15,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 0,
  },
  button: {
    marginVertical: 20,
    marginHorizontal: 50,
  },
  buttonImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  cartPrice: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
    marginTop: 10,
    marginBottom: 10,
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  bottomIcon: {
    width: 30,
    height: 30,
  },
  LocationIcon: {
    width: 30,
    height: 30,
    tintColor: "#0F872B",
  },
});

export default SupermarketBranch;
