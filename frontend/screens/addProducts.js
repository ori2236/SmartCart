import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ShoppingCartScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("name");

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
  };

  const handleIconPress = (iconName) => {
    Alert.alert(iconName);
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>הוספת מוצר לעגלה</Text>
        <Image
          source={require("../assets/cart-profile.png")}
          style={styles.headerIcon}
        />
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
          style={[styles.tab, selectedTab === "ai" && styles.activeTab]}
          onPress={() => handleTabPress("ai")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "ai" && styles.activeTabText,
            ]}
          >
            AI
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>חפש</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="איזה מוצר או מותג לחפש?"
          placeholderTextColor="#AAAAAA"
        />
      </View>

      {/* Logo and Description */}
      <Image source={require("../assets/logo.jpeg")} style={styles.logo} />
      <Text style={styles.description}>חפש מוצר שברצונך לרכוש</Text>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity onPress={() => handleIconPress("Shopping List 1")}>
          <Image
            source={require("../assets/super-branches.png")}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleIconPress("Shopping List 2")}>
          <Image
            source={require("../assets/shopping-list.png")}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleIconPress("Add Products")}>
          <Image
            source={require("../assets/add-products.png")}
            style={styles.addProductsIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleIconPress("Home")}>
          <Image
            source={require("../assets/home.png")}
            style={styles.navIcon}
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
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#0F872B",
    height: height * 0.17,
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    position: "absolute",
    right: 20,

    top: Platform.OS === "web" ? 30 : 45,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#F9F9F9",
    textAlignVertical: "center",
    marginTop: 15,
  },
  searchButton: {
    marginTop: 10,
    marginRight: 10,
    backgroundColor: "#FF7E3E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  logo: {
    alignSelf: "center",
    width: 180,
    height: 150,
    marginTop: height * 0.13,
    marginBottom: 7,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    color: "#333333",
    fontWeight: "bold",
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

  navIcon: {
    width: 30,
    height: 30,
  },
  addProductsIcon: {
    width: 30,
    height: 30,
    tintColor: "#0F872B",
  },
});

export default ShoppingCartScreen;
