import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Dimensions, Alert } from "react-native";
import config from "../config";
import ProductList from "./ProductList";

const { height } = Dimensions.get("window");

const ProductFavorites = ({ onProductsFetched, email }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `http://${config.apiServer}/api/favorite/favorite/mail/orismail@gmail.com`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! statusssss: ${response.status}`);
        }

        const data = await response.json();

        // Map the data to include required fields
        const updatedProducts = data.map((product, index) => ({
          id: product._id, // Using the product ID from the database
          label: product.name, // Using the name field as the label
          image: product.image || null, // Using the image field
          quantity: 1, // Default quantity
          starColor: "#FFD700", // Favorite items always have a golden star
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

  if (isLoading) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.loadingText}>טוען מוצרים מועדפים...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return <ProductList products={products} />;
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#FF7E3E",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default ProductFavorites;
