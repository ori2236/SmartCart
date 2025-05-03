import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  PanResponder,
  Modal,
  ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import SupermarketBranchesList from "./SupermarketBranchesList";
import config from "../../config";

const { width, height } = Dimensions.get("window");
const SNAP_POINTS = [0, 0.5, 1];
const SLIDER_WIDTH = 225;
const THUMB_SIZE = 30;

const Supermarkets = ({ route }) => {
  const { userMail, cart } = route.params;
  const [supermarketBranches, setSupermarketBranches] = useState([]);
  const [recommendedRemovals, setRecommendedRemovals] = useState([]);
  const [product_images, setProduct_images] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const [alpha, setAlpha] = useState(0.5);
  const [thumbPosition, setThumbPosition] = useState(SLIDER_WIDTH / 2);

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    fetchSupermarketBranches(alpha);
  }, [alpha]);

  useEffect(() => {
    if (recommendedRemovals.length > 0) {
      setIsPopupVisible(true);
    }
  }, [recommendedRemovals]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      let newX = Math.max(
        0,
        Math.min(SLIDER_WIDTH, thumbPosition + gestureState.dx)
      );
      setThumbPosition(newX);
    },
    onPanResponderRelease: () => {
      const closestSnap = SNAP_POINTS.reduce((prev, curr) =>
        Math.abs(curr * SLIDER_WIDTH - thumbPosition) <
        Math.abs(prev * SLIDER_WIDTH - thumbPosition)
          ? curr
          : prev
      );

      const newAlpha =
        closestSnap === 0 ? 0.25 : closestSnap === 0.5 ? 0.5 : 0.75;
      setAlpha(newAlpha);
      setThumbPosition(closestSnap * SLIDER_WIDTH);

      fetchSupermarketBranches(newAlpha);
    },
  });

  const fetchSupermarketBranches = async (selectedAlpha) => {
    setIsLoading(true);

    const address = cart.address;
    const info = {
      address: address,
      alpha: selectedAlpha,
    };

    try {
      const apiUrl = `http://${config.apiServer}/api/supermarkets/supermarkets/${cart.cartKey}`;
      const response = await axios.post(apiUrl, info);
      const data = response.data;
      if (response.status == 200) {
        const data = response.data;

        if (!data.supermarkets || data.supermarkets.length === 0) {
          setSupermarketBranches([]);
          setRecommendedRemovals(data.recommendations || []);
          setProduct_images(data.product_images || []);
          return;
        }

        const supermarkets = data.supermarkets.map((branch) => ({
          Store: branch.Store,
          Address: branch.Address,
          price: branch.price,
          distance: branch.distance,
          final_score: branch.final_score,
          product_prices: branch.product_prices,
          logo: branch.logo,
        }));

        setRecommendedRemovals(data.recommendations);
        setSupermarketBranches(supermarkets);
        const product_images = data.product_images.map((prod) => ({
          name: prod.name,
          image: prod.image,
        }));
        setProduct_images(product_images);
      }
    } catch (error) {
      console.error("Error fetching supermarket branches:", error.message);
      setSupermarketBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBottomRow = (button) => {
    if (button == "home") {
      navigation.navigate("MyCarts");
    } else if (button == "addProducts") {
      navigation.navigate("AddProducts", { userMail, cart });
    } else if (button == "shoppingCart") {
      navigation.navigate("ShoppingCart", { userMail, cart });
    }
  };

  return (
    <View style={styles.backgroundColor}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>סנן לפי מחיר ומרחק</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("CartInfo", {
              userMail,
              cart,
              originScreen: "Supermarkets",
            })
          }
          style={styles.cartIconWrapper}
        >
          <Image
            source={require("../../assets/cart-profile.png")}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Slider */}
      <View style={styles.sliderRow}>
        <Text style={styles.sliderSideText}>מרחק</Text>

        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderBar} />
            <View
              style={[
                styles.sliderThumb,
                { left: thumbPosition - THUMB_SIZE / 2 },
              ]}
              {...panResponder.panHandlers}
            />
          </View>
        </View>

        <Text style={styles.sliderSideText}>מחיר</Text>
      </View>

      {/* Render SupermarketBranchesList */}
      {!isLoading && supermarketBranches.length === 0 ? (
        <View style={styles.centerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.description}>שנתחיל לקנות?</Text>
        </View>
      ) : (
        <SupermarketBranchesList
          supermarketBranches={supermarketBranches}
          isLoading={isLoading}
          product_images={product_images}
          userMail={userMail}
          cart={cart}
        />
      )}

      {/* Popup Modal */}
      <Modal
        transparent={true}
        visible={isPopupVisible}
        animationType="fade"
        onRequestClose={() => setIsPopupVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              כדי שנוכל להמליץ לך על יותר סניפי סופרים כדאי להסיר או לשנות מס’
              מוצרים בעגלה.
            </Text>
            <Text style={styles.modalSubtitle}>
              מוצרים שכדאי להסיר / לשנות:
            </Text>
            <ScrollView style={styles.productList}>
              {recommendedRemovals.map((product, index) => (
                <Text key={index} style={styles.productText}>
                  • {product}
                </Text>
              ))}
            </ScrollView>
            <View style={styles.buttons}>
              <TouchableOpacity onPress={() => handleBottomRow("shoppingCart")}>
                <Image
                  source={require("../../assets/shopping-list.png")}
                  style={styles.cartButton}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsPopupVisible(false)}
              >
                <Text style={styles.closeButtonText}>הבנתי</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity>
          <Image
            source={require("../../assets/super-branches.png")}
            style={styles.LocationIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleBottomRow("shoppingCart")}>
          <Image
            source={require("../../assets/shopping-list.png")}
            style={styles.bottomIcon}
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
  },
  cartIconWrapper: {
    position: "absolute",
    top: 55,
    right: 20,
    zIndex: 10,
  },

  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  sliderSideText: {
    fontSize: 18,
    color: "#555",
    marginHorizontal: 20,
    fontWeight: "bold",
    top: -2,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    alignItems: "center",
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#DDD",
    borderRadius: 4,
    position: "absolute",
  },
  sliderThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FF7E3E",
    top: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productList: {
    maxHeight: 150,
  },
  productText: {
    fontSize: 14,
    textAlign: "right",
    width: "100%",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 15,
  },
  cartButton: {
    tintColor: "#FF7E3E",
    width: 40,
    height: 40,
  },
  closeButton: {
    backgroundColor: "#0F872B",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginStart: 100,
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
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
  LocationIcon: {
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
  loadingText: {
    fontSize: 18,
    color: "#FF7E3E",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Supermarkets;
