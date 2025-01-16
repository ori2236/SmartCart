import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const FavoritesProductList = ({  }) => {
  const email = "orismail@gmail.com";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch favorite products
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://${config.apiServer}/api/favorite/favorite/mail/${email}`
        );
        const data = await response.json();

        if (response.ok) {
          setProducts(data);
        } else {
          setError(data.error || "Failed to fetch favorite products.");
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchFavorites();
    }
  }, [email]);

  const renderProduct = ({ item }) => {
    const imageSource = item.image
      ? {
          uri: item.image.startsWith("data:image")
            ? item.image
            : `data:image/png;base64,${item.image}`,
        }
      : require("../assets/logo.png");

    return (
      <View style={styles.productContainer}>
        <View style={styles.productContainerTop}>
          <Text style={styles.productText}>{item.name}</Text>
          <Image
            style={styles.productImage}
            source={imageSource}
            resizeMode="contain"
          />
        </View>
        <View style={styles.productContainerBottom}>
          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartText}>הוספה</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <Text>טוען מוצרים מועדפים...</Text>;
  }

  if (error) {
    return <Text style={{ color: "red" }}>{error}</Text>;
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  );
};

const styles = StyleSheet.create({
  productImage: {
    width: 95,
    height: 95,
    borderRadius: 5,
    position: "absolute",
    right: -15,
  },
  productText: {
    fontSize: 14,
    textAlign: "right",
    flexShrink: 1,
    flexWrap: "wrap",
    color: "#000000",
    marginRight: 70,
    marginTop: 10,
    fontWeight: "bold",
  },
  productContainer: {
    flexDirection: "column",
    justifyContent: "center",
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    width: Platform.OS === "web" ? width * 0.5 : width * 0.9,
    paddingHorizontal: 20,
    height: 180,
    elevation: 2,
    overflow: "hidden",
  },
  productContainerTop: {
    flexDirection: "row",
    top: 0,
    justifyContent: "center",
    borderBottomColor: "#CCCCCC",
    borderBottomWidth: 1,
    backgroundColor: "#FFFFFF",
    height: 110,
  },
  productContainerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    height: 40,
  },
  addToCartButton: {
    width: 85,
    borderRadius: 20,
    backgroundColor: "#0F872B",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -12,
  },
  addToCartText: {
    fontSize: 15,
    color: "#FFFFFF",
    marginVertical: 7,
  },
});

export default FavoritesProductList;
