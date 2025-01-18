import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import axios from "axios";
import config from "../config";
import ProductList from "./ProductList";

const { width, height } = Dimensions.get("window");

const ProductSearch = ({ shoppingAddress, userMail }) => {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavorites = async () => {
    try {
      const apiUrl = `http://${config.apiServer}/api/favorite/favorite/mail/${userMail}`;
      const response = await axios.get(apiUrl);

      const data = response.data;
      setFavorites(data);
    } catch (error) {
      console.error("Error fetching favorites:", error.message);
      setFavorites([]);
    }
  };

  useEffect(() => {
    if (userMail) {
      fetchFavorites();
    }
  }, [userMail]);

  const fetchProducts = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("שגיאה", "יש להזין מילה לחיפוש");
      return;
    }

    fetchFavorites();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://${
          config.apiServer
        }/api/product/productsFromSearch/?term=${encodeURIComponent(
          searchTerm
        )}&shopping_address=${encodeURIComponent(shoppingAddress)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const updatedProducts = data.map((product, index) => {
        const isFavorite = favorites.some(
          (fav) => fav.name === product.label && fav.image === product.image
        );
        return {
          ...product,
          id: index,
          quantity: 1,
          starColor: isFavorite ? "#FFD700" : "#D9D9D9",
        };
      });

      setProducts(updatedProducts);
    } catch (error) {
      setError(error.message || "שגיאה בטעינת המוצרים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarClickOn = async (product) => {
    if (!product.label || !product.image || !userMail) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }
    addFavoriteProduct(product);
  };

  const addFavoriteProduct = async (product) => {
    const newFavoriteProduct = {
      name: product.label,
      image: product.image,
      mail: userMail,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/favorite/favorite/`;
      const response = await axios.post(apiUrl, newFavoriteProduct);

      if (response.status >= 200 && response.status < 300) {
        
        const res = response.data;
        if (res.message === "Product added to favorites successfully.") {
          Alert.alert("הצלחה", "המוצר נוסף למועדפים בהצלחה!");
        } else if (
          res.message === "This product is already in the user's favorites."
        ) {
          Alert.alert("שים לב", "המוצר שבחרת כבר נמצא במועדפים!");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert("שגיאה", "נכשל להוסיף מוצר למועדפים. נסה שוב.");
      console.error("Error message:", error.message);
    }
  };

  const handleStarClickOff = async (product) => {
    if (!product.label || !product.image || !userMail) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }
    removeFavoriteProduct(product);
  };

  const removeFavoriteProduct = async (product) => {
    try {
      const removeFavoriteProduct = {
        name: product.label,
        image: product.image,
        mail: userMail
      };
      const apiUrl = `http://${config.apiServer}/api/favorite/favorite/byDetails/`;
      const response = await axios.delete(apiUrl, {data: removeFavoriteProduct});
    } catch (error) {
      Alert.alert("שגיאה", "נכשל להסיר מוצר מהמועדפים. נסה שוב.");
      console.error("Error message:", error.message);
    }
  };

  const handleQuantityChange = (id, change) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id
          ? { ...product, quantity: Math.max(product.quantity + change, 0) }
          : product
      )
    );
  };

  const toggleStarColor = (id) => {
    const product = products.find((p) => p.id === id);
    if (!product) {
      console.error("Product not found.");
      return;
    }
    
    if (product.starColor == "#D9D9D9"){
      handleStarClickOn(product);
    } else {
      handleStarClickOff(product);
    }
    
    console.log("toggle search");

    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id
          ? {
              ...product,
              starColor:
                product.starColor === "#D9D9D9" ? "#FFD700" : "#D9D9D9",
            }
          : product
      )
    );
  };

  return (
    <View>
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchButton} onPress={fetchProducts}>
          <Text style={styles.searchButtonText}>חפש</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="איזה מוצר או מותג לחפש?"
          placeholderTextColor="#AAAAAA"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
          onSubmitEditing={fetchProducts}
        />
      </View>

      {/* Render ProductList */}
      {!isLoading && products.length === 0 ? (
        <View style={styles.centerContent}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.description}>חפש מוצר שברצונך לרכוש</Text>
        </View>
      ) : (
        <ProductList
          products={products}
          isLoading={isLoading}
          onQuantityChange={handleQuantityChange}
          onToggleStar={toggleStarColor}
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
  searchButton: {
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

export default ProductSearch;
