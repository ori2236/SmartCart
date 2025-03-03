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
import ProductListShopList from "./ProductListShopList";
import config from "../../config";

const { width, height } = Dimensions.get("window");

const ShoppingCart = ({ route }) => {
  const { userMail, cart } = route.params;
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debounceTimeouts, setDebounceTimeouts] = useState({});
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCartProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/cartKey/${cart.cartKey}`;
        const response = await axios.get(apiUrl);
        const data = response.data;
  
        if (data.message === "No products found for the provided cartKey.") {
          setProducts([]);
          setFilteredProducts([]);
        } else {
          const cartProducts = data.map((product) => ({
            id: product.productId,
            label: product.name,
            image: product.image || null,
            quantity: product.quantity,
          }));
          setFilteredProducts(cartProducts);
          setProducts(cartProducts);
        }
      } catch (error) {
        console.error("Error fetching cart products:", error.message);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCartProducts();
  }, [userMail]);


  const handleQuantityChange = (id, change) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const newQuantity = Math.max(product.quantity + change, 0);
    
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id ? { ...product, quantity: newQuantity } : product
      )
    );

    setFilteredProducts((prevFilteredProducts) =>
      prevFilteredProducts.map((product) =>
        product.id === id ? { ...product, quantity: newQuantity } : product
      )
    );
    if (debounceTimeouts[id]) {
      clearTimeout(debounceTimeouts[id]);
    }

    const timeout = setTimeout(() => {
      updateQuantityInDatabase(id, newQuantity);
    }, 500);

    setDebounceTimeouts((prev) => ({ ...prev, [id]: timeout }));
  };

  const updateQuantityInDatabase = async (productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cart.cartKey}/${productId}`;
      const response = await axios.put(apiUrl, { quantity });
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating quantity:", error.message);
    }
  };
    
  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.label.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };  

  const handleRemoveProductFromCart = async (productId) => {
    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cart.cartKey}/${productId}`;
      const response = await axios.delete(apiUrl);
      if (response.status == 200) {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p.id !== productId)
        );
        setFilteredProducts((prevFiltered) =>
          prevFiltered.filter((p) => p.id !== productId)
        );
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert("שגיאה", "נכשל להסיר מוצר מהמועדפים. נסה שוב.");
      console.error("Error message:", error.message);
    }
  };

  const handleBottomRow = (button) => {
    if (button == "home") {
      navigation.navigate("Home", { userMail });
    } else if (button == "addProducts") {
      navigation.navigate("AddProducts", { userMail, cart });
    } else if (button == "supermarkets") {
      navigation.navigate("Supermarkets", { userMail, cart });
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/cart-profile.png")}
          style={styles.headerIcon}
        />
        <View style={styles.headerHead}>
          <Text style={styles.headerText}>עגלת קניות</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="חפש מוצר בעגלת קניות"
              placeholderTextColor="#AAAAAA"
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      </View>
      <Text style={styles.cartName}>{cart.name}</Text>

      {/* Render ProductList */}
      {!isLoading && products.length === 0 ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>שנתחיל לקנות?</Text>
        </View>
      ) : (
        <ProductListShopList
          products={filteredProducts}
          isLoading={isLoading}
          onQuantityChange={handleQuantityChange}
          onRemoveProductFromCart={handleRemoveProductFromCart}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity onPress={() => handleBottomRow("supermarkets")}>
          <Image
            source={require("../../assets/super-branches.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
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
    height: height * 0.23,
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  headerHead: {
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
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
    position: "absolute",
    right: 20,
    top: Platform.OS === "web" ? 30 : 55,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 7,
    marginTop: 10,
    marginBottom: 10,
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
  },
  cartName: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom:25,
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

export default ShoppingCart;