import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  Image
} from "react-native";
import config from "../config";
import ProductList from "./ProductList";

const { width, height } = Dimensions.get("window");


const ProductSearch = ({ shoppingAddress }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("שגיאה", "יש להזין מילה לחיפוש");
      return;
    }

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
      const updatedProducts = data.map((product, index) => ({
        ...product,
        id: index,
        quantity: 1,
        starColor: "#D9D9D9",
      }));

      setProducts(updatedProducts);
    } catch (error) {
      setError(error.message || "שגיאה בטעינת המוצרים");
    } finally {
      setIsLoading(false);
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
