import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Text from "../Text";
import { COLORS } from "../../constants/colors";
import { ExtractedQuestionData } from "../ExtractedQuestionCard";

type QuestionSetCardProps = {
  question: ExtractedQuestionData;
  questionId: string; // Format: Q001, Q002, etc.
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
};

export default function QuestionSetCard({
  question,
  questionId,
  tags = [],
  onTagsChange,
}: QuestionSetCardProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && onTagsChange) {
      onTagsChange([...tags, trimmedTag]);
      setNewTagInput("");
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (onTagsChange) {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove));
    }
  };

  // Map difficulty to color - Fresh and vibrant colors with better contrast
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Khó":
        return "#FF6B9D"; // Vibrant pink - better contrast
      case "Trung bình":
        return "#FFA726"; // Vibrant orange - better contrast
      case "Dễ":
        return "#66BB6A"; // Vibrant green - better contrast
      default:
        return "#F5F5F5";
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    // Always white for better readability on vibrant backgrounds
    return "#FFFFFF";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.questionId}>ID: {questionId}</Text>
        <View
          style={[
            styles.statusTag,
            question.status === "standardized"
              ? styles.statusTagStandardized
              : styles.statusTagReview,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              question.status === "standardized"
                ? styles.statusTextStandardized
                : styles.statusTextReview,
            ]}
          >
            {question.status === "standardized"
              ? "Đã chuẩn hóa"
              : "Đang xem xét"}
          </Text>
        </View>
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.questionText}</Text>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {question.difficulty && (
          <View
            style={[
              styles.tag,
              { backgroundColor: getDifficultyColor(question.difficulty) },
            ]}
          >
            <Text
              style={[
                styles.tagText,
                { color: getDifficultyTextColor(question.difficulty) },
              ]}
            >
              {question.difficulty}
            </Text>
          </View>
        )}
        <View style={[styles.tag, styles.tagType]}>
          <Text style={[styles.tagText, styles.tagTypeText]}>Tự luận</Text>
        </View>
        {question.topic && (
          <View style={[styles.tag, styles.tagSubject]}>
            <Text style={[styles.tagText, styles.tagSubjectText]}>
              {question.topic}
            </Text>
          </View>
        )}
      </View>

      {/* Tag Management Section */}
      {onTagsChange && (
        <View style={styles.tagManagementSection}>
          <Text style={styles.tagLabel}>Tag</Text>
          <View style={styles.userTagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.userTag}>
                <Text style={styles.userTagText}>{tag}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTag(tag)}
                  style={styles.removeTagButton}
                >
                  <Icon name="x" size={14} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            {showTagInput ? (
              <View style={styles.tagInputContainer}>
                <RNTextInput
                  style={styles.tagInput}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  placeholder="Nhập tag..."
                  placeholderTextColor={COLORS.gray}
                  onSubmitEditing={handleAddTag}
                  autoFocus
                  onBlur={() => {
                    if (newTagInput.trim()) {
                      handleAddTag();
                    } else {
                      setShowTagInput(false);
                    }
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={() => setShowTagInput(true)}
              >
                <Icon name="plus" size={16} color={COLORS.primary} />
                <Text style={styles.addTagText}>Thêm tag</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  questionId: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "600",
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagReview: {
    backgroundColor: "#FF8C42", // Vibrant orange
  },
  statusTagStandardized: {
    backgroundColor: "#4ECDC4", // Vibrant teal/green
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700", // Bolder for better readability
  },
  statusTextReview: {
    color: "#FFFFFF", // White text on orange
  },
  statusTextStandardized: {
    color: "#FFFFFF", // White text on teal
  },
  questionText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagType: {
    backgroundColor: "#29B6F6", // Brighter blue/cyan - better contrast
  },
  tagSubject: {
    backgroundColor: "#66BB6A", // Vibrant green - fresh
  },
  tagText: {
    fontSize: 13,
    fontWeight: "700", // Bolder for better readability
  },
  tagTypeText: {
    color: "#FFFFFF", // White text on blue
  },
  tagSubjectText: {
    color: "#FFFFFF", // White text on green
  },
  tagManagementSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  tagLabel: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 8,
    fontWeight: "600",
  },
  userTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  userTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  userTagText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: "600",
  },
  removeTagButton: {
    padding: 2,
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addTagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  tagInputContainer: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 120,
  },
  tagInput: {
    fontSize: 13,
    color: COLORS.black,
    padding: 0,
  },
});

