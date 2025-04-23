import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import config from "../../config";

const { height } = Dimensions.get("window");

const ProductSuggestions = ({ cart, userMail }) => {
  const [products, setProducts] = useState([]);
  const [rejectedProducts, setRejectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProduct, setCurrentProduct] = useState({});
  const [isDone, setIsDone] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const apiUrl = `http://${config.apiServer}/api/suggestions/suggestions/${cart.cartKey}/${userMail}`;
        const response = await axios.get(apiUrl);

        if (response.status === 200) {
          if (response.data.length !== 0) {
            const putQuantity = response.data.map((product) => ({
              productId: product.productId,
              name: product.name,
              image: product.image || null,
              quantity: 1,
            }));
            setProducts(putQuantity);
            setCurrentProduct(putQuantity[0]);
          }
        }
      } catch (error) {
        console.error(error.message || "שגיאה בטעינת המוצרים המוצעים");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [cart]);

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(currentProduct.quantity + change, 0);
    setCurrentProduct((product) => ({ ...product, quantity: newQuantity }));
  };

  const handleAddProductToCart = async () => {
    const product = currentProduct;
    const productId = product.productId;
    const cartKey = cart.cartKey;
    const quantity = product.quantity;
    const mail = userMail;
    const newProd = {
      productId,
      cartKey,
      quantity,
      mail,
    };
    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/existProductInCart`;
      const response = await axios.post(apiUrl, newProd);
      if (response.status === 201) {
        setActionHistory((prev) => [
          ...prev,
          { type: "add", product: currentProduct },
        ]);
        handleNextProduct();
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleNextProduct = async () => {
    if (products.length <= 1) {
      setProducts([]);
      setCurrentProduct({});
      setIsDone(true);
      return;
    }

    const updatedProducts = products.slice(1); // without first product
    setProducts(updatedProducts);
    setCurrentProduct(updatedProducts[0]);
  };

  //add to rejected products
  const handleDontAddProductToCart = async () => {
    const cartKey = cart.cartKey;
    const productId = currentProduct.productId;
    const mail = userMail;
    const newRejectedProd = {
      cartKey,
      productId,
      mail,
    };
    try {
      const apiUrl = `http://${config.apiServer}/api/rejectedProducts/rejectedProducts`;
      const response = await axios.post(apiUrl, newRejectedProd);
      if (response.status === 201) {
        setActionHistory((prev) => [
          ...prev,
          { type: "reject", product: currentProduct },
        ]);
        handleNextProduct();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUndo = async () => {
    const lastAction = actionHistory[actionHistory.length - 1];
    if (!lastAction) return;

    try {
      const { product } = lastAction;
      const cartKey = cart.cartKey;
      const productId = product.productId;

      if (lastAction.type === "add") {
        const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cartKey}/${productId}`;
        await axios.delete(apiUrl);
      } else if (lastAction.type === "reject") {
        const mail = userMail;
        const apiUrl = `http://${config.apiServer}/api/rejectedProducts/rejectedProducts/${cartKey}/${productId}/${mail}`;
        await axios.delete(apiUrl);
      }

      setProducts((prev) => [product, ...prev]);
      setCurrentProduct(product);
      setIsDone(false);
      setActionHistory((prev) => prev.slice(0, -1));
    } catch (error) {
      console.error("Undo failed:", error.message);
    }
  };

  return (
    <View>
      {(products.length > 0 || actionHistory.length > 0) && !isLoading && (
        <TouchableOpacity onPress={handleUndo} style={styles.undoWrapper}>
          <MaterialCommunityIcons
            name="arrow-u-left-top"
            size={35}
            color="#FF7E3E"
          />
        </TouchableOpacity>
      )}
      {isLoading ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>טוען המלצות...</Text>
        </View>
      ) : isDone ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>אין עוד המלצות זמינות</Text>
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity style={styles.history} onPress={() => {}}>
              <Text style={styles.buttonText}>הצג כרשימה</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>לא נמצאו המלצות זמינות עבורך</Text>
        </View>
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.prodTitle}>{currentProduct.name}</Text>
          <View style={styles.product}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDontAddProductToCart()}
            >
              <Ionicons name="chevron-back" size={80} color="#FF7E3E" />
              <Text style={styles.nextProd}>לחץ למוצר הבא</Text>
            </TouchableOpacity>
            <Image
              source={
                currentProduct.image
                  ? {
                      uri: currentProduct.image.startsWith("data:image")
                        ? currentProduct.image
                        : `data:image/png;base64,${currentProduct.image}`,
                    }
                  : require("../../assets/logo.png")
              }
              style={styles.prodImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAddProductToCart()}
            >
              <Ionicons name="chevron-forward" size={80} color="#0F872B" />
              <Text style={styles.addToCart}>לחץ להוספה</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quantityRow}>
            <TouchableOpacity onPress={() => handleQuantityChange(-1)}>
              <Text style={styles.minusIcon}>-</Text>
            </TouchableOpacity>

            <Text style={styles.unitText}>יח'</Text>

            <View style={styles.quantityContainer}>
              <TextInput
                style={styles.quantityText}
                value={currentProduct.quantity.toString()}
                onChangeText={(value) => {
                  const parsedValue = parseInt(value) || 0;
                  handleQuantityChange(parsedValue - currentProduct.quantity);
                }}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity onPress={() => handleQuantityChange(1)}>
              <Text style={styles.plusIcon}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity style={styles.history} onPress={() => {}}>
              <Text style={styles.buttonText}>הצג כרשימה</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  undoWrapper: {
    position: "absolute",
    left: 20,
    top: 20,
  },
  prodTitle: {
    paddingTop: 110,
    paddingBottom: 30,
    textAlign: "center",
    fontSize: 18,
    color: "#000000",
    fontWeight: "bold",
    marginHorizontal: 30,
  },
  actionButton: {
    paddingTop: 50,
    flexDirection: "column",
    alignItems: "center",
  },
  nextProd: { paddingTop: 0 },
  addToCart: { paddingTop: 0 },
  product: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  prodImage: {
    paddingHorizontal: 20,
    width: 180,
    height: 150,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    height: 40,
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
  buttonText: {
    color: "#000",
    fontSize: 18,
  },
  history: {
    flexDirection: "row",
    width: "75%",
    backgroundColor: "#fff",
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: "center",
    borderColor: "#000",
    borderWidth: 1,
  },
});

export default ProductSuggestions;
