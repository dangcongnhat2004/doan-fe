import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Text from "../Text";
import TextInput from "../TextInput";
import { COLORS } from "../../constants/colors";

export type ExtractedQuestionData = {
  id: string;
  questionText: string;
  questionImage?: string;
  topic: string;
  difficulty: "Dễ" | "Trung bình" | "Khó" | "";
  status: "under_review" | "standardized";
  order: number;
};

type ExtractedQuestionCardProps = {
  question: ExtractedQuestionData;
  onUpdate: (question: ExtractedQuestionData) => void;
  onDelete: (id: string) => void;
  topics: string[];
};

export default function ExtractedQuestionCard({
  question,
  onUpdate,
  onDelete,
  topics,
}: ExtractedQuestionCardProps) {
  const [editedQuestion, setEditedQuestion] = useState(question);

  const handleUpdate = () => {
    onUpdate(editedQuestion);
  };

  const handleToggleStatus = () => {
    const newStatus = editedQuestion.status === "standardized" 
      ? "under_review" 
      : "standardized";
    setEditedQuestion({ ...editedQuestion, status: newStatus });
    onUpdate({ ...editedQuestion, status: newStatus });
  };

  const difficulties = ["Dễ", "Trung bình", "Khó"];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="bold" style={styles.questionNumber}>
          Câu hỏi đã trích xuất #{String(question.order).padStart(3, "0")}
        </Text>
        <View
          style={[
            styles.statusTag,
            editedQuestion.status === "standardized"
              ? styles.statusTagStandardized
              : styles.statusTagReview,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              editedQuestion.status === "standardized"
                ? styles.statusTextStandardized
                : styles.statusTextReview,
            ]}
          >
            {editedQuestion.status === "standardized"
              ? "Đã chuẩn hóa"
              : "Đang xem xét"}
          </Text>
        </View>
      </View>

      {/* Question Image */}
      {editedQuestion.questionImage && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: editedQuestion.questionImage }}
            style={styles.questionImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Question Text */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nội dung câu hỏi</Text>
        <TextInput
          style={styles.questionTextInput}
          value={editedQuestion.questionText}
          onChangeText={(text) =>
            setEditedQuestion({ ...editedQuestion, questionText: text })
          }
          multiline
          placeholder="Nhập nội dung câu hỏi..."
          onBlur={handleUpdate}
        />
      </View>

      {/* Subject */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Chủ đề</Text>
        <TextInput
          style={styles.input}
          value={editedQuestion.topic}
          onChangeText={(text) =>
            setEditedQuestion({ ...editedQuestion, topic: text })
          }
          placeholder="Nhập chủ đề..."
          onBlur={handleUpdate}
        />
      </View>

      {/* Difficulty */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Độ khó</Text>
        <View style={styles.difficultyContainer}>
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.difficultyButton,
                editedQuestion.difficulty === diff &&
                  styles.difficultyButtonActive,
              ]}
              onPress={() => {
                setEditedQuestion({ ...editedQuestion, difficulty: diff });
                onUpdate({ ...editedQuestion, difficulty: diff });
              }}
            >
              <Text
                style={[
                  styles.difficultyText,
                  editedQuestion.difficulty === diff &&
                    styles.difficultyTextActive,
                ]}
              >
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(question.id)}
        >
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.standardizeButton}
          onPress={handleToggleStatus}
        >
          <Text style={styles.standardizeButtonText}>
            {editedQuestion.status === "standardized"
              ? "Đánh dấu chưa chuẩn hóa"
              : "Đánh dấu đã chuẩn hóa"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    color: COLORS.black,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagReview: {
    backgroundColor: "#FFF4E6",
  },
  statusTagStandardized: {
    backgroundColor: "#E6F7E6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextReview: {
    color: "#FF8C00",
  },
  statusTextStandardized: {
    color: "#28A745",
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  questionImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F5F5F5",
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    fontWeight: "600",
  },
  questionTextInput: {
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  input: {
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  difficultyButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  difficultyText: {
    fontSize: 14,
    color: COLORS.black,
  },
  difficultyTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  deleteButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "600",
  },
  standardizeButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  standardizeButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
  },
});

