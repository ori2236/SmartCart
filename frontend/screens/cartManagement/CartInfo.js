import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import axios from "axios";
import config from "../../config";

const { width, height } = Dimensions.get("window");

const colorMap = {};
const colorPalette = [
  "#F28B82",
  "#81C995",
  "#AECBFA",
  "#FFF475",
  "#D7AEFB",
  "#FFD6A5",
];

const getColorForName = (name) => {
  if (!colorMap[name]) {
    const colorIndex = Object.keys(colorMap).length % colorPalette.length;
    colorMap[name] = colorPalette[colorIndex];
  }
  return colorMap[name];
};

const CartInfo = ({ route }) => {
  const { userMail, cart, originScreen } = route.params;
  const navigation = useNavigation();
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [cart]);

  const fetchUsers = async () => {
    try {
      const [userInCartRes, waitingListRes] = await Promise.all([
        axios.get(
          `http://${config.apiServer}/api/userInCart/userInCart/cartKey/${cart.cartKey}`
        ),
        axios.get(
          `http://${config.apiServer}/api/waitingList/waitingList/cartKey/${cart.cartKey}`
        ),
      ]);

      if (
        waitingListRes.data?.message ===
        "No users found for the provided cartKey."
      ) {
        setMembers([]);
      } else {
        const waitingListData = waitingListRes.data;
        const formattedRequests = waitingListData.map((u) => ({
          name: u.nickname,
          email: u.mail,
          isRequest: true,
          type: "request",
        }));

        setJoinRequests(formattedRequests);
      }

      if (
        userInCartRes.data?.message ===
        "No users found for the provided cartKey."
      ) {
        setMembers([]);
      } else {
        const userInCartData = userInCartRes.data;
        const formattedMembers = userInCartData.map((u) => ({
          name: u.nickname,
          role: u.role,
          email: u.mail,
          type: "member",
        }));

        setMembers(formattedMembers);
      }
    } catch (error) {
      Alert.alert("שגיאה", "טעינת המשתמשים נכשלה");
      console.error("fetchUsers error:", error);
    }
  };

  const handleLeaveCart = async () => {
    try {
      const apiUrl = `http://${config.apiServer}/api/userInCart/userInCart/${userMail}/${cart.cartKey}`;
      await axios.delete(apiUrl);
      navigation.navigate("MyCarts");
    } catch (error) {
      Alert.alert("שגיאה", "פעולת יציאה נכשלה");
      console.error("Leave cart error:", error);
    }
  };

  const handleCopyCartKey = async () => {
    try {
      const apiUrl = `http://${config.apiServer}/api/cart/cart/${cart.cartKey}`;
      const response = await axios.get(apiUrl);

      if (response.status === 200) {
        const cartId = response.data._id;
        await Clipboard.setStringAsync(cartId);
        Alert.alert("הצלחה", "מזהה העגלה הועתק ללוח");
      }
    } catch (error) {
      console.error("שגיאה בקבלת עגלה:", error.message);
      Alert.alert("שגיאה", "לא ניתן להעתיק את מזהה העגלה");
    }
  };

  const approveJoinRequest = async ({ mail }) => {
    const cartKey = cart.cartKey;
    try {
      const newUserInCart = {
        cartKey,
        mail,
      };
      const apiUrl = `http://${config.apiServer}/api/userInCart/userInCart`;
      const response = await axios.post(apiUrl, newUserInCart);

      if (response.status === 201) {
        Alert.alert("הצלחה", "המשתמש אושר והתווסף לעגלה");
        setJoinRequests((prev) => prev.filter((u) => u.email !== mail));
        fetchUsers();
      }
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "שגיאה כללית בהצטרפות";

      Alert.alert("שגיאה", message);
      console.error("approveJoinRequest error:", message);
    }
  };

  const approveAllRequests = async () => {
    if (joinRequests.length === 0) {
      Alert.alert("אין בקשות", "אין בקשות להצטרפות לעגלה.");
      return;
    }

    const cartKey = cart.cartKey;

    try {
      const results = await Promise.allSettled(
        joinRequests.map((user) =>
          axios.post(`http://${config.apiServer}/api/userInCart/userInCart`, {
            cartKey,
            mail: user.email,
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length === 0) {
        Alert.alert("הצלחה", "כל המשתמשים אושרו בהצלחה!");
      } else {
        Alert.alert(
          "שגיאה חלקית",
          `${failed.length} מתוך ${joinRequests.length} לא אושרו.`
        );
      }

      fetchUsers();
    } catch (error) {
      console.error("approveAllRequests error:", error);
      Alert.alert("שגיאה", "התרחשה שגיאה בעת אישור כל המשתמשים.");
    }
  };

  const roleOrder = { owner: 0, admin: 1, member: 2 };
  const sortedMembers = [...members].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role]
  );

  const combinedList = [
    { type: "header", title: `${sortedMembers.length} משתתפים` },
    ...sortedMembers.map((p) => ({ ...p, type: "member" })),
    { type: "header", title: `${joinRequests.length} בקשות הצטרפות` },
    ...joinRequests.map((r) => ({ ...r, isRequest: true, type: "request" })),
  ];

  const renderItem = ({ item }) => {
    if (item.type === "header") {
      return <Text style={styles.memberCount}>{item.title}</Text>;
    }

    return (
      <View style={styles.memberContainer}>
        <View style={styles.memberRow}>
          <View style={styles.avatarAndName}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: getColorForName(item.name) },
              ]}
            >
              <Ionicons name="person-outline" size={18} color="#333" />
            </View>
            <Text style={styles.memberName}>{item.name}</Text>
          </View>
          {item.isRequest ? (
            <View style={styles.requestActionsContainer}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() =>
                  approveJoinRequest({
                    mail: item.email,
                  })
                }
              >
                <Text style={styles.requestButtonText}>צרף</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton}>
                <Text style={styles.requestButtonText}>סרב</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.roleContainer}>
              <Text style={styles.memberRole}>
                {item.role?.charAt(0).toUpperCase() + item.role?.slice(1)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
    );
  };

  return (
    <View style={styles.backgroundColor}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate(originScreen, { userMail, cart })}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenterContainer}>
          <Text style={styles.headerText}>{cart.name}</Text>
          <Text style={styles.headerDescription}>{cart.address}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopyCartKey}
        >
          <Text style={styles.actionText}>שתף עגלה</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("ChangeInfo", { userMail, cart, originScreen })
          }
        >
          <Text style={styles.actionText}>עריכת עגלה</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={approveAllRequests}
        >
          <Text style={styles.actionText}>
            אשר את כולם ({joinRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={combinedList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.email || item.title}-${index}`}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCart}>
        <Text style={styles.leaveButtonText}>יציאה מהעגלה</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundColor: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-end",
    backgroundColor: "#0F872B",
    height: height * 0.24,
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 60,
  },
  headerCenterContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerDescription: {
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  actionButton: {
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    color: "#0F872B",
    fontWeight: "bold",
  },
  memberCount: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    marginRight: 15,
    marginVertical: 10,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 150,
  },
  memberContainer: {
    marginBottom: 10,
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  memberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarAndName: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  memberName: {
    fontSize: 16,
    color: "#000",
    marginRight: 5,
  },
  memberRole: {
    color: "#999",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "left",
  },
  memberEmail: {
    fontSize: 13,
    color: "#555",
    textAlign: "right",
    marginRight: 40,
    marginTop: 2,
  },
  roleContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: 5,
    minWidth: 70,
  },
  requestActionsContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginLeft: 5,
  },
  approveButton: {
    backgroundColor: "#0F872B",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rejectButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 10,
  },
  requestButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: "#FF3B30",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CartInfo;
