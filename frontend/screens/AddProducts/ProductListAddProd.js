import React, { useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";
import axios from "axios";
import config from "../../config";

const { width, height } = Dimensions.get("window");

const ProductListAddProd = ({
  products,
  isLoading,
  onQuantityChange,
  onToggleStar,
  cart,
}) => {
  const [cartProducts, setCartProducts] = useState([]);
  const [buttonStates, setButtonStates] = useState([]);

  useEffect(() => {
    setButtonStates((prevState) => {
      const updatedStates = { ...prevState };

      products.forEach((product) => {
        if (!updatedStates[product.productId]) {
          const inCart = cartProducts.find(
            (cartProd) => cartProd.productId === product.productId
          );
          updatedStates[product.productId] = {
            isAdded: !!inCart,
            isUpdated: false,
            originalQuantity: inCart ? inCart.quantity : 0,
          };
        }
      });

      return updatedStates;
    });
  }, [products, cartProducts]);

  useEffect(() => {
    fetchCartProducts();
  }, []);

  const fetchCartProducts = async () => {
    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/cartKey/${cart.cartKey}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.message === "No products found for the provided cartKey.") {
        setCartProducts([]);
      } else {
        const cartProductsData = data.map((product) => ({
          productId: product.productId,
          label: product.name,
          image: product.image || null,
          quantity: product.quantity,
        }));
        setCartProducts(cartProductsData);
      }
    } catch (error) {
      console.error("Error fetching cart products:", error.message);
      setCartProducts([]);
    }
  };

  const updateButtonState = (productId, state) => {
    setButtonStates((prevState) => ({
      ...prevState,
      [productId]: { ...prevState[productId], ...state },
    }));
  };

  const handleAddProductToCart = async (product) => {
    const name = product.label;
    const image = product.image;
    const cartKey = cart.cartKey;
    const quantity = product.quantity;
    const newProd = {
      name,
      image,
      cartKey,
      quantity,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart`;
      const response = await axios.post(apiUrl, newProd);
      if (response.status >= 200 && response.status < 300) {
        Alert.alert("הצלחה", "המוצר נוסף לעגלה בהצלחה!");
        product.productId = response.data._id;
        updateButtonState(product.productId, {
          isAdded: true,
          isUpdated: false,
          originalQuantity: quantity,
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // if the product already in the cart update it
        try {
          const updatedProd = {
            name: product.label,
            image: product.image,
            cartKey: cart.cartKey,
            quantity: product.quantity,
          };

          existingProductId = error.response.data.productId;
          console.log(existingProductId);
          const updateUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cartKey}/${existingProductId}`;
          const updateRes = await axios.put(updateUrl, { quantity });

          if (updateRes.status === 200) {
            product.productId = existingProductId;
            updateButtonState(product.productId, {
              isAdded: true,
              isUpdated: false,
              originalQuantity: quantity,
            });
          }
        } catch (updateError) {
          console.error("Error updating product to cart:", updateError.message);
        }
      } else {
        console.error("Error adding product to cart:", error.message);
      }
    }
  };

  const handleUpdateProductInCart = async (product) => {
    const quantity = product.quantity;

    try {
      const putUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cart.cartKey}/${product.productId}`;
      const putResponse = await axios.put(putUrl, { quantity });

      if (putResponse.status === 200) {
        Alert.alert("הצלחה", "הכמות עודכנה בהצלחה!");
        updateButtonState(product.productId, {
          isUpdated: false,
          originalQuantity: quantity,
        });
        return;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // if the product not in the cart re-add it
        try {
          const newProd = {
            name: product.label,
            image: product.image,
            cartKey: cart.cartKey,
            quantity: product.quantity,
          };

          const postUrl = `http://${config.apiServer}/api/productInCart/productInCart`;
          const postResponse = await axios.post(postUrl, newProd);

          if (postResponse.status >= 200 && postResponse.status < 300) {
            product.productId = postResponse.data._id;
            updateButtonState(product.productId, {
              isAdded: true,
              isUpdated: false,
              originalQuantity: quantity,
            });
          }
        } catch (postError) {
          console.error("Error re-adding product to cart:", postError.message);
        }
      } else {
        console.error("Error updating product quantity:", error.message);
      }
    }
  };

  const handleQuantityChangeAndUpdate = (productId, change) => {
    onQuantityChange(productId, change);

    const product = products.find((prod) => prod.productId === productId);
    const newQuantity = product.quantity + change;

    if (newQuantity === buttonStates[productId]?.originalQuantity) {
      updateButtonState(productId, { isUpdated: false });
    } else if (buttonStates[productId]?.isAdded) {
      updateButtonState(productId, { isUpdated: true });
    }
  };

  const renderProduct = ({ item }) => {
    const { isAdded, isUpdated } = buttonStates[item.productId] || {};

    return (
      <View style={styles.productContainer}>
        <View style={styles.productContainerTop}>
          <Text style={styles.productText}>{item.label}</Text>
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
        <View style={styles.productContainerBottom}>
          <View onStartShouldSetResponder={() => onToggleStar(item.productId)}>
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

          <TouchableOpacity
            onPress={() => handleQuantityChangeAndUpdate(item.productId, -1)}
          >
            <Text style={styles.minusIcon}>-</Text>
          </TouchableOpacity>

          <Text style={styles.unitText}>יח'</Text>

          <View style={styles.quantityContainer}>
            <TextInput
              style={styles.quantityText}
              value={item.quantity.toString()}
              onChangeText={(value) => {
                const parsedValue = parseInt(value) || 0;
                handleQuantityChangeAndUpdate(
                  item.productId,
                  parsedValue - item.quantity
                );
              }}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            onPress={() => handleQuantityChangeAndUpdate(item.productId, +1)}
          >
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              {
                backgroundColor: isUpdated
                  ? "#0F872B"
                  : isAdded
                  ? "#CCCCCC"
                  : "#0F872B",
              },
            ]}
            onPress={() => {
              if (isAdded && !isUpdated) {
                return;
              }
              isAdded && isUpdated
                ? handleUpdateProductInCart(item)
                : handleAddProductToCart(item);
            }}
          >
            <Text
              style={[
                styles.addToCartText,
                { color: isUpdated || !isAdded ? "#FFFFFF" : "#0F872B" },
              ]}
            >
              {isUpdated ? "עדכון" : isAdded ? "עדכון" : "הוספה"}
            </Text>
          </TouchableOpacity>
        </View>
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
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item.productId.toString()}
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
  star: {
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

export default ProductListAddProd;
