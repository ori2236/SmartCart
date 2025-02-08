import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import ProductListShopList from "./SupermarketBranchesList";
import config from "../../config";

const { width, height } = Dimensions.get("window");

const Supermarkets = ({ route }) => {
  const { userMail, cart } = route.params;
  const [supermarketBranches, setSupermarketBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCartProducts = async () => {
      setIsLoading(true);

      try {
        const apiUrl = `http://${config.apiServer}/api/supermarkets/supermarkets/${cart.cartKey}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (response.status == 200) {
          const supermarkets = data.map((branch) => ({
            Store: branch.Store,
            Address: branch.Address,
            price: branch.price,
            distance: branch.distance,
            final_score: branch.final_score,
            product_prices: branch.product_prices,
          }));
          setProducts(supermarkets);
        }
      } catch (error) {
        console.error("Error fetching supermarket branches:", error.message);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCartProducts();
  }, [userMail]);

  
  const handleBottomRow = (button) => {
    if (button == "home") {
      navigation.navigate("Home", { userMail });
    } else if (button == "addProducts") {
      navigation.navigate("AddProducts", { userMail, cart });
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>סניפי סופרים</Text>
        <Image
          source={require("../../assets/cart-profile.png")}
          style={styles.headerIcon}
        />
      </View>

      {/* Render SupermarketBranchesList */}
      {!isLoading && supermarketBranches.length === 0 ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>שנתחיל לקנות?</Text>
        </View>
      ) : (
        <SupermarketBranchesList
          supermarketBranches={supermarketBranches}
          isLoading={isLoading}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity>
          <Image
            source={require("../../assets/super-branches.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("shoppingCart")}>
          <Image
            source={require("../../assets/shopping-list.png")}
            style={styles.ShoppingCartIcon}
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
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#0F872B",
    height: height * 0.15,
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
    top: Platform.OS === "web" ? 30 : 55,
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
  ShoppingCartIcon: {
    width: 30,
    height: 30,
    tintColor: "#0F872B",
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
  loadingText: {
    fontSize: 18,
    color: "#FF7E3E",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Supermarkets;
