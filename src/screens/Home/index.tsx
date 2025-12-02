import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { getRecentActivities } from "../../api/mockData";
import BottomNavigation from "../../components/BottomNavigation";
import DashboardLayout from "../../components/DashboardLayout";
import FeatureCard from "../../components/FeatureCard";
import RecentActivityCard from "../../components/RecentActivityCard";
import Text from "../../components/Text";
import UserMenu from "../../components/UserMenu";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { storage } from "../../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [isUserMenuVisible, setIsUserMenuVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // Get current user from storage (real login)
  const [currentUserName, setCurrentUserName] = useState<string>("A");

  // Responsive breakpoint
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === "web" && width < 768;

  // Load user name from storage once
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const user = await storage.getUser();
        if (user?.name) {
          setCurrentUserName(user.name);
        }
      } catch {
        // ignore, keep default name
      }
    };

    loadUserName();
  }, []);

  // Get recent activities from mock data (based on ERD)
  const recentActivities = useMemo(() => getRecentActivities(), []);

  // Feature cards (static UI elements)
  const features = [
    {
      icon: "upload",
      title: "Tải lên câu hỏi",
      description: "Thêm câu hỏi mới, trích xuất từ file, ảnh",
    },
    {
      icon: "folder",
      title: "Quản lý câu hỏi",
      description: "Tìm kiếm câu hỏi và Quản lý bộ câu hỏi",
    },
    {
      icon: "file-text",
      title: "Tạo & Quản lý đề thi",
      description: "Tổ chức thi online, chấm điểm tự động,",
    },
    {
      icon: "book",
      title: "Công cụ học tập",
      description: "Flashcards, bảng trắng, bài kiểm tra",
    },
  ];

  
  // User Menu handlers
  const handleAvatarPress = () => {
    setIsUserMenuVisible(true);
  };

  const handleLogout = () => {
    setIsUserMenuVisible(false);
    // Navigate to Login screen
    navigation.navigate("Login");
  };

  const handleSettings = () => {
    setIsUserMenuVisible(false);
    // TODO: Navigate to Settings screen
    console.log("Navigate to Settings");
  };

  const handlePremium = () => {
    setIsUserMenuVisible(false);
    // TODO: Navigate to Premium screen
    console.log("Navigate to Premium");
  };

  // Sidebar menu items
  const menuItems = [
    { name: "Dashboard", icon: "square", label: "Dashboard", route: "Home" },
    { name: "Upload", icon: "upload", label: "Tải lên", route: "Upload" },
    { name: "Search", icon: "search", label: "Tìm kiếm", route: "Search" },
    { name: "ExamMainPage", icon: "file-text", label: "Đề thi", route: "ExamMainPage" },
    { name: "Study", icon: "book-open", label: "Học tập", route: null },
  ];

  const handleMenuClick = (route: string | null) => {
    if (route) {
      navigation.navigate(route as any);
    } else {
      // Navigate to LearningTools for Study
      navigation.navigate("LearningTools" as any);
    }
  };

  // Content component - will be wrapped in DashboardLayout
  const dashboardContent = (
    <>
      {/* Welcome Section */}
      <View style={styles.webWelcomeSection}>
        <Text variant="bold" style={styles.webWelcomeTitle}>
          Xin chào, {currentUserName}! 👋
        </Text>
        <Text style={styles.webWelcomeSubtitle}>
          Hôm nay bạn muốn bắt đầu với việc gì?
        </Text>
      </View>

      {/* Feature Cards Grid */}
      <View style={styles.webFeatureGrid}>
        {features.map((feature, index) => {
          const iconColors = ["#8B5CF6", "#8B5CF6", "#8B5CF6", "#10B981"];
          const iconBackgrounds = ["#E8D5FF", "#E8D5FF", "#E8D5FF", "#D1FAE5"];
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.webFeatureCard,
                index === 0 && styles.webFeatureCardHighlighted,
              ]}
              onPress={
                feature.icon === "upload"
                  ? () => navigation.navigate("Upload")
                  : feature.icon === "folder"
                  ? () => navigation.navigate("QuestionManagement")
                  : feature.icon === "file-text"
                  ? () => navigation.navigate("ExamMainPage")
                  : feature.icon === "book"
                  ? () => navigation.navigate("LearningTools")
                  : undefined
              }
            >
              <View style={[styles.webFeatureCardIconContainer, { backgroundColor: iconBackgrounds[index] }]}>
                <Icon name={feature.icon as any} size={24} color={iconColors[index]} />
              </View>
              <Text variant="bold" style={styles.webFeatureCardTitle}>
                {feature.title}
              </Text>
              <Text style={styles.webFeatureCardDescription}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Section */}
      <View style={styles.webBottomSection}>
        {/* Recent Activities */}
        <View style={styles.webRecentActivities}>
          <View style={styles.webRecentActivitiesHeader}>
            <View style={styles.webRecentActivitiesTitleRow}>
              <Icon name="clock" size={20} color={COLORS.black} />
              <Text variant="bold" style={styles.webRecentActivitiesTitle}>
                Hoạt động gần đây
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.webViewAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.webRecentActivitiesList}>
            {recentActivities.slice(0, 3).map((activity) => {
              let iconName = "file-text";
              let iconColor = "#8B5CF6";
              let iconBg = "#E8D5FF";
              
              if (activity.type === "question") {
                iconName = "plus-circle";
                iconColor = COLORS.primary;
                iconBg = "#D6E8FF";
              } else if (activity.type === "exam") {
                iconName = "file-text";
                iconColor = "#8B5CF6";
                iconBg = "#E8D5FF";
              }
              
              if (activity.title.toLowerCase().includes("ôn tập") || 
                  activity.title.toLowerCase().includes("flashcard") ||
                  activity.description.toLowerCase().includes("flashcard")) {
                iconName = "book-open";
                iconColor = "#10B981";
                iconBg = "#D1FAE5";
              }
              
              return (
                <View key={activity.id} style={styles.webRecentActivityItem}>
                  <View style={[styles.webRecentActivityIcon, { backgroundColor: iconBg }]}>
                    <Icon name={iconName as any} size={20} color={iconColor} />
                  </View>
                  <View style={styles.webRecentActivityContent}>
                    <Text variant="bold" style={styles.webRecentActivityTitle}>
                      {activity.title}
                    </Text>
                    <Text style={styles.webRecentActivityDescription}>
                      {activity.description}
                    </Text>
                    <Text style={styles.webRecentActivityDate}>{activity.date}</Text>
                  </View>
                  <TouchableOpacity style={styles.webRecentActivityMore}>
                    <Icon name="more-vertical" size={18} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Stats Widget */}
        <View style={styles.webQuickStats}>
          <Text variant="bold" style={styles.webQuickStatsTitle}>
            Thống kê nhanh
          </Text>
          <View style={styles.webQuickStatsProgress}>
            <Text style={styles.webQuickStatsProgressLabel}>
              Tiến độ học tập tuần này của bạn
            </Text>
            <View style={styles.webQuickStatsProgressHeader}>
              <Text style={styles.webQuickStatsProgressSubLabel}>
                Câu hỏi đã làm
              </Text>
              <Text style={styles.webQuickStatsProgressValue}>24/50</Text>
            </View>
            <View style={styles.webQuickStatsProgressBar}>
              <View style={[styles.webQuickStatsProgressFill, { width: "48%" }]} />
            </View>
          </View>
          <View style={styles.webQuickStatsExams}>
            <Text style={styles.webQuickStatsExamsLabel}>Đề thi đã tạo</Text>
            <Text style={styles.webQuickStatsExamsValue}>3</Text>
          </View>
          <TouchableOpacity style={styles.webQuickStatsButton}>
            <Text style={styles.webQuickStatsButtonText}>
              Xem báo cáo chi tiết
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // Mobile content for mobile web
  const mobileContent = (
    <>
      {/* Welcome Section */}
      <View style={styles.mobileWelcomeSection}>
        <Text variant="bold" style={styles.mobileWelcomeTitle}>
          Xin chào, {currentUserName}! 👋
        </Text>
        <Text style={styles.mobileWelcomeSubtitle}>
          Hôm nay bạn muốn bắt đầu với việc gì?
        </Text>
      </View>

      {/* Feature Cards Grid */}
      <View style={styles.gridContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.gridItem}>
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onPress={
                feature.icon === "upload"
                  ? () => navigation.navigate("Upload")
                  : feature.icon === "folder"
                  ? () => navigation.navigate("QuestionManagement")
                  : feature.icon === "file-text"
                  ? () => navigation.navigate("ExamMainPage")
                  : feature.icon === "book"
                  ? () => navigation.navigate("LearningTools")
                  : undefined
              }
            />
          </View>
        ))}
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text variant="bold" style={styles.sectionTitle}>
          Hoạt động gần đây
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {recentActivities.map((activity) => (
            <RecentActivityCard
              key={activity.id}
              title={activity.title}
              description={activity.description}
              date={activity.date}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );

  // Web Layout - use DashboardLayout
  if (Platform.OS === "web") {
    // DashboardLayout will handle mobile/desktop responsive internally
    return (
      <DashboardLayout title="Tổng quan">
        {isMobileWeb ? mobileContent : dashboardContent}
      </DashboardLayout>
    );
  }

  // Native Mobile Layout - Complete separate layout
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Icon name="graduation-cap" size={24} color={COLORS.white} />
            </View>
            <Text variant="bold" style={styles.appName}>
              Question Hub
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="search" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
            >
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentUserName || "User"
                  )}&background=007AFF&color=fff`,
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.mobileWelcomeSection}>
        <Text variant="bold" style={styles.mobileWelcomeTitle}>
            Xin chào, {currentUserName}! 👋
          </Text>
          <Text style={styles.mobileWelcomeSubtitle}>
            Hôm nay bạn muốn bắt đầu với việc gì?
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.gridContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.gridItem}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                onPress={
                  feature.icon === "upload"
                    ? () => navigation.navigate("Upload")
                    : feature.icon === "folder"
                    ? () => navigation.navigate("QuestionManagement")
                    : feature.icon === "file-text"
                    ? () => navigation.navigate("ExamMainPage")
                  : feature.icon === "book"
                  ? () => navigation.navigate("LearningTools")
                    : undefined
                }
              />
            </View>
          ))}
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text variant="bold" style={styles.sectionTitle}>
            Hoạt động gần đây
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {recentActivities.map((activity) => (
              <RecentActivityCard
                key={activity.id}
                title={activity.title}
                description={activity.description}
                date={activity.date}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={"Home"}
      />

      {/* User Menu */}
      <UserMenu
        visible={isUserMenuVisible}
        user={{
          user_id: "",
          name: currentUserName,
          email: "",
          role: "student",
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  appName: {
    fontSize: 18,
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  mobileWelcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  mobileWelcomeTitle: {
    fontSize: 28,
    color: COLORS.black,
    marginBottom: 8,
  },
  mobileWelcomeSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.black,
    marginBottom: 16,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  // Web Styles
  webContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as any) : {}),
  },
  webSidebar: {
    width: 240,
    backgroundColor: "#F5F5F5",
    ...(Platform.OS === "web" ? ({ position: "fixed", left: 0, top: 0, bottom: 0 } as any) : {}),
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
    backgroundColor: "#E8D5FF",
  },
  webMenuIconSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.white,
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
    ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, zIndex: 100 } as any) : {}),
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
  },
  webContentInner: {
    padding: 32,
    width: "100%",
    ...(Platform.OS === "web" ? ({} as any) : { alignSelf: "center" }),
  },
  webWelcomeSection: {
    marginBottom: 32,
  },
  webWelcomeTitle: {
    fontSize: 32,
    color: COLORS.black,
    marginBottom: 8,
  },
  webWelcomeSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  webFeatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 32,
  },
  webFeatureCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" } as any) : {}),
  },
  webFeatureCardHighlighted: {
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  webFeatureCardIcon: {
    marginBottom: 16,
  },
  webFeatureCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  webFeatureCardTitle: {
    fontSize: 18,
    color: COLORS.black,
    marginBottom: 8,
  },
  webFeatureCardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  webBottomSection: {
    flexDirection: "row",
    gap: 24,
    ...(Platform.OS === "web" ? ({ display: "flex" } as any) : {}),
  },
  webRecentActivities: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" } as any) : {}),
  },
  webRecentActivitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  webRecentActivitiesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webRecentActivitiesTitle: {
    fontSize: 18,
    color: COLORS.black,
  },
  webViewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  webRecentActivitiesList: {
    gap: 0,
  },
  webRecentActivityItem: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    alignItems: "flex-start",
  },
  webRecentActivityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  webRecentActivityContent: {
    flex: 1,
  },
  webRecentActivityTitle: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 4,
  },
  webRecentActivityDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
    lineHeight: 20,
  },
  webRecentActivityDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  webRecentActivityMore: {
    padding: 4,
    alignSelf: "flex-start",
  },
  webQuickStats: {
    width: 320,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 24,
    ...(Platform.OS === "web"
      ? ({
          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
        } as any)
      : {}),
  },
  webQuickStatsTitle: {
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 8,
  },
  webQuickStatsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 24,
  },
  webQuickStatsProgress: {
    marginBottom: 20,
  },
  webQuickStatsProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  webQuickStatsProgressLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  webQuickStatsProgressSubLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  webQuickStatsProgressValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  webQuickStatsProgressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  webQuickStatsProgressFill: {
    height: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  webQuickStatsExams: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  webQuickStatsExamsLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  webQuickStatsExamsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
  },
  webQuickStatsButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  webQuickStatsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
});
