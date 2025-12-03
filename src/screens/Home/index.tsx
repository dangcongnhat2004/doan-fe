import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { getExams } from "../../api/examService";
import { getQuestionSets } from "../../api/questionService";
import { RecentActivity } from "../../types";
import BottomNavigation from "../../components/BottomNavigation";
import DashboardLayout from "../../components/DashboardLayout";
import FeatureCard from "../../components/FeatureCard";
import RecentActivityCard from "../../components/RecentActivityCard";
import Text from "../../components/Text";
import UserMenu from "../../components/UserMenu";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { storage } from "../../utils/storage";
import { styles } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [isUserMenuVisible, setIsUserMenuVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // Get current user from storage (real login)
  const [currentUserName, setCurrentUserName] = useState<string>("A");
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [completedQuestions, setCompletedQuestions] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [totalExams, setTotalExams] = useState<number>(0);

  // Responsive breakpoint
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === "web" && width < 768;

  // Format date to Vietnamese format (DD/MM/YYYY)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Load user name, recent activities, and stats from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user name
        const user = await storage.getUser();
        if (user?.name) {
          setCurrentUserName(user.name);
        }

        // Load recent activities and stats
        if (user?.id) {
          setIsLoadingActivities(true);
          
          // Fetch exams and question sets in parallel
          const [examsResponse, questionSetsResponse] = await Promise.allSettled([
            getExams({ created_by: user.id, limit: 10, offset: 0 }),
            getQuestionSets(user.id),
          ]);

          const activities: RecentActivity[] = [];
          let totalQuestionsInExams = 0;
          let totalCompletedQuestions = 0;
          const processedExamIds = new Set<string>();

          // Process exams
          if (examsResponse.status === "fulfilled" && examsResponse.value.exams) {
            setTotalExams(examsResponse.value.exams.length);
            
            // Get exam progress for each exam to count completed questions
            for (const exam of examsResponse.value.exams) {
              totalQuestionsInExams += exam.questions_count;
              processedExamIds.add(exam.exam_id);
              
              // Get progress from storage
              const progress = await storage.getExamProgress(exam.exam_id);
              if (progress && progress.answers) {
                totalCompletedQuestions += progress.answers.length;
              }
              
              activities.push({
                id: `exam_${exam.exam_id}`,
                type: "exam",
                title: exam.title,
                description: `Đã tạo đề thi mới với ${exam.questions_count} câu hỏi`,
                date: formatDate(exam.created_at),
                exam_id: exam.exam_id,
              });
            }
          }

          // Also check all exam progress in storage (for exams user has taken, not just created)
          // This ensures we count all questions user has answered, even from exams they didn't create
          if (typeof window !== "undefined" && window.localStorage) {
            // Get all exam progress from localStorage
            for (let i = 0; i < window.localStorage.length; i++) {
              const key = window.localStorage.key(i);
              if (key && key.startsWith("@exam_progress_")) {
                try {
                  const data = JSON.parse(window.localStorage.getItem(key) || "{}");
                  if (data.answers && Array.isArray(data.answers) && data.examId) {
                    // Only count if we haven't processed this exam yet
                    if (!processedExamIds.has(data.examId)) {
                      totalCompletedQuestions += data.answers.length;
                      processedExamIds.add(data.examId);
                    }
                  }
                } catch (e) {
                  console.error("Error parsing exam progress from localStorage:", e);
                }
              }
            }
          }

          // Process question sets
          if (questionSetsResponse.status === "fulfilled" && questionSetsResponse.value.sets) {
            questionSetsResponse.value.sets.forEach((set) => {
              activities.push({
                id: `question_set_${set.set_id}`,
                type: "question",
                title: set.title,
                description: `${set.question_count} câu hỏi mới đã được thêm vào bộ câu hỏi`,
                date: formatDate(set.created_at),
                question_count: set.question_count,
              });
            });
          }

          // Sort by date (newest first)
          activities.sort((a, b) => {
            const dateA = new Date(a.date.split("/").reverse().join("-"));
            const dateB = new Date(b.date.split("/").reverse().join("-"));
            return dateB.getTime() - dateA.getTime();
          });

          setRecentActivities(activities);
          setCompletedQuestions({
            completed: totalCompletedQuestions,
            total: totalQuestionsInExams || 50, // Default to 50 if no exams
          });
        }
      } catch (error) {
        console.error("Error loading recent activities:", error);
        // Keep empty array on error
        setRecentActivities([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    loadData();
  }, []);

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
          const iconColors = [COLORS.primary, COLORS.primary, COLORS.primary, COLORS.primary];
          const iconBackgrounds = ["#D6E8FF", "#D6E8FF", "#D6E8FF", "#D6E8FF"];
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.webFeatureCard}
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
            {isLoadingActivities ? (
              <View style={styles.webLoadingContainer}>
                <Text style={styles.webLoadingText}>Đang tải...</Text>
              </View>
            ) : recentActivities.length === 0 ? (
              <View style={styles.webEmptyContainer}>
                <Text style={styles.webEmptyText}>Chưa có hoạt động nào</Text>
              </View>
            ) : (
              recentActivities.slice(0, 3).map((activity) => {
              let iconName = "file-text";
              let iconColor = COLORS.primary;
              let iconBg = "#D6E8FF";
              
              if (activity.type === "question") {
                iconName = "plus-circle";
                iconColor = COLORS.primary;
                iconBg = "#D6E8FF";
              } else if (activity.type === "exam") {
                iconName = "file-text";
                iconColor = COLORS.primary;
                iconBg = "#D6E8FF";
              }
              
              if (activity.title.toLowerCase().includes("ôn tập") || 
                  activity.title.toLowerCase().includes("flashcard") ||
                  activity.description.toLowerCase().includes("flashcard")) {
                iconName = "book-open";
                iconColor = COLORS.primary;
                iconBg = "#D6E8FF";
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
            })
            )}
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
              <Text style={styles.webQuickStatsProgressValue}>
                {completedQuestions.completed}/{completedQuestions.total}
              </Text>
            </View>
            <View style={styles.webQuickStatsProgressBar}>
              <View 
                style={[
                  styles.webQuickStatsProgressFill, 
                  { 
                    width: completedQuestions.total > 0 
                      ? `${Math.round((completedQuestions.completed / completedQuestions.total) * 100)}%` 
                      : "0%" 
                  }
                ]} 
              />
            </View>
          </View>
          <View style={styles.webQuickStatsExams}>
            <Text style={styles.webQuickStatsExamsLabel}>Đề thi đã tạo</Text>
            <Text style={styles.webQuickStatsExamsValue}>{totalExams}</Text>
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
        {isLoadingActivities ? (
          <View style={styles.mobileLoadingContainer}>
            <Text style={styles.mobileLoadingText}>Đang tải...</Text>
          </View>
        ) : recentActivities.length === 0 ? (
          <View style={styles.mobileEmptyContainer}>
            <Text style={styles.mobileEmptyText}>Chưa có hoạt động nào</Text>
          </View>
        ) : (
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
        )}
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

