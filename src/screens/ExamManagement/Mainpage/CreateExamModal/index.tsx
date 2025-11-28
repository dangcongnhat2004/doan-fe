import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { COLORS } from "../../../../constants/colors";
import { createExam, QuestionSetInput } from "../../../../api/examService";
import { getQuestionSets, QuestionSet, getQuestionSetDetail, QuestionSetDetail } from "../../../../api/questionService";
import { storage } from "../../../../utils/storage";
import Text from "../../../../components/Text";
import PrimaryButton from "../../../../components/PrimaryButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreateExamModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type SetSelectionState = {
  selectAll: boolean; // true if entire set is selected
  selectedQuestions: Set<string>; // selected question IDs
  questions: any[]; // loaded questions
  loading: boolean; // loading questions
};

export default function CreateExamModal({
  visible,
  onClose,
  onSuccess,
}: CreateExamModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60"); // Default 60 minutes
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [setSelections, setSetSelections] = useState<Map<string, SetSelectionState>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingSets, setLoadingSets] = useState(false);

  useEffect(() => {
    if (visible) {
      loadQuestionSets();
      // Reset form
      setTitle("");
      setDescription("");
      setDuration("60");
      setExpandedSets(new Set());
      setSetSelections(new Map());
    }
  }, [visible]);

  const loadQuestionSets = async () => {
    try {
      setLoadingSets(true);
      const user = await storage.getUser();
      if (!user || !user.id) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await getQuestionSets(user.id);
      setQuestionSets(response.sets || []);
    } catch (err: any) {
      console.error("Error loading question sets:", err);
      Alert.alert("Lỗi", err.message || "Không thể tải danh sách bộ câu hỏi.");
    } finally {
      setLoadingSets(false);
    }
  };

  const toggleSetExpand = async (setId: string) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
      // Load questions if not already loaded
      const selection = setSelections.get(setId);
      if (!selection || selection.questions.length === 0) {
        await loadSetQuestions(setId);
      }
    }
    setExpandedSets(newExpanded);
  };

  const loadSetQuestions = async (setId: string) => {
    try {
      const user = await storage.getUser();
      if (!user || !user.id) return;

      const currentSelection = setSelections.get(setId) || {
        selectAll: false,
        selectedQuestions: new Set<string>(),
        questions: [],
        loading: false,
      };

      setSetSelections(new Map(setSelections.set(setId, { ...currentSelection, loading: true })));

      const detail = await getQuestionSetDetail(user.id, setId);
      setSetSelections(
        new Map(
          setSelections.set(setId, {
            selectAll: currentSelection.selectAll,
            selectedQuestions: currentSelection.selectedQuestions,
            questions: detail.questions || [],
            loading: false,
          })
        )
      );
    } catch (err: any) {
      console.error("Error loading set questions:", err);
      const currentSelection = setSelections.get(setId) || {
        selectAll: false,
        selectedQuestions: new Set<string>(),
        questions: [],
        loading: false,
      };
      setSetSelections(new Map(setSelections.set(setId, { ...currentSelection, loading: false })));
    }
  };

  const toggleSetSelectAll = (setId: string) => {
    const selection = setSelections.get(setId);
    if (!selection) return;

    const newSelectAll = !selection.selectAll;
    setSetSelections(
      new Map(
        setSelections.set(setId, {
          ...selection,
          selectAll: newSelectAll,
          selectedQuestions: newSelectAll ? new Set(selection.questions.map((q) => q.question_id)) : new Set(),
        })
      )
    );
  };

  const toggleQuestionSelection = (setId: string, questionId: string) => {
    const selection = setSelections.get(setId);
    if (!selection) return;

    const newSelected = new Set(selection.selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }

    // Update selectAll based on whether all questions are selected
    const allSelected = newSelected.size === selection.questions.length && selection.questions.length > 0;

    setSetSelections(
      new Map(
        setSelections.set(setId, {
          ...selection,
          selectAll: allSelected,
          selectedQuestions: newSelected,
        })
      )
    );
  };

  const hasAnySelection = () => {
    for (const [setId, selection] of setSelections.entries()) {
      if (selection.selectAll || selection.selectedQuestions.size > 0) {
        return true;
      }
    }
    return false;
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề đề thi.");
      return;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập thời gian làm bài hợp lệ (lớn hơn 0).");
      return;
    }

    if (!hasAnySelection()) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một bộ câu hỏi hoặc câu hỏi.");
      return;
    }

    try {
      setLoading(true);
      const user = await storage.getUser();
      if (!user || !user.id) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      // Build question sets input
      const questionSetsInput: QuestionSetInput[] = [];
      for (const [setId, selection] of setSelections.entries()) {
        if (selection.selectAll) {
          // Select entire set
          questionSetsInput.push({
            set_id: setId,
          });
        } else if (selection.selectedQuestions.size > 0) {
          // Select specific questions
          questionSetsInput.push({
            set_id: setId,
            question_ids: Array.from(selection.selectedQuestions),
          });
        }
      }

      if (questionSetsInput.length === 0) {
        Alert.alert("Lỗi", "Vui lòng chọn ít nhất một bộ câu hỏi hoặc câu hỏi.");
        return;
      }

      // Store duration in description or create a custom field
      // Since API doesn't support duration, we'll append it to description
      const finalDescription = description.trim() 
        ? `${description.trim()}\n[Duration: ${duration} minutes]`
        : `[Duration: ${duration} minutes]`;

      await createExam({
        title: title.trim(),
        description: finalDescription,
        created_by: user.id,
        question_sets: questionSetsInput,
      });

      // Store duration in local storage for this exam (we'll get exam_id from response)
      // For now, we'll parse it from description when loading

      Alert.alert("Thành công", "Tạo đề thi thành công!");
      onSuccess();
    } catch (err: any) {
      console.error("Error creating exam:", err);
      Alert.alert("Lỗi", err.message || "Không thể tạo đề thi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modalContent,
              {
                maxHeight: windowHeight * 0.95,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="bold" style={styles.headerTitle}>
              Tạo đề thi mới
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề đề thi *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tiêu đề đề thi"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập mô tả đề thi (tùy chọn)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            {/* Duration Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thời gian làm bài (phút) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập thời gian làm bài (ví dụ: 60)"
                value={duration}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setDuration(numericValue);
                }}
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray}
              />
              <Text style={styles.hintText}>
                Thời gian mặc định: 60 phút. Nhập số phút bạn muốn (ví dụ: 30, 45, 60, 90)
              </Text>
            </View>

            {/* Question Sets Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chọn bộ câu hỏi *</Text>
              {loadingSets ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Đang tải danh sách bộ câu hỏi...</Text>
                </View>
              ) : questionSets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Chưa có bộ câu hỏi nào. Vui lòng tạo bộ câu hỏi trước.
                  </Text>
                </View>
              ) : (
                <View style={styles.setsContainer}>
                  {questionSets.map((set) => {
                    const selection = setSelections.get(set.set_id) || {
                      selectAll: false,
                      selectedQuestions: new Set<string>(),
                      questions: [],
                      loading: false,
                    };
                    const isExpanded = expandedSets.has(set.set_id);
                    const isSelected = selection.selectAll || selection.selectedQuestions.size > 0;
                    const selectedCount = selection.selectAll
                      ? selection.questions.length || set.question_count
                      : selection.selectedQuestions.size;

                    return (
                      <View
                        key={set.set_id}
                        style={[
                          styles.setItem,
                          isSelected && styles.setItemSelected,
                        ]}
                      >
                        {/* Set Header */}
                        <TouchableOpacity
                          onPress={() => toggleSetExpand(set.set_id)}
                          style={styles.setHeader}
                        >
                          <View style={styles.setItemContent}>
                            <Icon
                              name={isExpanded ? "expand-less" : "expand-more"}
                              size={24}
                              color={COLORS.gray}
                            />
                            <View style={styles.setItemText}>
                              <Text variant="bold" style={styles.setItemTitle}>
                                {set.title}
                              </Text>
                              <Text style={styles.setItemDescription}>
                                {set.description || "Không có mô tả"}
                              </Text>
                              <Text style={styles.setItemMeta}>
                                {set.question_count} câu hỏi
                                {isSelected && ` • Đã chọn ${selectedCount} câu`}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Select All Checkbox */}
                        <TouchableOpacity
                          onPress={() => toggleSetSelectAll(set.set_id)}
                          style={styles.selectAllRow}
                        >
                          <Icon
                            name={selection.selectAll ? "check-box" : "check-box-outline-blank"}
                            size={24}
                            color={selection.selectAll ? COLORS.primary : COLORS.gray}
                          />
                          <Text style={styles.selectAllText}>Chọn tất cả</Text>
                        </TouchableOpacity>

                        {/* Questions List (when expanded) */}
                        {isExpanded && (
                          <View style={styles.questionsContainer}>
                            {selection.loading ? (
                              <View style={styles.loadingQuestions}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
                              </View>
                            ) : selection.questions.length === 0 ? (
                              <Text style={styles.emptyQuestionsText}>Không có câu hỏi nào</Text>
                            ) : (
                              selection.questions.map((question, index) => {
                                const isQuestionSelected =
                                  selection.selectAll || selection.selectedQuestions.has(question.question_id);
                                return (
                                  <TouchableOpacity
                                    key={question.question_id}
                                    onPress={() => toggleQuestionSelection(set.set_id, question.question_id)}
                                    style={styles.questionItem}
                                  >
                                    <Icon
                                      name={isQuestionSelected ? "check-box" : "check-box-outline-blank"}
                                      size={20}
                                      color={isQuestionSelected ? COLORS.primary : COLORS.gray}
                                    />
                                    <View style={styles.questionText}>
                                      <Text style={styles.questionNumber}>Câu {index + 1}:</Text>
                                      <Text style={styles.questionContent} numberOfLines={2}>
                                        {question.question_text}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <PrimaryButton
              title={loading ? "Đang tạo..." : "Tạo đề thi"}
              onPress={handleCreate}
              disabled={loading || !title.trim() || !hasAnySelection() || !duration || parseInt(duration) <= 0}
              style={styles.createButton}
            />
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalWrapper: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    paddingBottom: 20,
    overflow: "hidden",
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  inputGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  hintText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: "italic",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.gray,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.gray,
    textAlign: "center",
  },
  setsContainer: {
    marginTop: 8,
  },
  setItem: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  setItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F7FF",
  },
  setItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  setItemText: {
    flex: 1,
    marginLeft: 12,
  },
  setItemTitle: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 4,
  },
  setItemDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  setItemMeta: {
    fontSize: 12,
    color: COLORS.primary,
  },
  setHeader: {
    width: "100%",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 8,
  },
  questionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    maxHeight: 300,
  },
  loadingQuestions: {
    padding: 16,
    alignItems: "center",
  },
  emptyQuestionsText: {
    padding: 16,
    textAlign: "center",
    color: COLORS.gray,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  questionText: {
    flex: 1,
    marginLeft: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 2,
  },
  questionContent: {
    fontSize: 14,
    color: COLORS.black,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  createButton: {
    flex: 1,
  },
});

