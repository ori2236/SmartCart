import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

const SupermarketProductsList = ({ product_images, product_prices }) => {
  const renderItem = ({ item }) => {
    const productPrice = product_prices[item.name] || "לא זמין";
    return (
      <View style={styles.productContainer}>
        <Text style={styles.productPrice}>
          {productPrice !== "לא זמין"
            ? `${productPrice.toFixed(2)} ₪`
            : "לא זמין"}
        </Text>

        <Text style={styles.productName}>{item.name}</Text>

        <Image
          style={styles.productImage}
          source={
            item.image
              ? {
                  uri: item.image.startsWith("data:image")
                    ? item.image
                    : `data:image/png;base64,${item.image}`,
                }
              : require("../../assets/logo.png")
          }
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <FlatList
      data={product_images}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
    />
  );
};

const styles = StyleSheet.create({
  productContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
    justifyContent: "space-between",
    width: width * 0.9,
    alignSelf: "center",
  },
  productImage: {
    width: 50,
    height: 50,
  },
  productName: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
});

export default SupermarketProductsList;
