import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: "#E6F2FF",
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
  webLoadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  webLoadingText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  webEmptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  webEmptyText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  webQuickStats: {
    width: 320,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 24,
    ...(Platform.OS === "web"
      ? ({
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
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
    color: COLORS.primary,
  },
  mobileLoadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileLoadingText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  mobileEmptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileEmptyText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

