import React from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS } from "../../../../constants/colors";
import { styles } from "./styles";

interface Question {
  question_id: string;
  is_selected?: number | null;
}

interface QuestionMenuModalProps {
  questions: Question[];
  currentIndex: number;
  jumpToQuestion: (index: number) => void;
  isVisible: boolean;
  toggleMenu: () => void;
  flaggedQuestions?: Set<string>;
}

const QuestionMenuModal = ({ questions, currentIndex, jumpToQuestion, isVisible = false, toggleMenu, flaggedQuestions = new Set() }: QuestionMenuModalProps) => {




  return (
    <View>
      {/* Modal hiển thị danh sách câu hỏi */}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={toggleMenu} // nút back trên Android
      >
        {/* Overlay full màn hình */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu} // ấn ra ngoài → tắt modal
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn câu hỏi</Text>
              <TouchableOpacity
                onPress={toggleMenu}
                style={styles.closeModalButton}
                accessible={true}
                accessibilityLabel="Đóng"
              >
                <Icon name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={questions}
              keyExtractor={(item) => item.question_id}
              numColumns={5}
              contentContainerStyle={styles.questionGrid}
              renderItem={({ item, index }) => {
                const isFlagged = flaggedQuestions.has(item.question_id);
                const isCurrent = index === currentIndex;
                const isAnswered = item.is_selected !== null && item.is_selected !== undefined;
                return (
                  <View style={styles.questionBtnContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        jumpToQuestion(index);
                        toggleMenu();
                      }}
                      style={[
                        styles.questionBtn,
                        isCurrent && styles.questionBtnCurrent,
                        isAnswered && !isCurrent && styles.questionBtnAnswered,
                      ]}
                      accessible={true}
                      accessibilityLabel={`Câu ${index + 1}${isAnswered ? ', đã trả lời' : ''}${isFlagged ? ', đã đánh dấu' : ''}`}
                    >
                      <Text
                        style={[
                          styles.questionBtnText,
                          isCurrent && styles.questionBtnTextCurrent,
                          isAnswered && !isCurrent && styles.questionBtnTextAnswered,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </TouchableOpacity>
                    {isFlagged && (
                      <View style={styles.flagIndicator}>
                        <Icon name="flag" size={10} color={COLORS.alert} />
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default QuestionMenuModal;
