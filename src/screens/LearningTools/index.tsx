import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { getQuestionSets, QuestionSet } from "../../api/questionService";
import DashboardLayout from "../../components/DashboardLayout";
import Text from "../../components/Text";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { storage } from "../../utils/storage";
import Whiteboard from "./Whiteboard";

type TabType = "flashcard" | "whiteboard" | "results";

const IS_WEB = Platform.OS === "web";

export default function LearningToolsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const IS_MOBILE = !IS_WEB || SCREEN_WIDTH < 768;
  const [activeTab, setActiveTab] = useState<TabType>("flashcard");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardResults, setFlashcardResults] = useState<Array<{
    setId: string;
    title: string;
    rememberedCount: number;
    notRememberedCount: number;
    totalCount: number;
    updatedAt: string;
  }>>([]);

  const loadQuestionSets = useCallback(async () => {
    try {
      setError(null);
      const user = await storage.getUser();
      if (!user || !user.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const response = await getQuestionSets(user.id);
      setQuestionSets(response.sets || []);
    } catch (err: any) {
      console.error("Error loading question sets:", err);
      setError(err.message || "Không thể tải danh sách bộ câu hỏi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadFlashcardResults = useCallback(async () => {
    try {
      const allProgress = await storage.getAllFlashcardProgress();
      const results = allProgress.map((progress) => {
        // Find the question set to get title and total count
        const set = questionSets.find((s) => s.set_id === progress.setId);
        return {
          setId: progress.setId,
          title: set?.title || "Bộ câu hỏi",
          rememberedCount: progress.rememberedCards.length,
          notRememberedCount: progress.notRememberedCards.length,
          totalCount: progress.rememberedCards.length + progress.notRememberedCards.length,
          updatedAt: progress.updatedAt,
        };
      });
      setFlashcardResults(results);
    } catch (err) {
      console.error("Error loading flashcard results:", err);
    }
  }, [questionSets]);

  useEffect(() => {
    loadQuestionSets();
  }, [loadQuestionSets]);

  useFocusEffect(
    useCallback(() => {
      if (questionSets.length > 0) {
        loadFlashcardResults();
      }
    }, [questionSets, loadFlashcardResults])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestionSets();
  };

  const handleSetPress = (set: QuestionSet) => {
    navigation.navigate("FlashcardDetail", {
      userId: set.creator.user_id,
      setId: set.set_id,
    });
  };

  const renderSetCard = ({ item }: { item: QuestionSet }) => {
    // Extract chapter/subject from title or description
    const titleParts = item.title.split(" - ");
    const chapter = titleParts[0] || "Chương 1";
    const subject = titleParts[1] || item.description?.split(" ")[0] || "Toán Cao cấp";
    const result = flashcardResults.find((r) => r.setId === item.set_id);

    return (
      <TouchableOpacity
        style={styles.setCard}
        onPress={() => handleSetPress(item)}
        activeOpacity={0.7}
      >
        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Icon name="layers" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardChapter}>{chapter}</Text>
              <Text style={styles.cardSubject}>{subject}</Text>
            </View>
          </View>
          
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Icon name="file-text" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>{item.question_count} câu</Text>
            </View>
            {result && result.totalCount > 0 && (
              <View style={styles.statItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={[styles.statText, styles.statSuccess]}>
                  {result.rememberedCount}/{result.totalCount} đã nhớ
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.learnButton}
            onPress={() => handleSetPress(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.learnButtonText}>Học</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWhiteboard = () => {
    return <Whiteboard />;
  };

  const renderResultCard = ({ item }: { item: typeof flashcardResults[0] }) => {
    const progress = item.totalCount > 0 
      ? Math.round((item.rememberedCount / item.totalCount) * 100) 
      : 0;
    const titleParts = item.title.split(" - ");
    const chapter = titleParts[0] || "Chương 1";
    const subject = titleParts[1] || "Toán Cao cấp";

    return (
      <TouchableOpacity
        style={styles.resultCard}
        activeOpacity={0.7}
      >
        <View style={styles.resultCardHeader}>
          <View style={styles.resultCardIconContainer}>
            <Icon name="layers" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.resultCardTitleContainer}>
            <Text style={styles.resultCardChapter}>{chapter}</Text>
            <Text style={styles.resultCardSubject}>{subject}</Text>
          </View>
        </View>
        
        <View style={styles.resultCardStats}>
          <View style={styles.resultStatItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.resultStatText}>
              {item.rememberedCount} đã nhớ
            </Text>
          </View>
          <View style={styles.resultStatItem}>
            <Icon name="x-circle" size={16} color="#F44336" />
            <Text style={styles.resultStatText}>
              {item.notRememberedCount} chưa nhớ
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => {
    const tabsContent = (
      <>
        <TouchableOpacity
          style={[styles.tab, activeTab === "flashcard" && styles.tabActive]}
          onPress={() => setActiveTab("flashcard")}
          activeOpacity={0.7}
        >
          <Icon
            name="layers"
            size={20}
            color={activeTab === "flashcard" ? COLORS.primary : COLORS.gray}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "flashcard" && styles.tabTextActive,
            ]}
          >
            Thẻ ghi nhớ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "whiteboard" && styles.tabActive]}
          onPress={() => setActiveTab("whiteboard")}
          activeOpacity={0.7}
        >
          <Icon
            name="edit-3"
            size={20}
            color={activeTab === "whiteboard" ? COLORS.primary : COLORS.gray}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "whiteboard" && styles.tabTextActive,
            ]}
          >
            Bảng trắng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "results" && styles.tabActive]}
          onPress={() => setActiveTab("results")}
          activeOpacity={0.7}
        >
          <Icon
            name="bar-chart-2"
            size={20}
            color={activeTab === "results" ? COLORS.primary : COLORS.gray}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "results" && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            Kết quả
          </Text>
        </TouchableOpacity>
      </>
    );

    // On web, wrap in ScrollView for horizontal scrolling if needed
    if (IS_WEB) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScrollView}
        >
          {tabsContent}
        </ScrollView>
      );
    }

    // On mobile, use regular View
    return <View style={styles.tabsContainer}>{tabsContent}</View>;
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadQuestionSets}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === "whiteboard") {
      return renderWhiteboard();
    }

    if (activeTab === "results") {
      if (flashcardResults.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="bar-chart-2" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              Chưa có kết quả học tập nào. Hãy bắt đầu học để xem kết quả!
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsHeaderTitle}>Kết quả học tập</Text>
          </View>
          <FlatList
            data={flashcardResults}
            renderItem={renderResultCard}
            keyExtractor={(item) => item.setId}
            contentContainerStyle={styles.resultsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }

    if (questionSets.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="inbox" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            Chưa có bộ câu hỏi nào. Hãy tạo bộ câu hỏi mới!
          </Text>
        </View>
      );
    }

    // Calculate columns based on screen width for web
    const numColumns = IS_WEB 
      ? (SCREEN_WIDTH >= 1200 ? 3 : SCREEN_WIDTH >= 768 ? 2 : 1)
      : (IS_MOBILE ? 2 : 3);

    return (
      <FlatList
        data={questionSets}
        renderItem={renderSetCard}
        keyExtractor={(item) => item.set_id}
        numColumns={numColumns}
        contentContainerStyle={styles.setsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={IS_WEB && numColumns > 1 ? styles.cardRow : undefined}
      />
    );
  };

  if (IS_WEB) {
    return (
      <DashboardLayout title="Công cụ học tập" showSearch={false}>
        <View style={styles.webContainer}>
          <View style={styles.webTabsWrapper}>
            {renderTabs()}
          </View>
          <View style={styles.webContentWrapper}>
            {renderContent()}
          </View>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Công cụ học tập</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate("FlashcardWhiteboard")}
          >
            <Icon name="book-open" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: IS_WEB ? 1400 : "100%",
    alignSelf: "center",
    padding: IS_WEB ? 24 : 16,
    ...(Platform.OS === "web" ? ({ 
      boxSizing: "border-box",
      overflow: "visible",
    } as any) : {}),
  },
  webTabsWrapper: {
    marginBottom: IS_WEB ? 24 : 0,
    width: "100%",
    ...(Platform.OS === "web" ? ({
      borderBottom: "1px solid #E5E5E5",
      paddingBottom: 16,
      overflow: "visible",
      boxSizing: "border-box",
      minWidth: 0,
    } as any) : {}),
  },
  webContentWrapper: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerIcon: {
    padding: 8,
  },
  tabsScrollView: {
    ...(Platform.OS === "web" ? ({
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
    } as any) : {}),
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: IS_WEB ? 0 : 16,
    paddingVertical: IS_WEB ? 0 : 16,
    gap: IS_WEB ? 8 : 8,
    borderBottomWidth: IS_WEB ? 0 : 1,
    borderBottomColor: "#E5E5E5",
    ...(Platform.OS === "web" ? ({
      display: "flex",
      alignItems: "center",
      flexWrap: "nowrap",
      minWidth: "100%",
      minHeight: "48px",
      justifyContent: "flex-start",
    } as any) : {}),
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: IS_WEB ? 16 : 12,
    paddingVertical: IS_WEB ? 10 : 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    minWidth: IS_WEB ? 120 : 80,
    flexShrink: 0,
    ...(Platform.OS === "web" ? ({
      cursor: "pointer",
      transition: "all 0.2s ease",
      userSelect: "none",
      whiteSpace: "nowrap",
      flexBasis: "auto",
      maxWidth: "none",
      overflow: "visible",
    } as any) : {}),
  },
  tabActive: {
    backgroundColor: COLORS.primary + "15",
  },
  tabText: {
    fontSize: IS_WEB ? 14 : 14,
    color: COLORS.gray,
    fontWeight: "500",
    ...(Platform.OS === "web" ? ({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "nowrap",
      display: "inline-block",
      maxWidth: "none",
    } as any) : {}),
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.alert,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
  },
  setsList: {
    padding: IS_WEB ? 0 : 16,
    paddingBottom: IS_WEB ? 40 : 100,
    ...(Platform.OS === "web" ? ({
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      gap: 0,
      width: "100%",
    } as any) : {}),
  },
  cardRow: {
    ...(Platform.OS === "web" ? ({
      display: "flex",
      flexDirection: "row",
      width: "100%",
      gap: 0,
    } as any) : {}),
  },
  setCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: IS_WEB ? 12 : 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: IS_WEB ? "calc(33.333% - 24px)" : "48%",
    minWidth: IS_WEB ? "280px" : undefined,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    ...(Platform.OS === "web" ? ({
      boxSizing: "border-box",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      flexBasis: "calc(33.333% - 24px)",
      "@media (max-width: 1200px)": {
        flexBasis: "calc(50% - 24px)",
        maxWidth: "calc(50% - 24px)",
      },
      "@media (max-width: 768px)": {
        flexBasis: "100%",
        maxWidth: "100%",
      },
    } as any) : {}),
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardSubject: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  cardChapter: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statSuccess: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  learnButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  learnButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: IS_WEB ? 0 : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: IS_WEB ? 0 : 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  resultsHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  resultsList: {
    padding: IS_WEB ? 0 : 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resultCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultCardTitleContainer: {
    flex: 1,
  },
  resultCardChapter: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  resultCardSubject: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  resultCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  resultStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultStatText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    minWidth: 40,
    textAlign: "right",
  },
});

