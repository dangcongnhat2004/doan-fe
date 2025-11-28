import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import Text from "../../components/Text";
import TextInput from "../../components/TextInput";
import QuestionSetCard from "../../components/QuestionSetCard";
import QuestionCard, { QuestionData } from "../../components/QuestionCard";
import { COLORS } from "../../constants/colors";
import { ExtractedQuestionData } from "../../components/ExtractedQuestionCard";
import { createBatchQuestions } from "../../api/questionService";
import { storage } from "../../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "ImportQuestions">;

// Type guard to check if question has choices
const hasChoices = (
  question: any
): question is QuestionData => {
  return "choices" in question && Array.isArray(question.choices);
};

export default function ImportQuestionsScreen({ navigation, route }: Props) {
  const allQuestions = route.params?.questions || [];
  const [questionSetName, setQuestionSetName] = useState("");
  const [questionSetDescription, setQuestionSetDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Store tags for each question by question ID
  const [questionTags, setQuestionTags] = useState<Record<string, string[]>>({});

  // Separate questions by type
  const extractedQuestions = allQuestions.filter(
    (q) => !hasChoices(q)
  ) as ExtractedQuestionData[];
  const directQuestions = allQuestions.filter(hasChoices) as QuestionData[];

  // Initialize tags for each question
  React.useEffect(() => {
    const initialTags: Record<string, string[]> = {};
    allQuestions.forEach((q) => {
      if (!questionTags[q.id]) {
        initialTags[q.id] = [];
      }
    });
    setQuestionTags((prev) => ({ ...prev, ...initialTags }));
  }, [allQuestions.length]);

  const handleComplete = async () => {
    if (!questionSetName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên bộ câu hỏi.");
      return;
    }

    if (allQuestions.length === 0) {
      Alert.alert("Lỗi", "Không có câu hỏi nào để nhập kho.");
      return;
    }

    setLoading(true);

    try {
      // Get user ID for created_by
      const user = await storage.getUser();
      if (!user || !user.id) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      // Transform questions to API format
      const apiQuestions = allQuestions.map((question) => {
        if (hasChoices(question)) {
          // Direct question with choices
          const apiQuestion: any = {
            question_text: question.questionText,
            choices: question.choices.map((choice) => ({
              label: choice.label,
              text: choice.text,
              is_correct: choice.isCorrect,
            })),
          };

          // Add tags only if user has added them
          const tags = questionTags[question.id] || [];
          if (tags.length > 0) {
            apiQuestion.tags = tags;
          }

          return apiQuestion;
        } else {
          // Extracted question
          const apiQuestion: any = {
            question_text: question.questionText,
          };

          // Add tags only if user has added them
          const tags = questionTags[question.id] || [];
          if (tags.length > 0) {
            apiQuestion.tags = tags;
          }

          return apiQuestion;
        }
      });

      // Prepare API request
      const request = {
        user_id: user.id,
        create_set: {
          title: questionSetName,
          description: questionSetDescription.trim() || undefined,
        },
        questions: apiQuestions,
      };

      // Call API
      const response = await createBatchQuestions(request);

      const successMsg = `Đã tạo ${response.created.length} câu hỏi thành công!\nBộ câu hỏi ID: ${response.set_id}`;
      
      // On web, use modal or window.alert since Alert.alert may not work
      if (Platform.OS === "web") {
        setSuccessMessage(successMsg);
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          "Thành công",
          successMsg,
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Home"),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error creating batch questions:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo câu hỏi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatQuestionId = (index: number) => {
    return `Q${String(index + 1).padStart(3, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text variant="bold" style={styles.headerTitle}>
          Tải lên Câu hỏi
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="share-2" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Set Information */}
        <View style={styles.infoSection}>
          {/* Question Set Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên bộ câu hỏi *</Text>
            <TextInput
              style={styles.input}
              value={questionSetName}
              onChangeText={setQuestionSetName}
              placeholder="Hãy nhập tên của Bộ câu hỏi"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={questionSetDescription}
              onChangeText={setQuestionSetDescription}
              placeholder="Nhập mô tả cho bộ câu hỏi (tùy chọn)"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Questions List */}
        {extractedQuestions.length > 0 && (
          <View style={styles.questionsSection}>
            <Text variant="bold" style={styles.sectionTitle}>
              Câu hỏi đã trích xuất ({extractedQuestions.length})
            </Text>

            {extractedQuestions.map((question, index) => (
              <QuestionSetCard
                key={question.id}
                question={question}
                questionId={formatQuestionId(index)}
                tags={questionTags[question.id] || []}
                onTagsChange={(tags) => {
                  setQuestionTags((prev) => ({
                    ...prev,
                    [question.id]: tags,
                  }));
                }}
              />
            ))}
          </View>
        )}

        {/* Direct Questions List */}
        {directQuestions.length > 0 && (
          <View style={styles.questionsSection}>
            <Text variant="bold" style={styles.sectionTitle}>
              Câu hỏi trắc nghiệm ({directQuestions.length})
            </Text>

            {directQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                onUpdate={() => {}}
                onDelete={() => {}}
                topics={[]}
                autoEdit={false}
                tags={questionTags[question.id] || []}
                onTagsChange={(tags) => {
                  setQuestionTags((prev) => ({
                    ...prev,
                    [question.id]: tags,
                  }));
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Success Modal for Web */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.navigate("Home");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="bold" style={styles.modalTitle}>
              Thành công
            </Text>
            <Text style={styles.modalMessage}>
              {successMessage}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("Home");
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButtonBottom}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.completeButton, loading && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.completeButtonText}>Hoàn tất</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray || "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.black,
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  infoSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  questionsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 16,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  backButtonBottom: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "600",
  },
  completeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    width: Platform.OS === "web" ? 400 : "85%",
    maxWidth: 500,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: COLORS.black,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "600",
  },
});

