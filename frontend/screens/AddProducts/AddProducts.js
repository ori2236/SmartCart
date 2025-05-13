import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import ProductSearch from "./ProductSearch";
import ProductFavorites from "./ProductFavorites";
import ProductSuggestions from "./ProductSuggestions.js";
import { useNavigation } from "@react-navigation/native";

const AddProducts = ({ route }) => {
  const { userMail, cart } = route.params;
  const [selectedTab, setSelectedTab] = useState("name");
  const [products, setProducts] = useState([]);
  const navigation = useNavigation();

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
    setProducts([]);
  };

  const renderContent = () => {
    if (selectedTab === "name") {
      return (
        <>
          <ProductSearch userMail={userMail} cart={cart} />
        </>
      );
    } else if (selectedTab === "favorites") {
      return (
        <>
          <ProductFavorites userMail={userMail} cart={cart} />
        </>
      );
    } else if (selectedTab === "quickAdd") {
      return (
        <>
          <ProductSuggestions userMail={userMail} cart={cart} />
        </>
      );
    }
  };

  const handleBottomRow = (button) => {
    if (button == "home") {
      navigation.navigate("MyCarts");
    } else if (button == "shoppingCart") {
      navigation.navigate("ShoppingCart", { userMail, cart });
    } else if (button == "supermarkets") {
      navigation.navigate("Supermarkets", { userMail, cart });
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("CartInfo", {
              userMail,
              cart,
              originScreen: "AddProducts",
            })
          }
        >
          <Image
            source={require("../../assets/cart-profile.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>הוספת מוצר לעגלה</Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "favorites" && styles.activeTab]}
          onPress={() => handleTabPress("favorites")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "favorites" && styles.activeTabText,
            ]}
          >
            מועדפים
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "quickAdd" && styles.activeTab]}
          onPress={() => handleTabPress("quickAdd")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "quickAdd" && styles.activeTabText,
            ]}
          >
            המלצות
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "name" && styles.activeTab]}
          onPress={() => handleTabPress("name")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "name" && styles.activeTabText,
            ]}
          >
            שם
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity onPress={() => handleBottomRow("supermarkets")}>
          <Image
            source={require("../../assets/super-branches.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("shoppingCart")}>
          <Image
            source={require("../../assets/shopping-list.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require("../../assets/add-products.png")}
            style={styles.addProductsIcon}
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
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    backgroundColor: "#0F872B",
    height: 140,
    paddingHorizontal: 15,
    paddingBottom: 5,
    justifyContent: "space-between",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    marginBottom: 40,
  },

  tabContainer: {
    flexDirection: "row",
    marginTop: 25,
    marginHorizontal: 30,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === "web" ? 0 : 0.05,
    borderRadius: 20,
    borderColor: "#000000",
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 0,
  },
  activeTab: {
    backgroundColor: "#FF7E3E",
    borderRadius: 20,
    width: "100%",
  },
  tabText: {
    fontSize: 16,
    color: "#000000",
  },
  activeTabText: {
    color: "#FFFFFF",
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
    paddingBottom: 50,
  },

  bottomIcon: {
    width: 30,
    height: 30,
  },
  addProductsIcon: {
    width: 30,
    height: 30,
    tintColor: "#0F872B",
  },
});

export default AddProducts;
