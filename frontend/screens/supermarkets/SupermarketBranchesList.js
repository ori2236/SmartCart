import React from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const ProductListShopList = ({ supermarketBranches, isLoading }) => {
  const renderProduct = ({ item }) => {
    return (
      <View style={styles.supermarketsContainer}>

      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContent}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <Text style={styles.description}>טוען מוצרים...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={supermarketBranches}
      renderItem={renderProduct}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.flatListContent}
    />
  );
};


const styles = StyleSheet.create({
  productContainer: {
    flexDirection: "column",
    justifyContent: "center",
    padding: 10,
    margin: 5,
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
    justifyContent: "center",
    borderBottomColor: "#CCCCCC",
    borderBottomWidth: 1,
    backgroundColor: "#FFFFFF",
    height: 110,
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
  productImage: {
    width: 95,
    height: 95,
    borderRadius: 5,
    position: "absolute",
    right: -15,
  },
  productContainerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    height: 40,
  },
  trashIcon: {
    position: "absolute",
    top: -15,
    right: Platform.OS === "web" ? -395 : -190,
  },
  minusIcon: {
    position: "absolute",
    top: -28,
    left: -12,
    fontSize: 35,
    color: "#FF7E3E",
  },
  unitText: {
    fontSize: 16,
    color: "#000000",
    marginHorizontal: 5,
    textAlign: "center",
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
    overflow: "hidden",
  },
  quantityText: {
    fontSize: 15,
    color: "#000000",
    textAlign: "center",
    padding: 0,
    margin: 0,
    height: "100%",
    width: "100%",
  },
  plusIcon: {
    position: "absolute",
    top: -25,
    fontSize: 32,
    color: "#FF7E3E",
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
  flatListContent: {
    alignItems: "center",
    paddingBottom: 400,
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

export default ProductListShopList;
