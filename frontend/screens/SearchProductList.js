import React, { useState } from "react";
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
  Alert,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";
import config from "../config";

const { width, height } = Dimensions.get("window");

const SearchProductList = ({ shoppingAddress }) => {
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
          <Text style={styles.productText}>{item.label}</Text>
          <Image
            style={styles.productImage}
            source={imageSource}
            resizeMode="contain"
          />
        </View>
        <View style={styles.productContainerBottom}>
          <View onStartShouldSetResponder={() => toggleStarColor(item.id)}>
            <Svg
              height="30"
              width="30"
              viewBox="0 0 100 100"
              style={styles.star}
            >
              <Polygon
                points="50,10 61,38 90,38 66,57 74,85 50,70 26,85 34,57 10,38 39,38"
                fill={item.starColor}
                stroke="#000"
                strokeWidth="0.5"
              />
            </Svg>
          </View>

          <TouchableOpacity onPress={() => handleQuantityChange(item.id, -1)}>
            <Text style={styles.minusIcon}>-</Text>
          </TouchableOpacity>

          <Text style={styles.unitText}>יח'</Text>

          <View style={styles.quantityContainer}>
            <TextInput
              style={styles.quantityText}
              value={item.quantity.toString()}
              onChangeText={(value) => {
                const parsedValue = parseInt(value) || 0;
                handleQuantityChange(item.id, parsedValue - item.quantity);
              }}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity onPress={() => handleQuantityChange(item.id, 1)}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartText}>הוספה</Text>
          </TouchableOpacity>
        </View>
      </View>
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

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.description}>טוען מוצרים...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.flatListContent}
        />
      ) : (
        <View style={styles.centerContent}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.description}>חפש מוצר שברצונך לרכוש</Text>
        </View>
      )}
    </View>
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

  minusIcon: {
    position: "absolute",
    top: -28,
    left: -12,
    fontSize: 35,
    color: "#FF7E3E",
  },

  plusIcon: {
    position: "absolute",
    top: -25,
    fontSize: 32,
    color: "#FF7E3E",
  },

  quantityContainer: {
    width: 30,
    height: 40,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#FFFFFF",
    padding: 0,
    overflow: "hidden",
  },
  quantityText: {
    fontSize: 15,
    color: "#000000",
    textAlign: "center",
    textAlignVertical: "center",
    padding: 0,
    margin: 0,
    height: "100%",
    width: "100%",
  },

  unitText: {
    fontSize: 16,
    color: "#000000",
    marginHorizontal: 5,
    textAlign: "center",
  },

  star: {
    position: "absolute",
    top: -15,
    right: Platform.OS === "web" ? -395 : -197,
  },

  addToCartButton: {
    width: 85,
    borderRadius: 20,
    position: "absolute",
    left: 5,
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
    marginTop: 5,
  },
  searchButton: {
    marginTop: 0,
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
  loadingText: {
    fontSize: 18,
    color: "#FF7E3E",
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
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#FF7E3E",
    textAlign: "center", // ממורכז אופקית
    marginTop: 20, // ריווח מלמעלה
  },
  flatListContent: {
    alignItems: "center", // ממרכז את המוצרים
    paddingBottom: 80,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center", // ממרכז אנכית
    alignItems: "center", // ממרכז אופקית
  },
});

export default SearchProductList;
