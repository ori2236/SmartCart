import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const { height } = Dimensions.get("window");

const SupermarketBranchesList = ({
  supermarketBranches,
  isLoading,
  product_images,
  userMail,
  cart,
}) => {
  const navigation = useNavigation();
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("SupermarketBranch", {
            name: item.Store,
            address: item.Address,
            logo: item.logo,
            price: item.price.toFixed(2),
            product_prices: item.product_prices,
            product_images: product_images,
            userMail,
            cart,
          })
        }
      >
        <View style={styles.supermarketsContainer}>
          <Text style={styles.column}>{item.distance.toFixed(2)} ק"מ</Text>
          <Text style={styles.column}>{item.price.toFixed(2)} ₪</Text>
          <Image
            style={styles.columnImage}
            source={
              item.logo
                ? {
                    uri: item.logo.startsWith("data:image")
                      ? item.logo
                      : `data:image/png;base64,${item.logo}`,
                  }
                : require("../../assets/logo.png")
            }
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>מרחק</Text>
        <Text style={styles.headerText}>מחיר עגלה</Text>
        <Text style={styles.headerText}>סופרמרקט</Text>
      </View>
      <FlatList
        data={supermarketBranches}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  supermarketsContainer: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
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
  container: {
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    padding: 10,
  },
  headerText: {
    flex: 1,
    color: "#000000",
    fontWeight: "bold",
    textAlign: "center",
  },
  column: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
  },
  columnImage: {
    flex: 1,
    textAlign: "center",
    height: 75,
  },
});

export default SupermarketBranchesList;
