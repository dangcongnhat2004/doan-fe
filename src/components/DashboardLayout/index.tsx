import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import Text from "../Text";
import UserMenu from "../UserMenu";
import { storage } from "../../utils/storage";

type DashboardLayoutProps = {
  children: React.ReactNode;
  title?: string;
  showSearch?: boolean;
};

export default function DashboardLayout({
  children,
  title = "Tổng quan",
  showSearch = true,
}: DashboardLayoutProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [isUserMenuVisible, setIsUserMenuVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("Nguyễn Văn A");

  // Responsive breakpoints
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS === "web" && width < 768;
  const isNarrow = Platform.OS === "web" && width >= 768 && width < 900;
  const sidebarWidth = isNarrow ? 72 : 240;

  // Load current user from storage (real login)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await storage.getUser();
        if (user?.name) {
          setUserName(user.name);
        }
      } catch {
        // ignore, keep default
      }
    };
    loadUser();
  }, []);

  // Sidebar menu items
  const menuItems = [
    { name: "Dashboard", icon: "square", label: "Dashboard", route: "Home" },
    { name: "Upload", icon: "upload", label: "Tải lên", route: "Upload" },
    { name: "Search", icon: "search", label: "Tìm kiếm", route: "Search" },
    {
      name: "ExamMainPage",
      icon: "file-text",
      label: "Đề thi",
      route: "ExamMainPage",
    },
    { name: "Study", icon: "book-open", label: "Học tập", route: "LearningTools" },
  ];

  const currentRouteName = route.name;

  const handleMenuClick = (routeName: string | null) => {
    if (routeName) {
      navigation.navigate(routeName as any);
    } else {
      console.log("Coming soon");
    }
  };

  const handleAvatarPress = () => {
    setIsUserMenuVisible(true);
  };

  const handleLogout = () => {
    setIsUserMenuVisible(false);
    navigation.navigate("Login");
  };

  const handleSettings = () => {
    setIsUserMenuVisible(false);
    console.log("Navigate to Settings");
  };

  const handlePremium = () => {
    setIsUserMenuVisible(false);
    console.log("Navigate to Premium");
  };

  // Web Layout
  if (Platform.OS === "web") {
    // Mobile view: render mobile layout
    if (isMobile) {
      return (
        <View style={styles.mobileContainer}>
          {/* Mobile Header */}
          <View style={styles.mobileHeader}>
            <TouchableOpacity
              style={styles.mobileMenuButton}
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Icon name="menu" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text variant="bold" style={styles.mobileHeaderTitle}>
              {title}
            </Text>
            <TouchableOpacity style={styles.mobileHeaderBell} onPress={handleAvatarPress}>
              <Icon name="bell" size={20} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Mobile Sidebar Drawer */}
          {isMobileMenuOpen && (
            <>
              <TouchableOpacity
                style={styles.mobileDrawerOverlay}
                activeOpacity={1}
                onPress={() => setIsMobileMenuOpen(false)}
              />
              <View style={styles.mobileDrawer}>
                {/* Logo */}
                <View style={styles.mobileDrawerHeader}>
                  <View style={styles.webLogoSquare}>
                    <Text style={styles.webLogoText}>Q</Text>
                  </View>
                  <Text variant="bold" style={styles.webBrandName}>
                    QuestionHub
                  </Text>
                  <TouchableOpacity
                    style={styles.mobileDrawerClose}
                    onPress={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon name="x" size={24} color={COLORS.black} />
                  </TouchableOpacity>
                </View>

                {/* Navigation Menu */}
                <View style={styles.mobileDrawerMenu}>
                  {menuItems.map((item) => {
                    const isActive =
                      item.route === currentRouteName || item.name === currentRouteName;

                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[
                          styles.mobileDrawerItem,
                          isActive && styles.mobileDrawerItemActive,
                        ]}
                        onPress={() => {
                          handleMenuClick(item.route);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {isActive ? (
                          <View style={styles.webMenuIconSquare}>
                            <Icon name="check-square" size={16} color={COLORS.primary} />
                          </View>
                        ) : (
                          <Icon name={item.icon as any} size={20} color={COLORS.gray} />
                        )}
                        <Text
                          style={[
                            styles.mobileDrawerItemText,
                            isActive && styles.mobileDrawerItemTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* User Profile */}
                <View style={styles.mobileDrawerProfile}>
                  <TouchableOpacity onPress={handleAvatarPress}>
                    <View style={styles.webUserAvatar}>
                      <Text style={styles.webUserAvatarText}>
                        {userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.webUserInfo}>
                    <Text variant="bold" style={styles.webUserName}>
                      {userName}
                    </Text>
                    <Text style={styles.webUserRole}>Teacher Account</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Mobile Content */}
          <ScrollView
            style={styles.mobileContentScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mobileContentInner}>{children}</View>
          </ScrollView>

          {/* User Menu */}
          <UserMenu
            visible={isUserMenuVisible}
            user={{
              user_id: "",
              name: userName,
              email: "",
              role: "teacher",
              created_at: "",
            }}
            notificationsEnabled={notificationsEnabled}
            onClose={() => setIsUserMenuVisible(false)}
            onNotificationsToggle={setNotificationsEnabled}
            onSettingsPress={handleSettings}
            onPremiumPress={handlePremium}
            onLogoutPress={handleLogout}
          />
        </View>
      );
    }

    // Desktop/Tablet view
    return (
      <View style={styles.webContainer}>
        {/* Sidebar */}
        <View style={[styles.webSidebar, isNarrow && styles.webSidebarCollapsed, { width: sidebarWidth }]}> 
          {/* Logo */}
          <View style={styles.webSidebarHeader}>
            <View style={styles.webLogoSquare}>
              <Text style={styles.webLogoText}>Q</Text>
            </View>
            {!isNarrow && (
              <Text variant="bold" style={styles.webBrandName}>
                QuestionHub
              </Text>
            )}
          </View>

          {/* Navigation Menu */}
          <View style={styles.webMenu}>
            {menuItems.map((item) => {
              const isActive =
                item.route === currentRouteName || item.name === currentRouteName;

              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.webMenuItem,
                    isActive && styles.webMenuItemActive,
                    isNarrow && styles.webMenuItemCollapsed,
                  ]}
                  onPress={() => handleMenuClick(item.route)}
                >
                  {/* Icon wrapper: show small circle when collapsed */}
                  {isNarrow ? (
                    <View style={styles.webMenuIconCircle}>
                      <Icon name={isActive ? "check-square" : (item.icon as any)} size={18} color={isActive ? COLORS.primary : COLORS.gray} />
                    </View>
                  ) : isActive ? (
                    <View style={styles.webMenuIconSquare}>
                      <Icon name="check-square" size={16} color={COLORS.primary} />
                    </View>
                  ) : (
                    <Icon name={item.icon as any} size={20} color={COLORS.gray} />
                  )}

                  {!isNarrow && (
                    <Text
                      style={[
                        styles.webMenuItemText,
                        isActive && styles.webMenuItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* User Profile */}
          <View style={styles.webUserProfile}>
            <TouchableOpacity onPress={handleAvatarPress}>
              <View style={styles.webUserAvatar}>
                <Text style={styles.webUserAvatarText}>
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
            {!isNarrow && (
              <View style={styles.webUserInfo}>
                <Text variant="bold" style={styles.webUserName}>
                  {userName}
                </Text>
                <Text style={styles.webUserRole}>Teacher Account</Text>
              </View>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.webMainContent, { marginLeft: sidebarWidth }]}> 
          {/* Header Bar */}
          <View style={[styles.webHeader, isNarrow && styles.webHeaderCollapsed]}>
            <Text variant="bold" style={styles.webHeaderTitle}>
              {title}
            </Text>
            {showSearch && (
              <View style={[styles.webHeaderRight, isNarrow && styles.webHeaderRightCollapsed]}>
                <View style={styles.webHeaderSearch}>
                  <Icon
                    name="search"
                    size={18}
                    color={COLORS.gray}
                    style={styles.webHeaderSearchIcon}
                  />
                  <TextInput
                    style={styles.webHeaderSearchInput}
                    placeholder="Tìm kiếm câu hỏi, đề thi..."
                    placeholderTextColor={COLORS.gray}
                  />
                </View>
                <TouchableOpacity style={styles.webHeaderBell}>
                  <Icon name="bell" size={20} color={COLORS.black} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content Area - This will change based on the screen */}
          <ScrollView
            style={styles.webContentScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.webContentInner}>{children}</View>
          </ScrollView>
        </View>

        {/* User Menu */}
        <UserMenu
          visible={isUserMenuVisible}
          user={{
            user_id: "",
            name: userName,
            email: "",
            role: "teacher",
            created_at: "",
          }}
          notificationsEnabled={notificationsEnabled}
          onClose={() => setIsUserMenuVisible(false)}
          onNotificationsToggle={setNotificationsEnabled}
          onSettingsPress={handleSettings}
          onPremiumPress={handlePremium}
          onLogoutPress={handleLogout}
        />
      </View>
    );
  }

  // Mobile Layout - just return children
  return <View style={{ flex: 1 }}>{children}</View>;
}

const styles = StyleSheet.create({
  // Web Styles
  webContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as any) : {}),
  },
  webSidebar: {
    width: 240,
    backgroundColor: COLORS.white,
    ...(Platform.OS === "web"
      ? ({ position: "fixed", left: 0, top: 0, bottom: 0, borderRightWidth: 1, borderRightColor: COLORS.borderGray } as any)
      : {}),
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  webSidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  webLogoSquare: {
    width: 40,
    height: 40,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  webLogoText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  webBrandName: {
    fontSize: 18,
    color: COLORS.black,
  },
  webMenu: {
    flex: 1,
  },
  webMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    gap: 12,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  webMenuItemActive: {
    backgroundColor: "#F3E8FF",
  },
  webMenuIconSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  webMenuItemText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
  },
  webMenuItemTextActive: {
    color: COLORS.black,
    fontWeight: "600",
  },
  webUserProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  webUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  webUserAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  webUserInfo: {
    flex: 1,
  },
  webUserName: {
    fontSize: 15,
    color: COLORS.black,
    marginBottom: 2,
  },
  webUserRole: {
    fontSize: 12,
    color: COLORS.gray,
  },
  webMainContent: {
    flex: 1,
    marginLeft: 240,
    backgroundColor: "#F8F9FA",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as any) : {}),
  },
  webHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    ...(Platform.OS === "web"
      ? ({ position: "sticky", top: 0, zIndex: 100 } as any)
      : {}),
  },
  webHeaderTitle: {
    fontSize: 24,
    color: COLORS.black,
  },
  webHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  webHeaderSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: 300,
  },
  webHeaderSearchIcon: {
    marginRight: 12,
  },
  webHeaderSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  webHeaderBell: {
    padding: 8,
  },
  webContentScroll: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  webContentInner: {
    padding: Platform.OS === "web" ? 40 : 32,
    width: "100%",
    ...(Platform.OS === "web" ? ({
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
    } as any) : {}),
  },
  webSidebarCollapsed: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  webMenuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  webMenuItemCollapsed: {
    justifyContent: "center",
    paddingVertical: 10,
  },
  webHeaderCollapsed: {
    paddingHorizontal: 12,
  },
  webHeaderRightCollapsed: {
    display: "none",
  },
  // Mobile Styles
  mobileContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    ...(Platform.OS === "web" ? ({ 
      minHeight: "100vh",
      height: "100vh",
      overflow: "hidden",
    } as any) : {}),
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    ...(Platform.OS === "web"
      ? ({ 
        position: "sticky", 
        top: 0, 
        zIndex: 100,
        height: 57,
        minHeight: 57,
      } as any)
      : {}),
  },
  mobileMenuButton: {
    padding: 8,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    color: COLORS.black,
    flex: 1,
    textAlign: "center",
  },
  mobileHeaderBell: {
    padding: 8,
  },
  mobileDrawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    ...(Platform.OS === "web" ? ({ 
      position: "fixed",
      width: "100%",
      height: "100%",
      cursor: "pointer",
    } as any) : {}),
  },
  mobileDrawer: {
    width: 280,
    height: "100%",
    backgroundColor: COLORS.white,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    zIndex: 1001,
    ...(Platform.OS === "web" ? ({ 
      position: "fixed", 
      left: 0, 
      top: 0, 
      bottom: 0,
      boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
    } as any) : {}),
  },
  mobileDrawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
    position: "relative",
  },
  mobileDrawerClose: {
    position: "absolute",
    right: 0,
    padding: 4,
  },
  mobileDrawerMenu: {
    flex: 1,
  },
  mobileDrawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    gap: 12,
    ...(Platform.OS === "web" ? ({ 
      cursor: "pointer",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
    } as any) : {}),
  },
  mobileDrawerItemActive: {
    backgroundColor: "#F3E8FF",
  },
  mobileDrawerItemText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "500",
  },
  mobileDrawerItemTextActive: {
    color: COLORS.black,
    fontWeight: "600",
  },
  mobileDrawerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  mobileContentScroll: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    ...(Platform.OS === "web" ? ({
      flex: 1,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      height: "calc(100vh - 57px)",
      maxHeight: "calc(100vh - 57px)",
    } as any) : {}),
  },
  mobileContentInner: {
    padding: 20,
    paddingBottom: 60,
    width: "100%",
    ...(Platform.OS === "web" ? ({
      boxSizing: "border-box",
      minHeight: "100%",
    } as any) : {}),
  },
});

