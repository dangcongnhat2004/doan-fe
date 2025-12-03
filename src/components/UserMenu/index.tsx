import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  Animated,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Text from "../Text";
import { COLORS } from "../../constants/colors";
import { User } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

type UserMenuProps = {
  visible: boolean;
  user: User;
  notificationsEnabled: boolean;
  onClose: () => void;
  onNotificationsToggle: (value: boolean) => void;
  onSettingsPress: () => void;
  onPremiumPress: () => void;
  onLogoutPress: () => void;
};

export default function UserMenu({
  visible,
  user,
  notificationsEnabled,
  onClose,
  onNotificationsToggle,
  onSettingsPress,
  onPremiumPress,
  onLogoutPress,
}: UserMenuProps) {
  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=007AFF&color=fff&size=128`,
                }}
                style={styles.avatar}
              />
              <Text variant="bold" style={styles.userName}>
                {user.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {/* Settings */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <Icon name="settings" size={20} color={COLORS.black} />
              <Text style={styles.menuItemText}>Cài đặt</Text>
            </TouchableOpacity>

            {/* Premium */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onPremiumPress}
              activeOpacity={0.7}
            >
              <Icon name="star" size={20} color={COLORS.black} />
              <Text style={styles.menuItemText}>Premium</Text>
            </TouchableOpacity>

            {/* Notifications */}
            <View style={styles.menuItem}>
              <Icon name="bell" size={20} color={COLORS.black} />
              <Text style={styles.menuItemText}>Thông báo</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={onNotificationsToggle}
                trackColor={{ false: "#E5E5E5", true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Logout */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onLogoutPress}
              activeOpacity={0.7}
            >
              <Icon name="log-out" size={20} color="#DC3545" />
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D6E8FF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 4,
    marginHorizontal: 16,
  },
  logoutText: {
    color: "#DC3545",
  },
});

