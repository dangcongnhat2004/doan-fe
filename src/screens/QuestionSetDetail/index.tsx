import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import Text from "../../components/Text";
import { COLORS } from "../../constants/colors";
import {
  getQuestionSetDetail,
  QuestionSetDetail,
  QuestionDetail,
  updateQuestion,
  UpdateQuestionRequest,
  deleteQuestion,
} from "../../api/questionService";
import { storage } from "../../utils/storage";
import TextInput from "../../components/TextInput";
import PrimaryButton from "../../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "QuestionSetDetail">;

type EditableChoice = {
  tempId: string;
  label: string;
  text: string;
  is_correct: boolean;
};

type EditQuestionForm = {
  question_text: string;
  difficulty: string;
  bloom_level: string;
  explanation: string;
  source: string;
  tagsInput: string;
  choices: EditableChoice[];
  exam_id: string;
  order_no: number | null;
};

export default function QuestionSetDetailScreen({ navigation, route }: Props) {
  const { userId, setId } = route.params;
  const [questionSet, setQuestionSet] = useState<QuestionSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDetail | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditQuestionForm | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const loadQuestionSetDetail = async () => {
    try {
      setError(null);
      const response = await getQuestionSetDetail(userId, setId);
      setQuestionSet(response);
    } catch (err: any) {
      console.error("Error loading question set detail:", err);
      setError(err.message || "Không thể tải chi tiết bộ câu hỏi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuestionSetDetail();
  }, [userId, setId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestionSetDetail();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const difficultyOptions = [
    { label: "Dễ", value: "easy" },
    { label: "Trung bình", value: "medium" },
    { label: "Khó", value: "hard" },
  ];

  const bloomLevelOptions = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ];

  const startEditQuestion = (question: QuestionDetail, index: number) => {
    setEditingQuestion(question);
    setEditingIndex(index);
    setEditForm({
      question_text: question.question_text || "",
      difficulty: question.difficulty || "",
      bloom_level: question.bloom_level || "",
      explanation: question.explanation || "",
      source: question.source || "",
      tagsInput: (question.tags || []).join(", "),
      choices: (question.choices || []).map((choice, idx) => ({
        tempId: `${choice.choice_id ?? idx}`,
        label: choice.label || String.fromCharCode(65 + idx),
        text: choice.text || "",
        is_correct: !!choice.is_correct,
      })),
      exam_id:
        Array.isArray(question.exams) && question.exams.length > 0
          ? question.exams[0]?.exam_id || question.exams[0]?.examId || ""
          : "",
      order_no:
        (question as any).order_no && Number.isFinite((question as any).order_no)
          ? (question as any).order_no
          : index + 1,
    });
  };

  const closeEditModal = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
    setEditForm(null);
    setSavingQuestion(false);
  };

  const updateFormField = <K extends keyof EditQuestionForm>(
    key: K,
    value: EditQuestionForm[K]
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleChoiceFieldChange = (
    tempId: string,
    field: "label" | "text",
    value: string
  ) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            choices: prev.choices.map((choice) =>
              choice.tempId === tempId ? { ...choice, [field]: value } : choice
            ),
          }
        : prev
    );
  };

  const toggleChoiceCorrect = (tempId: string) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            choices: prev.choices.map((choice) =>
              choice.tempId === tempId
                ? { ...choice, is_correct: !choice.is_correct }
                : choice
            ),
          }
        : prev
    );
  };

  const handleRemoveChoice = (tempId: string) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            choices: prev.choices.filter((choice) => choice.tempId !== tempId),
          }
        : prev
    );
  };

  const handleAddChoice = () => {
    setEditForm((prev) => {
      if (!prev) {
        return prev;
      }
      const nextIndex = prev.choices.length;
      const nextLabel = String.fromCharCode(65 + nextIndex);
      const newChoice: EditableChoice = {
        tempId: `temp_${Date.now()}`,
        label: nextLabel,
        text: "",
        is_correct: false,
      };
      return {
        ...prev,
        choices: [...prev.choices, newChoice],
      };
    });
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editForm) {
      return;
    }

    if (!editForm.question_text.trim()) {
      Alert.alert("Lỗi", "Nội dung câu hỏi không được để trống.");
      return;
    }

    const normalizedTags = editForm.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const normalizedChoices = editForm.choices
      .map((choice, idx) => ({
        label:
          choice.label?.trim() || String.fromCharCode(65 + idx),
        text: choice.text.trim(),
        is_correct: choice.is_correct,
      }))
      .filter((choice) => choice.text.length > 0);

    if (editForm.choices.length > 0 && normalizedChoices.length < 2) {
      Alert.alert("Lỗi", "Vui lòng nhập ít nhất 2 lựa chọn hợp lệ.");
      return;
    }

    const payload: UpdateQuestionRequest = {
      question_text: editForm.question_text.trim(),
      difficulty: editForm.difficulty || undefined,
      bloom_level: editForm.bloom_level || undefined,
      explanation: editForm.explanation?.trim() || undefined,
      source: editForm.source?.trim() || undefined,
      tags: normalizedTags,
      choices: normalizedChoices.length > 0 ? normalizedChoices : undefined,
      exam_id: editForm.exam_id?.trim() || undefined,
      order_no:
        typeof editForm.order_no === "number" ? editForm.order_no : undefined,
    };

    setSavingQuestion(true);
    try {
      const response = await updateQuestion(
        editingQuestion.question_id,
        payload
      );

      const updatedQuestion = response.question;
      setQuestionSet((prev) => {
        if (!prev) {
          return prev;
        }
        const updatedQuestions = prev.questions.map((question) =>
          question.question_id === updatedQuestion.question_id
            ? { ...question, ...updatedQuestion }
            : question
        );
        return { ...prev, questions: updatedQuestions };
      });

      Alert.alert("Thành công", "Câu hỏi đã được cập nhật.");
      closeEditModal();
    } catch (err: any) {
      console.error("Error updating question:", err);
      Alert.alert("Lỗi", err.message || "Không thể cập nhật câu hỏi.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setDeletingQuestionId(questionId);
    try {
      await deleteQuestion(questionId);
      setQuestionSet((prev) => {
        if (!prev) {
          return prev;
        }
        const filteredQuestions = prev.questions.filter(
          (question) => question.question_id !== questionId
        );
        return { ...prev, questions: filteredQuestions };
      });

      if (editingQuestion?.question_id === questionId) {
        closeEditModal();
      }

      Alert.alert("Thành công", "Câu hỏi đã được xóa.");
    } catch (err: any) {
      console.error("Error deleting question:", err);
      Alert.alert("Lỗi", err.message || "Không thể xóa câu hỏi.");
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const confirmDeleteQuestion = (question: QuestionDetail) => {
    Alert.alert(
      "Xóa câu hỏi",
      "Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => handleDeleteQuestion(question.question_id),
        },
      ]
    );
  };

  const renderQuestion = (question: QuestionDetail, index: number) => {
    const hasChoices = question.choices && question.choices.length > 0;
    const hasMedia = question.media && question.media.length > 0;

    return (
      <View key={question.question_id} style={styles.questionCard}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <Text variant="bold" style={styles.questionNumber}>
            Câu {index + 1}
          </Text>
          <View style={styles.questionHeaderActions}>
            {question.difficulty && (
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor:
                      question.difficulty === "easy"
                        ? "#66BB6A"
                        : question.difficulty === "medium"
                        ? "#FFA726"
                        : "#FF6B9D",
                  },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {question.difficulty === "easy"
                    ? "Dễ"
                    : question.difficulty === "medium"
                    ? "Trung bình"
                    : "Khó"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAction}
              onPress={() => startEditQuestion(question, index)}
              disabled={deletingQuestionId === question.question_id}
            >
              <Icon name="edit-2" size={16} color={COLORS.primary} />
              <Text style={styles.editActionText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editAction, styles.deleteAction]}
              onPress={() => confirmDeleteQuestion(question)}
              disabled={deletingQuestionId === question.question_id}
            >
              <Icon name="trash-2" size={16} color="#FF6B6B" />
              <Text style={styles.deleteActionText}>
                {deletingQuestionId === question.question_id ? "Đang xóa..." : "Xóa"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Text */}
        <Text style={styles.questionText}>{question.question_text}</Text>

        {/* Media */}
        {hasMedia && (
          <View style={styles.mediaContainer}>
            {question.media.map((mediaItem) => (
              <View key={mediaItem.media_id} style={styles.mediaItem}>
                {mediaItem.file_type === "image" && (
                  <Image
                    source={{ uri: mediaItem.file_url }}
                    style={styles.mediaImage}
                    resizeMode="contain"
                  />
                )}
                {mediaItem.description && (
                  <Text style={styles.mediaDescription}>{mediaItem.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Choices */}
        {hasChoices && (
          <View style={styles.choicesContainer}>
            {question.choices.map((choice) => (
              <View
                key={choice.choice_id}
                style={[
                  styles.choiceItem,
                  choice.is_correct && styles.correctChoice,
                ]}
              >
                <View
                  style={[
                    styles.choiceLabel,
                    choice.is_correct && styles.correctChoiceLabel,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceLabelText,
                      choice.is_correct && styles.correctChoiceLabelText,
                    ]}
                  >
                    {choice.label}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.choiceText,
                    choice.is_correct && styles.correctChoiceText,
                  ]}
                >
                  {choice.text}
                </Text>
                {choice.is_correct && (
                  <Icon name="check-circle" size={20} color="#66BB6A" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {question.tags.map((tag, tagIndex) => (
              <View key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Explanation */}
        {question.explanation && (
          <View style={styles.explanationContainer}>
            <Text variant="bold" style={styles.explanationLabel}>
              Giải thích:
            </Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {/* Question Metadata */}
        <View style={styles.questionMetadata}>
          <Text style={styles.metadataText}>
            ID: {question.question_id}
          </Text>
          <Text style={styles.metadataText}>
            Tạo: {formatDate(question.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text variant="bold" style={styles.headerTitle}>
          Chi tiết bộ câu hỏi
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="share-2" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color={COLORS.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadQuestionSetDetail}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : questionSet ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Set Info Card */}
          <View style={styles.setInfoCard}>
            <View style={styles.setInfoHeader}>
              <View style={styles.iconContainer}>
                <Icon name="folder" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.setInfoContent}>
                <Text variant="bold" style={styles.setTitle}>
                  {questionSet.title}
                </Text>
                <Text style={styles.setId}>ID: {questionSet.set_id}</Text>
              </View>
            </View>

            {questionSet.description && (
              <Text style={styles.setDescription}>{questionSet.description}</Text>
            )}

            <View style={styles.setMetadata}>
              <View style={styles.metadataRow}>
                <Icon name="user" size={16} color={COLORS.gray} />
                <Text style={styles.metadataText}>
                  {questionSet.creator.username}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="help-circle" size={16} color={COLORS.gray} />
                <Text style={styles.metadataText}>
                  {questionSet.questions.length} câu hỏi
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="calendar" size={16} color={COLORS.gray} />
                <Text style={styles.metadataText}>
                  {formatDate(questionSet.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Questions List */}
          <View style={styles.questionsSection}>
            <Text variant="bold" style={styles.sectionTitle}>
              Danh sách câu hỏi ({questionSet.questions.length})
            </Text>
            {questionSet.questions.map((question, index) =>
              renderQuestion(question, index)
            )}
          </View>
        </ScrollView>
      ) : null}

      {editingQuestion && editForm && (
        <Modal
          visible={!!editingQuestion}
          animationType="slide"
          onRequestClose={closeEditModal}
        >
          <View style={styles.editScreen}>
            <View style={styles.editHeader}>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.editCloseButton}
                disabled={savingQuestion}
              >
                <Icon name="x" size={24} color={COLORS.black} />
              </TouchableOpacity>
              <Text variant="bold" style={styles.editTitle}>
                Chỉnh sửa câu hỏi
              </Text>
              <View style={styles.editHeaderSpacer} />
            </View>

            <KeyboardAvoidingView
              style={styles.editKeyboard}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                style={styles.editScroll}
                contentContainerStyle={styles.editContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.editGroup}>
                  <Text style={styles.editLabel}>Nội dung câu hỏi *</Text>
                  <TextInput
                    multiline
                    value={editForm.question_text}
                    onChangeText={(text) =>
                      updateFormField("question_text", text)
                    }
                    style={[styles.editInput, styles.editTextArea]}
                    placeholder="Nhập nội dung câu hỏi"
                  />
                </View>

                <View style={styles.editGroup}>
                  <Text style={styles.editLabel}>Độ khó</Text>
                  <View style={styles.optionRow}>
                    {difficultyOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionChip,
                          editForm.difficulty === option.value &&
                            styles.optionChipActive,
                        ]}
                        onPress={() =>
                          updateFormField(
                            "difficulty",
                            editForm.difficulty === option.value
                              ? ""
                              : option.value
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            editForm.difficulty === option.value &&
                              styles.optionChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editGroup}>
                  <Text style={styles.editLabel}>Bloom Level</Text>
                  <View style={styles.optionRow}>
                    {bloomLevelOptions.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.optionChip,
                          editForm.bloom_level === level &&
                            styles.optionChipActive,
                        ]}
                        onPress={() =>
                          updateFormField(
                            "bloom_level",
                            editForm.bloom_level === level ? "" : level
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            editForm.bloom_level === level &&
                              styles.optionChipTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.editGroup}>
                  <Text style={styles.editLabel}>Giải thích</Text>
                  <TextInput
                    multiline
                    value={editForm.explanation}
                    onChangeText={(text) =>
                      updateFormField("explanation", text)
                    }
                    style={[styles.editInput, styles.editTextArea]}
                    placeholder="Thêm giải thích cho câu hỏi (tùy chọn)"
                  />
                </View>

                <View style={styles.editGroup}>
                  <Text style={styles.editLabel}>Nguồn</Text>
                  <TextInput
                    value={editForm.source}
                    onChangeText={(text) => updateFormField("source", text)}
                    style={styles.editInput}
                    placeholder="Ví dụ: SGK Vật lý 12"
                  />
                </View>

                <View style={styles.editGroup}>
                  <Text style={styles.editLabel}>Tags</Text>
                  <TextInput
                    value={editForm.tagsInput}
                    onChangeText={(text) => updateFormField("tagsInput", text)}
                    style={styles.editInput}
                    placeholder="Ngăn cách bằng dấu phẩy, ví dụ: đại số, lớp 12"
                  />
                  <Text style={[styles.editHelperText, styles.tagsHelper]}>
                    Các tag mới sẽ thay thế toàn bộ tag cũ (theo API).
                  </Text>
                </View>

                <View style={styles.editRow}>
                  <View
                    style={[
                      styles.editGroup,
                      styles.editRowItem,
                      styles.editRowSpacing,
                    ]}
                  >
                    <Text style={styles.editLabel}>Exam ID</Text>
                    <TextInput
                      value={editForm.exam_id}
                      onChangeText={(text) => updateFormField("exam_id", text)}
                      style={styles.editInput}
                      placeholder="exam_123"
                    />
                  </View>
                  <View style={[styles.editGroup, styles.editRowItem]}>
                    <Text style={styles.editLabel}>Thứ tự trong đề</Text>
                    <TextInput
                      value={
                        typeof editForm.order_no === "number"
                          ? String(editForm.order_no)
                          : ""
                      }
                      onChangeText={(text) => {
                        const sanitized = text.replace(/[^0-9]/g, "");
                        updateFormField(
                          "order_no",
                          sanitized ? Number(sanitized) : null
                        );
                      }}
                      style={styles.editInput}
                      keyboardType="number-pad"
                      placeholder="Ví dụ: 1"
                    />
                  </View>
                </View>

                <View style={styles.editGroup}>
                  <View style={styles.choiceEditorHeader}>
                    <Text style={styles.editLabel}>Các lựa chọn</Text>
                    <TouchableOpacity
                      style={styles.addChoiceButton}
                      onPress={handleAddChoice}
                    >
                      <Icon name="plus" size={16} color={COLORS.primary} />
                      <Text style={styles.addChoiceText}>Thêm lựa chọn</Text>
                    </TouchableOpacity>
                  </View>

                  {editForm.choices.length === 0 && (
                    <Text style={styles.emptyChoiceText}>
                      Câu hỏi hiện chưa có lựa chọn. Nhấn "Thêm lựa chọn" để bổ sung.
                    </Text>
                  )}

                  {editForm.choices.map((choice, idx) => (
                    <View key={choice.tempId} style={styles.choiceEditorCard}>
                      <View style={styles.choiceEditorHeaderRow}>
                        <TouchableOpacity
                          style={[
                            styles.choiceToggle,
                            choice.is_correct && styles.choiceToggleActive,
                          ]}
                          onPress={() => toggleChoiceCorrect(choice.tempId)}
                        >
                          <Icon
                            name={choice.is_correct ? "check-circle" : "circle"}
                            size={18}
                            color={
                              choice.is_correct ? COLORS.white : COLORS.gray
                            }
                          />
                          <Text
                            style={[
                              styles.choiceToggleText,
                              choice.is_correct && styles.choiceToggleTextActive,
                            ]}
                          >
                            {choice.is_correct ? "Đáp án đúng" : "Đánh dấu đúng"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveChoice(choice.tempId)}
                          style={styles.choiceRemoveButton}
                        >
                          <Icon name="trash-2" size={16} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.choiceInputsRow}>
                        <TextInput
                          value={choice.label}
                          onChangeText={(text) =>
                            handleChoiceFieldChange(choice.tempId, "label", text)
                          }
                          style={[styles.editInput, styles.choiceLabelInput]}
                          placeholder="Nhãn (A, B, ...)"
                        />
                        <TextInput
                          value={choice.text}
                          onChangeText={(text) =>
                            handleChoiceFieldChange(choice.tempId, "text", text)
                          }
                          style={[styles.editInput, styles.choiceTextInput]}
                          placeholder={`Nội dung đáp án ${idx + 1}`}
                          multiline
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.editFooter}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={closeEditModal}
                disabled={savingQuestion}
              >
                <Text style={styles.editCancelText}>Hủy</Text>
              </TouchableOpacity>
              <PrimaryButton
                title={savingQuestion ? "Đang lưu..." : "Lưu thay đổi"}
                onPress={handleSaveQuestion}
                disabled={savingQuestion}
                style={styles.editSaveButton}
              />
            </View>
          </View>
        </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.gray,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  setInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  setInfoContent: {
    flex: 1,
  },
  setTitle: {
    fontSize: 18,
    color: COLORS.black,
    marginBottom: 4,
  },
  setId: {
    fontSize: 12,
    color: COLORS.gray,
  },
  setDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  setMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  questionsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.black,
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    color: COLORS.black,
  },
  questionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  editAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F7FF",
    marginLeft: 8,
  },
  editActionText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: "600",
  },
  deleteAction: {
    backgroundColor: "#FFF1F1",
    marginLeft: 8,
  },
  deleteActionText: {
    fontSize: 12,
    color: "#FF6B6B",
    marginLeft: 6,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 22,
    marginBottom: 16,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaItem: {
    marginBottom: 12,
  },
  mediaImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  mediaDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    fontStyle: "italic",
  },
  choicesContainer: {
    marginBottom: 16,
  },
  choiceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  correctChoice: {
    backgroundColor: "#E8F5E9",
    borderColor: "#66BB6A",
  },
  choiceLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  correctChoiceLabel: {
    backgroundColor: "#66BB6A",
    borderColor: "#66BB6A",
  },
  choiceLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  correctChoiceLabelText: {
    color: COLORS.white,
  },
  choiceText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  correctChoiceText: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  explanationContainer: {
    padding: 12,
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA726",
  },
  explanationLabel: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  questionMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  editScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  editCloseButton: {
    padding: 4,
  },
  editTitle: {
    fontSize: 18,
    color: COLORS.black,
  },
  editHeaderSpacer: {
    width: 24,
  },
  editKeyboard: {
    flex: 1,
  },
  editScroll: {
    flex: 1,
  },
  editContent: {
    padding: 20,
    paddingBottom: 60,
  },
  editGroup: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 8,
    fontWeight: "600",
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    fontSize: 14,
    color: COLORS.black,
  },
  editTextArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: COLORS.white,
  },
  editHelperText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  tagsHelper: {
    marginTop: 4,
  },
  editRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editRowItem: {
    flex: 1,
  },
  editRowSpacing: {
    marginRight: 12,
  },
  choiceEditorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addChoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F7FF",
  },
  addChoiceText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyChoiceText: {
    fontSize: 13,
    color: COLORS.gray,
    fontStyle: "italic",
  },
  choiceEditorCard: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: COLORS.white,
  },
  choiceEditorHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  choiceToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F7F7F7",
  },
  choiceToggleActive: {
    backgroundColor: "#66BB6A",
    borderColor: "#66BB6A",
  },
  choiceToggleText: {
    marginLeft: 8,
    color: COLORS.black,
    fontSize: 12,
  },
  choiceToggleTextActive: {
    color: COLORS.white,
  },
  choiceRemoveButton: {
    padding: 6,
  },
  choiceInputsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  choiceLabelInput: {
    width: 70,
    marginRight: 8,
  },
  choiceTextInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: "top",
  },
  editFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  editCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  editCancelText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "600",
  },
  editSaveButton: {
    flex: 1,
  },
});

