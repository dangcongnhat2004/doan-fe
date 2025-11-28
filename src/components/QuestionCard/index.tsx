import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, TextInput as RNTextInput } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Text from "../Text";
import TextInput from "../TextInput";
import { COLORS } from "../../constants/colors";

export type QuestionChoice = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

export type QuestionData = {
  id: string;
  questionText: string;
  choices: QuestionChoice[];
  topic: string;
};

type QuestionCardProps = {
  question: QuestionData;
  onUpdate: (question: QuestionData) => void;
  onDelete: (id: string) => void;
  topics: string[];
  autoEdit?: boolean; // Auto enable edit mode for new questions
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
};

export default function QuestionCard({
  question,
  onUpdate,
  onDelete,
  topics,
  autoEdit = false,
  tags = [],
  onTagsChange,
}: QuestionCardProps) {
  // Auto enable edit mode if question is empty (new question) or autoEdit is true
  const [isEditing, setIsEditing] = useState(
    autoEdit || !question.questionText.trim()
  );
  const [editedQuestion, setEditedQuestion] = useState(question);
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

  const handleUpdate = () => {
    onUpdate(editedQuestion);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuestion(question);
    setIsEditing(false);
  };

  const handleChoiceToggle = (choiceId: string) => {
    const updated = {
      ...editedQuestion,
      choices: editedQuestion.choices.map((choice) =>
        choice.id === choiceId
          ? { ...choice, isCorrect: !choice.isCorrect }
          : choice
      ),
    };
    setEditedQuestion(updated);
    // Update immediately if not in edit mode
    if (!isEditing) {
      onUpdate(updated);
    }
  };

  const handleChoiceTextChange = (choiceId: string, text: string) => {
    setEditedQuestion({
      ...editedQuestion,
      choices: editedQuestion.choices.map((choice) =>
        choice.id === choiceId ? { ...choice, text } : choice
      ),
    });
  };

  const handleDeleteChoice = (choiceId: string) => {
    if (editedQuestion.choices.length > 1) {
      setEditedQuestion({
        ...editedQuestion,
        choices: editedQuestion.choices.filter((c) => c.id !== choiceId),
      });
    }
  };

  const handleAddChoice = () => {
    const newLabel = String.fromCharCode(65 + editedQuestion.choices.length); // A, B, C, ...
    setEditedQuestion({
      ...editedQuestion,
      choices: [
        ...editedQuestion.choices,
        {
          id: `choice_${Date.now()}`,
          label: newLabel,
          text: "",
          isCorrect: false,
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        {isEditing ? (
          <TextInput
            style={styles.questionInput}
            value={editedQuestion.questionText}
            onChangeText={(text) =>
              setEditedQuestion({ ...editedQuestion, questionText: text })
            }
            multiline
            placeholder="Nhập câu hỏi..."
          />
        ) : (
          <Text style={styles.questionText}>{question.questionText}</Text>
        )}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity onPress={handleUpdate} style={styles.iconButton}>
                <Icon name="check" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
                <Icon name="x" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.iconButton}
              >
                <Icon name="edit-2" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(question.id)}
                style={styles.iconButton}
              >
                <Icon name="trash-2" size={20} color="#DC3545" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Choices */}
      <Text style={styles.choicesLabel}>Các tùy chọn câu trả lời:</Text>
      {editedQuestion.choices.map((choice) => (
        <View key={choice.id} style={styles.choiceRow}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              choice.isCorrect && styles.checkboxChecked,
            ]}
            onPress={() => handleChoiceToggle(choice.id)}
          >
            {choice.isCorrect && (
              <Icon name="check" size={14} color={COLORS.white} />
            )}
          </TouchableOpacity>
          {isEditing ? (
            <TextInput
              style={styles.choiceInput}
              value={choice.text}
              onChangeText={(text) => handleChoiceTextChange(choice.id, text)}
              placeholder={`Lựa chọn ${choice.label}`}
            />
          ) : (
            <Text style={styles.choiceText}>{choice.text}</Text>
          )}
          {isEditing && (
            <TouchableOpacity
              onPress={() => handleDeleteChoice(choice.id)}
              style={styles.deleteChoiceButton}
            >
              <Icon name="x" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {isEditing && (
        <TouchableOpacity
          style={styles.addChoiceButton}
          onPress={handleAddChoice}
        >
          <Icon name="plus" size={16} color={COLORS.primary} />
          <Text style={styles.addChoiceText}>Thêm câu trả lời</Text>
        </TouchableOpacity>
      )}

      {/* Topic */}
      <View style={styles.topicContainer}>
        <Text style={styles.topicLabel}>Chủ đề</Text>
        {isEditing ? (
          <TextInput
            style={styles.topicInput}
            value={editedQuestion.topic}
            onChangeText={(text) =>
              setEditedQuestion({ ...editedQuestion, topic: text })
            }
            placeholder="Nhập chủ đề..."
          />
        ) : (
          <Text style={styles.topicText}>
            {editedQuestion.topic || "Chưa có chủ đề"}
          </Text>
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginRight: 8,
  },
  questionInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    minHeight: 40,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  choicesLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    marginTop: 8,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  choiceInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 10,
  },
  choiceText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    paddingVertical: 10,
  },
  deleteChoiceButton: {
    padding: 4,
    marginLeft: 8,
  },
  addChoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  addChoiceText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  topicContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  topicLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  topicInput: {
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 10,
  },
  topicText: {
    fontSize: 14,
    color: COLORS.black,
    paddingVertical: 10,
  },
  tagManagementSection: {
    marginTop: 12,
    paddingTop: 12,
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

