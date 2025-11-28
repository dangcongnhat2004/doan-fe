import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import Text from "../../components/Text";
import ExtractedQuestionCard, {
  ExtractedQuestionData,
} from "../../components/ExtractedQuestionCard";
import QuestionCard, { QuestionData } from "../../components/QuestionCard";
import PrimaryButton from "../../components/PrimaryButton";
import { COLORS } from "../../constants/colors";
import { extractQuestionsFromFile, getAllTopics } from "../../api/mockData";

type Props = NativeStackScreenProps<RootStackParamList, "ReviewQuestions">;

// Type guard to check if question has choices (direct add) or not (extracted)
const hasChoices = (
  question: any
): question is QuestionData => {
  return "choices" in question && Array.isArray(question.choices);
};

export default function ReviewQuestionsScreen({ navigation, route }: Props) {
  const [extractedQuestions, setExtractedQuestions] = useState<
    ExtractedQuestionData[]
  >([]);
  const [directQuestions, setDirectQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(
    route.params?.fileUri || null
  );
  const topics = getAllTopics().map((topic) => topic.name);
  const isDirectAdd = route.params?.questions?.some(hasChoices) || false;

  // Load questions from route params
  useEffect(() => {
    if (route.params?.questions) {
      const questions = route.params.questions;
      // Separate questions with choices (direct add) and without (extracted)
      const withChoices = questions.filter(hasChoices) as QuestionData[];
      const withoutChoices = questions.filter(
        (q) => !hasChoices(q)
      ) as ExtractedQuestionData[];

      if (withChoices.length > 0) {
        setDirectQuestions(withChoices);
      }
      if (withoutChoices.length > 0) {
        setExtractedQuestions(withoutChoices);
      }
    }
  }, [route.params?.questions]);

  const handleExtract = async () => {
    if (!selectedFile) {
      Alert.alert("Lỗi", "Vui lòng chọn file trước.");
      return;
    }

    setExtracting(true);
    try {
      const extracted = await extractQuestionsFromFile(selectedFile);
      setExtractedQuestions(extracted);
    } catch (error) {
      console.error("Error extracting questions:", error);
      Alert.alert("Lỗi", "Không thể trích xuất câu hỏi từ file.");
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedQuestions([]);
  };

  const handleUpdateExtractedQuestion = (
    updatedQuestion: ExtractedQuestionData
  ) => {
    setExtractedQuestions(
      extractedQuestions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  const handleUpdateDirectQuestion = (updatedQuestion: QuestionData) => {
    setDirectQuestions(
      directQuestions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  const handleDeleteExtractedQuestion = (questionId: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa câu hỏi này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            setExtractedQuestions(
              extractedQuestions.filter((q) => q.id !== questionId)
            );
          },
        },
      ]
    );
  };

  const handleDeleteDirectQuestion = (questionId: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa câu hỏi này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            setDirectQuestions(
              directQuestions.filter((q) => q.id !== questionId)
            );
          },
        },
      ]
    );
  };

  const handleAddQuestion = () => {
    const newQuestion: QuestionData = {
      id: `q_${Date.now()}`,
      questionText: "",
      choices: [
        {
          id: `c_${Date.now()}_1`,
          label: "A",
          text: "",
          isCorrect: true,
        },
        {
          id: `c_${Date.now()}_2`,
          label: "B",
          text: "",
          isCorrect: false,
        },
      ],
      topic: "",
    };
    setDirectQuestions([...directQuestions, newQuestion]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleImport = () => {
    const allQuestions = [
      ...extractedQuestions,
      ...directQuestions, // Keep direct questions with choices
    ];

    if (allQuestions.length === 0) {
      Alert.alert("Lỗi", "Không có câu hỏi nào để nhập kho.");
      return;
    }

    // Navigate to ImportQuestions screen
    navigation.navigate("ImportQuestions", {
      questions: allQuestions,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
        {/* File Selection Section - Only show for extracted questions */}
        {selectedFile &&
          extractedQuestions.length === 0 &&
          directQuestions.length === 0 && (
            <View style={styles.fileSection}>
              <Text variant="bold" style={styles.sectionTitle}>
                Chọn file để trích xuất
              </Text>

              {/* File Preview */}
              <View style={styles.filePreviewContainer}>
                <Image
                  source={{ uri: selectedFile }}
                  style={styles.filePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={handleRemoveFile}
                >
                  <Icon name="x" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {/* Extract Button */}
              <PrimaryButton
                title="Trích xuất Câu hỏi"
                onPress={handleExtract}
                style={styles.extractButton}
              />
              {extracting && (
                <View style={styles.extractingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.extractingText}>
                    Đang trích xuất câu hỏi...
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Direct Add Questions Section */}
        {directQuestions.length > 0 && (
          <View style={styles.questionsSection}>
            {directQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onUpdate={handleUpdateDirectQuestion}
                onDelete={handleDeleteDirectQuestion}
                topics={topics}
                autoEdit={!question.questionText.trim()}
              />
            ))}

            {/* Add Question Button */}
            <TouchableOpacity
              style={styles.addQuestionButton}
              onPress={handleAddQuestion}
            >
              <Icon name="plus" size={20} color={COLORS.primary} />
              <Text style={styles.addQuestionText}>Thêm câu hỏi mới</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Extracted Questions Section */}
        {extractedQuestions.length > 0 && (
          <View style={styles.questionsSection}>
            <Text variant="bold" style={styles.sectionTitle}>
              Câu hỏi đã trích xuất
            </Text>

            {extractedQuestions.map((question) => (
              <ExtractedQuestionCard
                key={question.id}
                question={question}
                onUpdate={handleUpdateExtractedQuestion}
                onDelete={handleDeleteExtractedQuestion}
                topics={topics}
              />
            ))}
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang trích xuất câu hỏi...</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {(directQuestions.length > 0 || extractedQuestions.length > 0) && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importButton} onPress={handleImport}>
            <Text style={styles.importButtonText}>Nhập kho</Text>
          </TouchableOpacity>
        </View>
      )}
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
  fileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 16,
  },
  filePreviewContainer: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  filePreview: {
    width: "100%",
    height: 200,
    opacity: 0.7,
  },
  removeFileButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  extractButton: {
    marginTop: 0,
  },
  extractingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  extractingText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  questionsSection: {
    marginTop: 24,
  },
  addQuestionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    marginTop: 8,
  },
  addQuestionText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
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
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "600",
  },
  importButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  importButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "600",
  },
});
