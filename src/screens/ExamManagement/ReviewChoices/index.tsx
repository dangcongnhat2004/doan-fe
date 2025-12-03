import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as Icon, MaterialIcons as IconMaterial } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { styles } from './styles';
import { Question } from '../../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { SubmitExamResponse, submitExamResults } from '../../../api/examService';
import { storage } from '../../../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewExam'>;

export default function ReviewExamScreen({ navigation, route }: Props) {
  const { reviewData, examResult: initialExamResult, examId, startedAt } = route.params;
  const [examResult, setExamResult] = useState<SubmitExamResponse | undefined>(initialExamResult);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [successScore, setSuccessScore] = useState<number>(0);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [confirmScaleAnim] = useState(new Animated.Value(0));
  const [warningScaleAnim] = useState(new Animated.Value(0));
  const hasResult = !!examResult;
  const insets = useSafeAreaInsets();

  // Create a map of answers from examResult for quick lookup
  // Use useMemo to ensure it updates when examResult changes
  const answerMap = React.useMemo(() => {
    const map = new Map();
    if (examResult?.answers) {
      examResult.answers.forEach((answer) => {
        map.set(answer.question_id, answer);
      });
    }
    return map;
  }, [examResult]);

  const handleCloseSuccessModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
    });
  };

  const handleOpenConfirmModal = () => {
    confirmScaleAnim.setValue(0);
    setShowConfirmModal(true);
    Animated.spring(confirmScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleCloseConfirmModal = () => {
    Animated.timing(confirmScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowConfirmModal(false);
    });
  };

  const handleOpenWarningModal = () => {
    warningScaleAnim.setValue(0);
    setShowWarningModal(true);
    Animated.spring(warningScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleCloseWarningModal = () => {
    Animated.timing(warningScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowWarningModal(false);
    });
  };

  const handleSubmitExam = () => {
    if (!examId) {
      setTimeout(() => {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đề thi.");
      }, 100);
      return;
    }
    handleOpenConfirmModal();
  };

  const performSubmitExam = async () => {
    try {
      setSubmitting(true);
      handleCloseConfirmModal();
      
      if (!examId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đề thi.");
        setSubmitting(false);
        return;
      }
      
      const user = await storage.getUser();
      if (!user || !user.id) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setSubmitting(false);
        return;
      }

      // Prepare answers array from reviewData
      const answersArray = reviewData
        .filter(q => q.is_selected !== null && q.is_selected !== undefined)
        .map(q => ({
          question_id: q.question_id,
          selected_choice_id: q.is_selected!.toString(),
          answered_at: new Date().toISOString(),
        }));

      if (answersArray.length === 0) {
        handleOpenWarningModal();
        setSubmitting(false);
        return;
      }

      // Submit exam results
      const result = await submitExamResults(examId, {
        user_id: user.id,
        started_at: startedAt || new Date().toISOString(),
        answers: answersArray,
      });

      // Update state with result - this will trigger UI update
      setExamResult(result);
      
      // Show success modal with animation
      setSuccessScore(result.score);
      scaleAnim.setValue(0);
      setShowSuccessModal(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } catch (err: any) {
      console.error("Error submitting exam:", err);
      setTimeout(() => {
        Alert.alert("Lỗi", err.message || "Không thể nộp bài thi. Vui lòng thử lại.");
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  const performSubmitEmptyExam = async () => {
    try {
      setSubmitting(true);
      handleCloseWarningModal();
      
      if (!examId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đề thi.");
        setSubmitting(false);
        return;
      }
      
      const user = await storage.getUser();
      if (!user || !user.id) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setSubmitting(false);
        return;
      }

      const emptyResult = await submitExamResults(examId, {
        user_id: user.id,
        started_at: startedAt || new Date().toISOString(),
        answers: [],
      });
      
      setExamResult(emptyResult);
      
      // Show success modal
      setSuccessScore(emptyResult.score);
      scaleAnim.setValue(0);
      setShowSuccessModal(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } catch (err: any) {
      console.error("Error submitting exam:", err);
      setTimeout(() => {
        Alert.alert("Lỗi", err.message || "Không thể nộp bài thi. Vui lòng trả lời ít nhất một câu hỏi.");
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item, index }: { item: Question; index: number }) => {
    const resultAnswer = answerMap.get(item.question_id);
    const selectedChoice = item.is_selected;
    
    // Determine if answer was selected - check both resultAnswer and selectedChoice
    const hasSelectedAnswer = resultAnswer || (selectedChoice !== null && selectedChoice !== undefined);
    
    // Get selected choice details
    let selectedLabel = '';
    let selectedText = '';
    
    if (resultAnswer) {
      // If we have result from API, use that
      selectedLabel = resultAnswer.selected_choice_label || '';
      // Find the choice text by matching label
      const matchedChoice = item.choices?.find(c => c.label === resultAnswer.selected_choice_label);
      selectedText = matchedChoice?.text || '';
    } else if (selectedChoice !== null && selectedChoice !== undefined) {
      // Otherwise use from reviewData
      const matchedChoice = item.choices?.find(c => c.choice_id === selectedChoice);
      selectedLabel = matchedChoice?.label || '';
      selectedText = matchedChoice?.text || '';
    }
    
    const isCorrect = resultAnswer?.is_correct ?? false;

    // Find correct answer
    const correctChoice = item.choices?.find(c => c.is_correct);

    return (
      <View style={[styles.card, hasResult && isCorrect && styles.cardCorrect, hasResult && !isCorrect && styles.cardIncorrect]}>
        <View style={styles.titleRow}>
          <Icon name="file-text" size={18} color={hasResult ? (isCorrect ? '#4CAF50' : '#F44336') : COLORS.primary} />
          <Text style={styles.questionIndex}>Câu {index + 1}:</Text>
          {hasResult && (
            <View style={[styles.statusBadge, isCorrect ? styles.statusCorrect : styles.statusIncorrect]}>
              <IconMaterial 
                name={isCorrect ? "check-circle" : "cancel"} 
                size={16} 
                color={COLORS.white} 
              />
              <Text style={styles.statusText}>
                {isCorrect ? "Đúng" : "Sai"}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.questionText}>{item.question_text}</Text>

        {/* Selected Answer */}
        {hasSelectedAnswer && selectedLabel && selectedText ? (
          <View style={styles.answerSection}>
            <Text style={styles.answerSectionTitle}>Đáp án bạn chọn:</Text>
            <View style={[styles.answerBox, hasResult && !isCorrect && styles.answerBoxIncorrect]}>
              <Text style={styles.answerLabel}>{selectedLabel}</Text>
              <Text style={styles.answerText}>{selectedText}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.answerSection}>
            <Text style={styles.answerSectionTitle}>Đáp án bạn chọn:</Text>
            <View style={styles.answerBox}>
              <Text style={styles.unansweredText}>Chưa chọn đáp án</Text>
            </View>
          </View>
        )}

        {/* Correct Answer (show if result exists - for wrong answers, show as comparison) */}
        {hasResult && correctChoice && (
          <View style={styles.answerSection}>
            <Text style={styles.answerSectionTitle}>Đáp án đúng:</Text>
            <View style={[styles.answerBox, styles.answerBoxCorrect]}>
              <Text style={styles.answerLabel}>{correctChoice.label}</Text>
              <Text style={styles.answerText}>{correctChoice.text}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity onPress={() => navigation.navigate('ExamMainPage')}>
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {hasResult ? 'Kết quả bài thi' : 'Xem lại'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Result Summary (only show if has result) */}
      {hasResult && examResult && (
        <View style={styles.resultSummary}>
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <IconMaterial name="emoji-events" size={32} color="#FFD700" />
              <View style={styles.resultInfo}>
                <Text style={styles.resultLabel}>Điểm số</Text>
                <Text style={styles.resultValue}>{examResult.score.toFixed(1)} / 100</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{examResult.correct_answers}</Text>
              <Text style={styles.statLabel}>Câu đúng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{examResult.total_questions - examResult.correct_answers}</Text>
              <Text style={styles.statLabel}>Câu sai</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{examResult.total_questions}</Text>
              <Text style={styles.statLabel}>Tổng câu</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={reviewData}
        keyExtractor={item => item.question_id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 + insets.bottom }}
        extraData={examResult} // Force re-render when examResult changes
        ListHeaderComponent={
          hasResult ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chi tiết từng câu hỏi</Text>
            </View>
          ) : null
        }
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!hasResult ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.backBtn]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={18} color={COLORS.black} />
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log("Review screen submit button clicked");
                // Use setTimeout to avoid aria-hidden conflict with Alert
                setTimeout(() => {
                  handleSubmitExam();
                }, 0);
              }}
              disabled={submitting}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Nộp bài thi"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>Nộp bài</Text>
                  <Icon name="send" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.backBtn, { flex: 1 }]}
            onPress={() => navigation.navigate('ExamMainPage')}
          >
            <Icon name="arrow-left" size={18} color={COLORS.black} />
            <Text style={styles.backText}>Về danh sách</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIconCircle}>
                <IconMaterial name="check-circle" size={64} color="#4CAF50" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.successTitle}>Thành công!</Text>

            {/* Message */}
            <Text style={styles.successMessage}>
              Bạn đã nộp bài thi thành công
            </Text>

            {/* Score */}
            <View style={styles.successScoreContainer}>
              <Text style={styles.successScoreLabel}>Điểm số</Text>
              <Text style={styles.successScoreValue}>
                {successScore.toFixed(1)}<Text style={styles.successScoreMax}> / 100</Text>
              </Text>
            </View>

            {/* OK Button */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleCloseSuccessModal}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseConfirmModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.confirmModalContent,
              {
                transform: [{ scale: confirmScaleAnim }],
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.confirmIconContainer}>
              <View style={styles.confirmIconCircle}>
                <IconMaterial name="help-outline" size={48} color={COLORS.primary} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.confirmTitle}>Xác nhận</Text>

            {/* Message */}
            <Text style={styles.confirmMessage}>
              Bạn có chắc chắn muốn nộp bài thi?
            </Text>

            {/* Buttons */}
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={handleCloseConfirmModal}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSubmitButton}
                onPress={performSubmitExam}
                activeOpacity={0.8}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmSubmitText}>Nộp bài</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseWarningModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.warningModalContent,
              {
                transform: [{ scale: warningScaleAnim }],
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.warningIconContainer}>
              <View style={styles.warningIconCircle}>
                <IconMaterial name="warning" size={48} color="#FF9800" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.warningTitle}>Cảnh báo</Text>

            {/* Message */}
            <Text style={styles.warningMessage}>
              Bạn chưa trả lời câu hỏi nào.{"\n"}Bạn có muốn nộp bài thi không?
            </Text>

            {/* Buttons */}
            <View style={styles.warningButtons}>
              <TouchableOpacity
                style={styles.warningCancelButton}
                onPress={handleCloseWarningModal}
                activeOpacity={0.8}
              >
                <Text style={styles.warningCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.warningSubmitButton}
                onPress={performSubmitEmptyExam}
                activeOpacity={0.8}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.warningSubmitText}>Nộp bài</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
