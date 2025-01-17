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

const ProductList = ({
  products,
  isLoading,
  onQuantityChange,
  onToggleStar,
  selectedTab,
}) => {
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
          <View onStartShouldSetResponder={() => onToggleStar(item.id)}>
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

          <TouchableOpacity onPress={() => onQuantityChange(item.id, -1)}>
            <Text style={styles.minusIcon}>-</Text>
          </TouchableOpacity>

          <Text style={styles.unitText}>יח'</Text>

          <View style={styles.quantityContainer}>
            <TextInput
              style={styles.quantityText}
              value={item.quantity.toString()}
              onChangeText={(value) => {
                const parsedValue = parseInt(value) || 0;
                onQuantityChange(item.id, parsedValue - item.quantity);
              }}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity onPress={() => onQuantityChange(item.id, 1)}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartText}>הוספה</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContent}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.description}>טוען מוצרים...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
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
  star: {
    position: "absolute",
    top: -15,
    right: Platform.OS === "web" ? -395 : -197,
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


export default ProductList;
