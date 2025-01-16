import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import SearchProductList from "./SearchProductList";
import ProductSearch from "./ProductSearch";
import ProductFavorites from "./ProductFavorites";
import ProductList from "./ProductList";

const { width, height } = Dimensions.get("window");

const AddProducts = () => {
  const [selectedTab, setSelectedTab] = useState("name"); // טאב נבחר כברירת מחדל
  const [products, setProducts] = useState([]); // מצב לאחסון המוצרים

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
    setProducts([]);
  };

  const handleProductsFetched = (fetchedProducts) => {
    setProducts(fetchedProducts); // עדכון המוצרים שנמשכו
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

  const handleToggleStar = (id) => {
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

  const renderContent = () => {
    if (selectedTab === "name") {
      return (
        <>
          <ProductSearch
            shoppingAddress="נתניה"
            onProductsFetched={handleProductsFetched}
          />
          {products.length > 0 && (
            <ProductList
              products={products}
              onQuantityChange={handleQuantityChange}
              onToggleStar={handleToggleStar}
            />
          )}
        </>
      );
    } else if (selectedTab === "favorites") {
      return (
        <>
          <ProductFavorites
            email="orismail@gmail.com"
            onProductsFetched={handleProductsFetched}
          />
          {products.length > 0 && (
            <ProductList
              products={products}
              onQuantityChange={handleQuantityChange}
              onToggleStar={handleToggleStar}
            />
          )}
        </>
      );
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>הוספת מוצר לעגלה</Text>
        <Image
          source={require("../assets/cart-profile.png")}
          style={styles.headerIcon}
        />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "favorites" && styles.activeTab]}
          onPress={() => handleTabPress("favorites")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "favorites" && styles.activeTabText,
            ]}
          >
            מועדפים
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "ai" && styles.activeTab]}
          onPress={() => handleTabPress("ai")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "ai" && styles.activeTabText,
            ]}
          >
            AI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "name" && styles.activeTab]}
          onPress={() => handleTabPress("name")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "name" && styles.activeTabText,
            ]}
          >
            שם
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity>
          <Image
            source={require("../assets/super-branches.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require("../assets/shopping-list.png")}
            style={styles.bottomIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require("../assets/add-products.png")}
            style={styles.addProductsIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require("../assets/home.png")}
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
    height: height * 0.15,
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    position: "absolute",
    right: 20,
    top: Platform.OS === "web" ? 30 : 55,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 25,
    marginHorizontal: 30,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === "web" ? 0 : 0.05,
    borderRadius: 20,
    borderColor: "#000000",
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 0,
  },
  activeTab: {
    backgroundColor: "#FF7E3E",
    borderRadius: 20,
    width: "100%",
  },
  tabText: {
    fontSize: 16,
    color: "#000000",
  },
  activeTabText: {
    color: "#FFFFFF",
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
  },

  bottomIcon: {
    width: 30,
    height: 30,
  },
  addProductsIcon: {
    width: 30,
    height: 30,
    tintColor: "#0F872B",
  },
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

export default AddProducts;