import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import Text from "../../components/Text";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import {
  getQuestionSetDetail,
  QuestionSetDetail,
  QuestionDetail,
} from "../../api/questionService";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "FlashcardDetail">;
  route: RouteProp<RootStackParamList, "FlashcardDetail">;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";
const IS_MOBILE = !IS_WEB || SCREEN_WIDTH < 768;

export default function FlashcardDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FlashcardDetail">>();
  const insets = useSafeAreaInsets();
  const { userId, setId } = route.params;

  const [questionSet, setQuestionSet] = useState<QuestionSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const loadQuestionSetDetail = useCallback(async () => {
    try {
      setError(null);
      const response = await getQuestionSetDetail(userId, setId);
      setQuestionSet(response);
    } catch (err: any) {
      console.error("Error loading question set detail:", err);
      setError(err.message || "Không thể tải chi tiết bộ câu hỏi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, setId]);

  useEffect(() => {
    loadQuestionSetDetail();
  }, [loadQuestionSetDetail]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestionSetDetail();
  };

  const toggleCard = (questionId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleStartLearning = () => {
    if (!questionSet || questionSet.questions.length === 0) {
      return;
    }
    navigation.navigate("FlashcardSession", {
      questions: questionSet.questions,
      setId: questionSet.set_id,
      title: questionSet.title,
    });
  };

  // Extract chapter/subject from title
  const titleParts = questionSet?.title.split(" - ") || [];
  const chapter = titleParts[0] || "Chương 1";
  const subject = titleParts[1] || questionSet?.description?.split(" ")[0] || "Toán Cao cấp";

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !questionSet) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || "Không tìm thấy bộ câu hỏi"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadQuestionSetDetail}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
        <Text style={styles.headerTitle}>Thẻ ghi nhớ</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="zap" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="edit-3" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Chapter Info Header */}
        <View style={styles.chapterHeader}>
          <View style={styles.chapterHeaderContent}>
            <View style={styles.chapterIconContainer}>
              <Icon name="layers" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.chapterInfo}>
              <Text style={styles.chapterTitle}>{chapter}</Text>
              <Text style={styles.subjectName}>{subject}</Text>
              <View style={styles.chapterMeta}>
                <Icon name="file-text" size={14} color={COLORS.gray} />
                <Text style={styles.chapterQuestionCount}>
                  {questionSet.questions.length} câu
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {questionSet.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Mô tả</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={descriptionExpanded ? undefined : 3}
            >
              {questionSet.description}
            </Text>
            {questionSet.description.length > 100 && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {descriptionExpanded ? "Thu gọn" : "Xem thêm"}
                </Text>
                <Icon
                  name={descriptionExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* All Cards List */}
        <View style={styles.cardsSection}>
          <Text style={styles.cardsSectionTitle}>
            Tất cả các thẻ ({questionSet.questions.length})
          </Text>

          {questionSet.questions.map((question, index) => {
            const isExpanded = expandedCards.has(question.question_id);
            // Find correct answer
            const correctChoice = question.choices.find((c) => c.is_correct);
            const answerText = correctChoice
              ? `${correctChoice.label}. ${correctChoice.text}`
              : "Không có đáp án";

            return (
              <TouchableOpacity
                key={question.question_id}
                style={styles.flashcardItem}
                onPress={() => toggleCard(question.question_id)}
                activeOpacity={0.7}
              >
                <View style={styles.flashcardHeader}>
                  <Text style={styles.flashcardQuestion}>
                    {question.question_text}
                  </Text>
                  <Icon
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={COLORS.gray}
                  />
                </View>
                {isExpanded && (
                  <View style={styles.flashcardAnswer}>
                    <Text style={styles.answerText}>{answerText}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Learn Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.learnButton}
          onPress={handleStartLearning}
          activeOpacity={0.8}
        >
          <Text style={styles.learnButtonText}>Học</Text>
          <Icon name="chevron-right" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
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
  chapterHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  chapterHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  chapterIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  chapterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chapterQuestionCount: {
    fontSize: 14,
    color: COLORS.gray,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  cardsSection: {
    paddingHorizontal: 16,
  },
  cardsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 12,
  },
  flashcardItem: {
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
  flashcardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  flashcardQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
  },
  flashcardAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  answerText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  learnButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  learnButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

