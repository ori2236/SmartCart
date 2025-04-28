import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TextInput,
  Image,
} from "react-native";
import axios from "axios";
import config from "../../config";
import ProductListAddProd from "./ProductListAddProd";

const { height } = Dimensions.get("window");

const ProductFavorites = ({ userMail, cart }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [debounceTimeouts, setDebounceTimeouts] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = `http://${config.apiServer}/api/favorite/favorite/${userMail}/${cart.cartKey}`;
        const response = await axios.get(apiUrl);

        if (response.status !== 200) {
          throw new Error(`error fetching favorite products`);
        }

        const data = await response.data;

        const updatedProducts = data.map((product) => ({
          productId: product.productId,
          label: product.name,
          image: product.image || null,
          quantity: product.isInCart
            ? product.quantityInCart || 1
            : product.quantityInFavorites || 1,
          starColor: "#FFD700",
          isInCart: product.isInCart || false,
        }));
        setFilteredProducts(updatedProducts);
        setProducts(updatedProducts);
      } catch (error) {
        setError(error.message || "שגיאה בטעינת המוצרים המועדפים");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, [userMail]);

  const handleStarClickOff = async (product) => {
    if (!product.label || !product.image || !userMail) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    try {
      const apiUrl = `http://${config.apiServer}/api/favorite/favorite/${product.productId}/${userMail}`;
      const response = await axios.delete(apiUrl);

      if (response.status === 200) {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p.productId !== product.productId)
        );
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert("שגיאה", "נכשל להסיר מוצר מהמועדפים. נסה שוב.");
      console.error("Error message:", error.message);
    }
  };

  const handleQuantityChange = (productId, change) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    const newQuantity = Math.max(product.quantity + change, 0);

    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.productId === productId
          ? { ...product, quantity: newQuantity }
          : product
      )
    );

    setFilteredProducts((prevFilteredProducts) =>
      prevFilteredProducts.map((product) =>
        product.productId === productId
          ? { ...product, quantity: newQuantity }
          : product
      )
    );

    if (debounceTimeouts[productId]) {
      clearTimeout(debounceTimeouts[productId]);
    }

    const timeout = setTimeout(() => {
      updateQuantityInDatabase(productId, newQuantity);
    }, 500);

    setDebounceTimeouts((prev) => ({ ...prev, [productId]: timeout }));
  };

  const updateQuantityInDatabase = async (productId, quantity) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    try {
      const apiUrl = `http://${config.apiServer}/api/favorite/favorite/${productId}/${userMail}`;
      const response = await axios.put(apiUrl, { quantity });
      if (response.status !== 200) {
        throw new Error(`can not update quantity`);
      }
    } catch (error) {
      console.error("Error updating quantity:", error.message);
    }
  };

  const toggleStarColor = (productId) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) {
      console.error("Product not found.");
      return;
    }

    if (product.starColor === "#FFD700") {
      handleStarClickOff(product);
    }

    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.productId !== productId)
    );
    setFilteredProducts((prevFiltered) =>
      prevFiltered.filter((p) => p.productId !== productId)
    );
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

  return (
    <View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חפש מוצר במועדפים"
          placeholderTextColor="#AAAAAA"
          value={searchTerm}
          onChangeText={handleSearch}
        />
      </View>

      {/* Render ProductList */}
      {!isLoading && products.length === 0 ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>לא נמצאו מוצרים במועדפים</Text>
        </View>
      ) : (
        <ProductListAddProd
          products={filteredProducts}
          isLoading={isLoading}
          onQuantityChange={handleQuantityChange}
          onToggleStar={toggleStarColor}
          cart={cart}
          mail={userMail}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
});

export default ProductFavorites;
