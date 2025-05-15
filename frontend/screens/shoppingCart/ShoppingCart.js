import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import axios from "axios";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import ProductListShopList from "./ProductListShopList";
import { io } from "socket.io-client";
import config from "../../config";

const { height } = Dimensions.get("window");

const ShoppingCart = ({ route }) => {
  const { userMail, cart } = route.params;
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userNickname, setUserNickname] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debounceTimeouts, setDebounceTimeouts] = useState({});
  const navigation = useNavigation();
  const [actionHistory, setActionHistory] = useState([]);
  const userNicknameRef = useRef(null);

  const socket = io(`http://${config.apiServer}`);

  useEffect(() => {
    socket.emit("joinCart", cart.cartKey);

    socket.on("cartUpdated", (update) => {
      if (update.type === "add") {
        const exists = products.find((p) => p.id === update.product.productId);
        if (!exists) {
          const newProduct = {
            id: update.product.productId,
            label: update.product.name,
            image: update.product.image,
            quantity: update.product.quantity,
            updatedBy:
              update.product.updatedBy === userNicknameRef.current
                ? "את/ה"
                : update.product.updatedBy,
          };
          setProducts((prev) => [...prev, newProduct]);
          setFilteredProducts((prev) => [...prev, newProduct]);
        }
      } else if (update.type === "update") {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === update.productId
              ? {
                  ...p,
                  quantity: update.quantity,
                  updatedBy: update.updatedBy || p.updatedBy,
                }
              : p
          )
        );

        setFilteredProducts((prev) =>
          prev.map((p) =>
            p.id === update.productId
              ? {
                  ...p,
                  quantity: update.quantity,
                  updatedBy: update.updatedBy || p.updatedBy,
                }
              : p
          )
        );
      } else if (update.type === "remove") {
        setProducts((prev) => prev.filter((p) => p.id !== update.productId));
        setFilteredProducts((prev) =>
          prev.filter((p) => p.id !== update.productId)
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [cart.cartKey]);

  useEffect(() => {
    const fetchCartProducts = async () => {
      setIsLoading(true);

      try {
        const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cart.cartKey}?userMail=${userMail}`;
        const response = await axios.get(apiUrl);
        const { userNickname, products: data } = response.data;

        if (data.message === "No products found for the provided cartKey.") {
          setProducts([]);
          setFilteredProducts([]);
        } else {
          setUserNickname(userNickname);
          userNicknameRef.current = userNickname;
          const cartProducts = data.map((product) => ({
            id: product.productId,
            label: product.name,
            image: product.image || null,
            quantity: product.quantity,
            updatedBy:
              product.updatedBy === userNicknameRef.current
                ? "את/ה"
                : product.updatedBy,
          }));

          setFilteredProducts(cartProducts);
          setProducts(cartProducts);
        }
      } catch (error) {
        console.error("Error fetching cart products:", error.message);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCartProducts();
  }, [userMail]);

  const handleQuantityChange = (id, change) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const newQuantity = Math.max(product.quantity + change, 0);

    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id ? { ...product, quantity: newQuantity } : product
      )
    );

    setFilteredProducts((prevFilteredProducts) =>
      prevFilteredProducts.map((product) =>
        product.id === id ? { ...product, quantity: newQuantity } : product
      )
    );
    if (debounceTimeouts[id]) {
      clearTimeout(debounceTimeouts[id]);
    }

    const timeout = setTimeout(() => {
      updateQuantityInDatabase(id, newQuantity);
    }, 500);

    setDebounceTimeouts((prev) => ({ ...prev, [id]: timeout }));
  };

  const updateQuantityInDatabase = async (productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cart.cartKey}/${productId}`;
      const response = await axios.put(apiUrl, { quantity, mail: userMail });
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === productId ? { ...p, updatedBy: "את/ה" } : p
        )
      );

      setFilteredProducts((prevFiltered) =>
        prevFiltered.map((p) =>
          p.id === productId ? { ...p, updatedBy: "את/ה" } : p
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error.message);
    }
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

  const handleRemoveProductFromCart = async (productId) => {
    try {
      const apiUrl = `http://${config.apiServer}/api/productInCart/productInCart/${cart.cartKey}/${productId}/${userMail}`;
      const response = await axios.delete(apiUrl);
      if (response.status == 200) {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p.id !== productId)
        );
        setFilteredProducts((prevFiltered) =>
          prevFiltered.filter((p) => p.id !== productId)
        );
        const deletedProduct = products.find((p) => p.id === productId);

        setActionHistory((prev) => [
          ...prev,
          {
            type: "remove",
            product: deletedProduct,
          },
        ]);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert("שגיאה", "נכשל להסיר מוצר מהעגלה. נסה שוב.");
      console.error("Error message:", error.message);
    }
  };

  const handleBought = async (productId) => {
    try {
      const boughtProduct = {
        cartKey: cart.cartKey,
        productId,
        mail: userMail,
      };
      const apiUrl = `http://${config.apiServer}/api/cartHistory/cartHistory`;
      const response = await axios.post(apiUrl, boughtProduct);
      if (response.status == 201) {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p.id !== productId)
        );
        setFilteredProducts((prevFiltered) =>
          prevFiltered.filter((p) => p.id !== productId)
        );

        const bought = products.find((p) => p.id === productId);

        setActionHistory((prev) => [
          ...prev,
          {
            type: "bought",
            product: bought,
          },
        ]);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert("שגיאה", "נכשל להסיר מוצר מהעגלה. נסה שוב.");
      console.error("Error message:", error.message);
    }
  };

  const handleUndo = async () => {
    const lastAction = actionHistory[actionHistory.length - 1];
    if (!lastAction) return;

    try {
      if (lastAction.type === "bought") {
        const undoData = {
          cartKey: cart.cartKey,
          productId: lastAction.product.id,
          quantity: lastAction.product.quantity,
          mail: userMail,
        };
        const apiUrl = `http://${config.apiServer}/api/cartHistory/cartHistory`;
        const response = await axios.delete(apiUrl, { data: undoData });
        if (response.status !== 200) {
          console.error(response);
        }
      }

      if (lastAction.type === "remove") {
        const undoData = {
          cartKey: cart.cartKey,
          productId: lastAction.product.id,
          quantity: lastAction.product.quantity,
          mail: userMail,
          explaination: "undo",
        };
        const apiUrl = `http://${config.apiServer}/api/productInCart/existngProduct`;
        const response = await axios.post(apiUrl, undoData);
        if (response.status !== 201) {
          console.error(response);
        }
      }

      setActionHistory((prev) => prev.slice(0, -1));
    } catch (error) {
      console.error("Undo failed:", error.message);
    }
  };

  const handleBottomRow = (button) => {
    if (button == "home") {
      navigation.navigate("MyCarts");
    } else if (button == "addProducts") {
      navigation.navigate("AddProducts", { userMail, cart });
    } else if (button == "supermarkets") {
      navigation.navigate("Supermarkets", { userMail, cart });
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("CartInfo", {
              userMail,
              cart,
              originScreen: "ShoppingCart",
            })
          }
          style={styles.cartIconWrapper}
        >
          <Image
            source={require("../../assets/cart-profile.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>

        <View style={styles.headerHead}>
          <Text style={styles.headerText}>עגלת קניות</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="חפש מוצר בעגלת קניות"
              placeholderTextColor="#AAAAAA"
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        <View style={{ width: 36, height: 36 }} />
      </View>

      <View style={styles.cartNameRow}>
        {(products.length > 0 || actionHistory.length > 0) && !isLoading && (
          <TouchableOpacity onPress={handleUndo} style={styles.undoWrapper}>
            <MaterialCommunityIcons
              name="arrow-u-left-top"
              size={40}
              color="#FF7E3E"
            />
          </TouchableOpacity>
        )}
        <Text style={styles.cartName}>{cart.name}</Text>
      </View>

      {/* Render ProductList */}
      {!isLoading && products.length === 0 ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>שנתחיל לקנות?</Text>
        </View>
      ) : (
        <ProductListShopList
          products={filteredProducts}
          isLoading={isLoading}
          onQuantityChange={handleQuantityChange}
          onRemoveProductFromCart={handleRemoveProductFromCart}
          onBought={handleBought}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity onPress={() => handleBottomRow("supermarkets")}>
          <Image
            source={require("../../assets/super-branches.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require("../../assets/shopping-list.png")}
            style={styles.ShoppingCartIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("addProducts")}>
          <Image
            source={require("../../assets/add-products.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("home")}>
          <Image
            source={require("../../assets/home.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#0F872B",
    height: height * 0.23,
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  headerHead: {
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
  },
  cartIconWrapper: {
    position: "absolute",
    top: 55,
    right: 20,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 7,
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
  cartNameRow: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 25,
    paddingTop: 5,
  },
  cartName: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  undoWrapper: {
    position: "absolute",
    left: 20,
    top: 10,
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingBottom: 50,
  },
  bottomIcon: {
    width: 30,
    height: 30,
  },
  ShoppingCartIcon: {
    width: 30,
    height: 30,
    tintColor: "#0F872B",
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ShoppingCart;
