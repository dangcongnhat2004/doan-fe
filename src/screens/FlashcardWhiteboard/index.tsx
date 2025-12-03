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
  Animated,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import Text from "../../components/Text";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import {
  getQuestionSets,
  getQuestionSetDetail,
  QuestionSet,
  QuestionSetDetail,
  QuestionDetail,
} from "../../api/questionService";
import { storage } from "../../utils/storage";
import Whiteboard from "../LearningTools/Whiteboard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

type FlashcardState = {
  questionId: string;
  questionText: string;
  answerText: string;
  isFlipped: boolean;
};

type ScreenMode = "select" | "study";

export default function FlashcardWhiteboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FlashcardWhiteboard">>();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

  const [mode, setMode] = useState<ScreenMode>("select");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flashcard state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rememberedCards, setRememberedCards] = useState<Set<string>>(new Set());
  const [flipAnim] = useState(new Animated.Value(0));
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardState[]>([]);

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

  useEffect(() => {
    loadQuestionSets();
  }, [loadQuestionSets]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestionSets();
  };

  const handleSetSelect = async (set: QuestionSet) => {
    try {
      setLoading(true);
      setError(null);
      const user = await storage.getUser();
      if (!user || !user.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const detail = await getQuestionSetDetail(user.id, set.set_id);
      setSelectedSetId(set.set_id);
      setSelectedQuestions(detail.questions);
      setMode("select");
    } catch (err: any) {
      console.error("Error loading question set detail:", err);
      setError(err.message || "Không thể tải chi tiết bộ câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (question: QuestionDetail) => {
    setSelectedQuestions((prev) => {
      const isSelected = prev.some((q) => q.question_id === question.question_id);
      if (isSelected) {
        return prev.filter((q) => q.question_id !== question.question_id);
      } else {
        return [...prev, question];
      }
    });
  };

  const handleStartStudy = () => {
    if (selectedQuestions.length === 0) {
      setError("Vui lòng chọn ít nhất một câu hỏi để ôn tập");
      return;
    }

    // Prepare flashcards
    const preparedFlashcards: FlashcardState[] = selectedQuestions.map((q) => {
      const correctChoice = q.choices.find((c) => c.is_correct);
      const answerText = correctChoice
        ? `${correctChoice.label}. ${correctChoice.text}`
        : q.explanation || "Không có đáp án";
      return {
        questionId: q.question_id,
        questionText: q.question_text,
        answerText,
        isFlipped: false,
      };
    });

    setFlashcards(preparedFlashcards);
    setCurrentIndex(0);
    setRememberedCards(new Set());
    setIsFlipped(false);
    flipAnim.setValue(0);
    setMode("study");
  };

  const currentCard = flashcards[currentIndex];
  const rememberedCount = rememberedCards.size;
  const notRememberedCount = currentIndex + 1 - rememberedCount;

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== "web",
        tension: 10,
        friction: 8,
      }).start();
      setIsFlipped(false);
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        useNativeDriver: Platform.OS !== "web",
        tension: 10,
        friction: 8,
      }).start();
      setIsFlipped(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const handleRemembered = () => {
    setRememberedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentCard.questionId)) {
        newSet.delete(currentCard.questionId);
      } else {
        newSet.add(currentCard.questionId);
      }
      return newSet;
    });
  };

  const handleNotRemembered = () => {
    setRememberedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(currentCard.questionId);
      return newSet;
    });
  };

  const handleFinish = async () => {
    if (!selectedSetId) return;

    const rememberedArray = Array.from(rememberedCards);
    const allQuestionIds = flashcards.map((f) => f.questionId);
    const notRememberedArray = allQuestionIds.filter(
      (id) => !rememberedCards.has(id)
    );

    try {
      await storage.setFlashcardProgress(selectedSetId, rememberedArray, notRememberedArray);
      setMode("select");
      setSelectedQuestions([]);
      setFlashcards([]);
    } catch (err) {
      console.error("Error saving flashcard progress:", err);
    }
  };

  useEffect(() => {
    if (mode === "study") {
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  }, [currentIndex, mode]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 90.01, 180],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 90.01, 180],
    outputRange: [0, 0, 1, 1],
  });

  const frontAnimatedStyle = Platform.OS === "web"
    ? {
        opacity: frontOpacity,
        transform: [{ rotateY: frontInterpolate }],
      }
    : {
        transform: [{ rotateY: frontInterpolate }],
      };

  const backAnimatedStyle = Platform.OS === "web"
    ? {
        opacity: backOpacity,
        transform: [{ rotateY: backInterpolate }],
      }
    : {
        transform: [{ rotateY: backInterpolate }],
      };

  // Render select mode
  if (mode === "select") {
    if (selectedSetId && selectedQuestions.length > 0) {
      // Show question selection
      return (
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedSetId(null);
                setSelectedQuestions([]);
              }}
            >
              <Icon name="arrow-left" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chọn câu hỏi để ôn tập</Text>
            <View style={styles.headerRight} />
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
          >
            {selectedQuestions.map((question, index) => {
              const isSelected = selectedQuestions.some(
                (q) => q.question_id === question.question_id
              );
              return (
                <TouchableOpacity
                  key={question.question_id}
                  style={[
                    styles.questionItem,
                    isSelected && styles.questionItemSelected,
                  ]}
                  onPress={() => handleQuestionToggle(question)}
                  activeOpacity={0.7}
                >
                  <View style={styles.questionCheckbox}>
                    {isSelected && (
                      <Icon name="check" size={20} color={COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.questionContent}>
                    <Text style={styles.questionText}>
                      {index + 1}. {question.question_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[
                styles.startButton,
                selectedQuestions.length === 0 && styles.startButtonDisabled,
              ]}
              onPress={handleStartStudy}
              disabled={selectedQuestions.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                Bắt đầu học ({selectedQuestions.length} câu)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // Show set selection
    if (loading && !refreshing) {
      return (
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </SafeAreaView>
      );
    }

    if (error) {
      return (
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Học kết hợp</Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadQuestionSets}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Học kết hợp</Text>
          <View style={styles.headerRight} />
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
        >
          {questionSets.length === 0 ? (
            <View style={styles.centerContainer}>
              <Icon name="inbox" size={64} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                Chưa có bộ câu hỏi nào. Hãy tạo bộ câu hỏi mới!
              </Text>
            </View>
          ) : (
            questionSets.map((set) => {
              const titleParts = set.title.split(" - ");
              const chapter = titleParts[0] || "Chương 1";
              const subject = titleParts[1] || set.description?.split(" ")[0] || "Toán Cao cấp";

              return (
                <TouchableOpacity
                  key={set.set_id}
                  style={styles.setCard}
                  onPress={() => handleSetSelect(set)}
                  activeOpacity={0.7}
                >
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
                        <Text style={styles.statText}>{set.question_count} câu</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render study mode - Flashcard + Whiteboard
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMode("select")}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Học kết hợp</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={styles.progressItem}>
          <Icon name="x" size={16} color="#F44336" />
          <Text style={styles.progressText}>
            {notRememberedCount} Chưa nhớ
          </Text>
        </View>
        <View style={styles.progressItem}>
          <Icon name="check" size={16} color="#4CAF50" />
          <Text style={styles.progressText}>
            {rememberedCount} Đã nhớ
          </Text>
        </View>
      </View>

      {/* Split View: Flashcard (Top) + Whiteboard (Bottom) */}
      <View style={styles.splitContainer}>
        {/* Flashcard Section - Top Half */}
        <View style={styles.flashcardSection}>
          <View style={styles.flashcardContainer}>
            <TouchableOpacity
              style={styles.flashcardTouchable}
              onPress={flipCard}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardFront,
                  frontAnimatedStyle,
                ]}
              >
                <Text style={styles.cardNumber}>
                  {currentIndex + 1}/{flashcards.length}
                </Text>
                <Text style={styles.cardQuestion}>{currentCard.questionText}</Text>
                <Text style={styles.flipHint}>Chạm để lật thẻ</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardBack,
                  backAnimatedStyle,
                ]}
              >
                <Text style={styles.cardNumber}>
                  {currentIndex + 1}/{flashcards.length}
                </Text>
                <Text style={styles.cardAnswer}>{currentCard.answerText}</Text>
                <Text style={styles.flipHint}>Chạm để lật thẻ</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Flashcard Navigation */}
          <View style={styles.flashcardNavigation}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.prevButton,
                currentIndex === 0 && styles.navButtonDisabled,
              ]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
              activeOpacity={0.7}
            >
              <Icon
                name="chevron-left"
                size={20}
                color={currentIndex === 0 ? COLORS.gray : COLORS.black}
              />
              <Text
                style={[
                  styles.navButtonText,
                  currentIndex === 0 && styles.navButtonTextDisabled,
                ]}
              >
                Trước
              </Text>
            </TouchableOpacity>

            {currentIndex === flashcards.length - 1 ? (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleFinish}
                activeOpacity={0.8}
              >
                <Icon name="check" size={20} color={COLORS.white} />
                <Text style={styles.doneButtonText}>Xong</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.navButtonText}>Sau</Text>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={COLORS.black}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Remember/Not Remember Buttons */}
          {isFlipped && (
            <View style={styles.rememberButtons}>
              <TouchableOpacity
                style={[styles.rememberButton, styles.notRememberButton]}
                onPress={handleNotRemembered}
                activeOpacity={0.7}
              >
                <Icon name="x" size={20} color="#F44336" />
                <Text style={styles.notRememberButtonText}>Chưa nhớ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rememberButton, styles.rememberButtonActive]}
                onPress={handleRemembered}
                activeOpacity={0.7}
              >
                <Icon name="check" size={20} color="#4CAF50" />
                <Text style={styles.rememberButtonText}>Đã nhớ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Whiteboard Section - Bottom Half */}
        <View style={styles.whiteboardSection}>
          <Whiteboard />
        </View>
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
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 16,
  },
  setCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E5E5",
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
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
  },
  questionItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  questionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "500",
  },
  splitContainer: {
    flex: 1,
    flexDirection: "column",
  },
  flashcardSection: {
    height: "50%",
    borderBottomWidth: 2,
    borderBottomColor: "#E5E5E5",
  },
  flashcardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  flashcardTouchable: {
    width: "100%",
    maxWidth: 400,
    height: "100%",
    maxHeight: 300,
    position: "relative",
  },
  flashcard: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  flashcardFront: {
    backgroundColor: COLORS.white,
  },
  flashcardBack: {
    backgroundColor: "#F5F5F5",
  },
  cardNumber: {
    position: "absolute",
    top: 16,
    left: 16,
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
  },
  cardQuestion: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 16,
  },
  cardAnswer: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 24,
  },
  flipHint: {
    position: "absolute",
    bottom: 16,
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: "italic",
  },
  flashcardNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  prevButton: {
    flex: 1,
    justifyContent: "flex-start",
  },
  nextButton: {
    flex: 1,
    justifyContent: "flex-end",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
  },
  navButtonTextDisabled: {
    color: COLORS.gray,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  rememberButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  rememberButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  notRememberButton: {
    backgroundColor: COLORS.white,
    borderColor: "#F44336",
  },
  rememberButtonActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  notRememberButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F44336",
  },
  rememberButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  whiteboardSection: {
    height: "50%",
    backgroundColor: COLORS.white,
  },
});

