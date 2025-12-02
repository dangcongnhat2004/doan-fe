import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
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
import { QuestionDetail } from "../../api/questionService";
import { storage } from "../../utils/storage";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "FlashcardSession">;
  route: RouteProp<RootStackParamList, "FlashcardSession">;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type FlashcardState = {
  questionId: string;
  questionText: string;
  answerText: string;
  isFlipped: boolean;
};

export default function FlashcardSessionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "FlashcardSession">>();
  const insets = useSafeAreaInsets();
  const { questions, setId, title } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [rememberedCards, setRememberedCards] = useState<Set<string>>(new Set());
  const [flipAnim] = useState(new Animated.Value(0));
  const [isFlipped, setIsFlipped] = useState(false);

  // Prepare flashcards
  const flashcards: FlashcardState[] = questions.map((q) => {
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

  const currentCard = flashcards[currentIndex];
  const rememberedCount = rememberedCards.size;
  const notRememberedCount = currentIndex + 1 - rememberedCount;

  const flipCard = () => {
    if (isFlipped) {
      // Flip back to question
      Animated.spring(flipAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== "web",
        tension: 10,
        friction: 8,
      }).start();
      setIsFlipped(false);
    } else {
      // Flip to answer
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
    // Save progress
    const rememberedArray = Array.from(rememberedCards);
    const allQuestionIds = flashcards.map((f) => f.questionId);
    const notRememberedArray = allQuestionIds.filter(
      (id) => !rememberedCards.has(id)
    );

    try {
      await storage.setFlashcardProgress(setId, rememberedArray, notRememberedArray);
      navigation.goBack();
    } catch (err) {
      console.error("Error saving flashcard progress:", err);
      navigation.goBack();
    }
  };

  // Reset flip when card changes
  useEffect(() => {
    setIsFlipped(false);
    flipAnim.setValue(0);
  }, [currentIndex]);

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

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top - 20, 8) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thẻ Ghi Nhớ</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="zap" size={24} color={COLORS.black} />
        </TouchableOpacity>
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

      {/* Flashcard */}
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

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
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

        <TouchableOpacity 
          style={styles.listButton} 
          onPress={() => {
            // Show list of questions to navigate to
            // For now, just show alert
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Icon name="list" size={24} color={COLORS.primary} />
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

      {/* Remember/Not Remember Buttons (shown when flipped) */}
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
  headerIcon: {
    padding: 8,
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
  flashcardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  flashcardTouchable: {
    width: "100%",
    maxWidth: 400,
    height: 400,
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
  flashcardHidden: {
    opacity: 0,
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
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 16,
  },
  cardAnswer: {
    fontSize: 18,
    color: COLORS.black,
    textAlign: "center",
    lineHeight: 26,
  },
  flipHint: {
    position: "absolute",
    bottom: 16,
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: "italic",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
  },
  navButtonTextDisabled: {
    color: COLORS.gray,
  },
  listButton: {
    padding: 12,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  rememberButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rememberButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#F44336",
  },
  rememberButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
});

