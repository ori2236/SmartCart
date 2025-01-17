import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import config from "../config";
import ProductList from "./ProductList";

const { height } = Dimensions.get("window");

const ProductFavorites = ({ onProductsFetched, email, selectedTab }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
        setIsLoading(true);
        setError(null);

        try {
        const response = await fetch(
            `http://${config.apiServer}/api/favorite/favorite/mail/orismail@gmail.com`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const updatedProducts = data.map((product, index) => ({
            id: product._id,
            label: product.name,
            image: product.image || null,
            quantity: 1,
            starColor: "#FFD700",
        }));

        setProducts(updatedProducts);
        } catch (error) {
        setError(error.message || "שגיאה בטעינת המוצרים המועדפים");
        } finally {
        setIsLoading(false);
        }
    };
    fetchFavorites();
  }, [email, onProductsFetched]);


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
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.description}>
            לא נמצאו מוצרים במועדפים המשוייכים לחיפוש זה
          </Text>
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
