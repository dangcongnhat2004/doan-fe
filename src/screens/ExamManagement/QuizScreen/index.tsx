import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../../constants/colors';
import QuestionMenuModal from './QuestionMenuModal';
import ConfirmModal from './ConfirmModal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { getExamById, submitExamResults, ExamQuestion } from '../../../api/examService';
import { storage } from '../../../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamDoingPage'>;

export default function ExamDoingPage({ route, navigation }: Props) {
  const { examId } = route.params;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [visible, setVisible] = useState(false);
  const [answers, setAnswers] = useState<Map<string, { choiceId: string | number; answeredAt: string }>>(new Map());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const toggleMenu = useCallback(() => {
    setVisible(prev => !prev);
  }, []);

  // Load exam data and restore progress
  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        const examData = await getExamById(examId);
        setQuestions(examData.questions || []);
        
        let examDuration = 60;
        if (examData.description) {
          const durationMatch = examData.description.match(/\[Duration:\s*(\d+)\s*minutes?\]/i);
          if (durationMatch && durationMatch[1]) {
            examDuration = parseInt(durationMatch[1], 10);
          }
        }
        setTimeLeft(examDuration * 60);

        // Restore progress from storage
        const savedProgress = await storage.getExamProgress(examId);
        if (savedProgress && savedProgress.answers.length > 0) {
          const restoredAnswers = new Map<string, { choiceId: string | number; answeredAt: string }>();
          savedProgress.answers.forEach(({ questionId, choiceId, answeredAt }) => {
            restoredAnswers.set(questionId, { choiceId, answeredAt });
          });
          setAnswers(restoredAnswers);
        }
      } catch (err: any) {
        console.error("Error loading exam:", err);
        Alert.alert("Lỗi", err.message || "Không thể tải đề thi. Vui lòng thử lại.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId, navigation]);

  const handleSubmitExam = useCallback(() => {
    setShowSubmitModal(true);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitExam]);

  const formatTime = useCallback((seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const handleSelectChoice = (questionId: string, choiceId: number) => {
    const now = new Date().toISOString();
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, {
        choiceId,
        answeredAt: now,
      });
      return newAnswers;
    });
  };

  // Auto-save progress when answers change
  useEffect(() => {
    if (questions.length > 0) {
      const progress = Math.round((answers.size / questions.length) * 100);
      // Save progress even if no answers yet (to track 0% progress)
      storage.setExamProgress(examId, progress, answers);
    }
  }, [answers, questions.length, examId]);

  const performSubmitExam = useCallback(async () => {
    try {
      setSubmitting(true);
      setShowSubmitModal(false);
      const user = await storage.getUser();
      if (!user || !user.id) {
        setTimeout(() => {
          Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        }, 100);
        return;
      }

      const answersArray = questions.map((question) => {
        const answer = answers.get(question.question_id);
        if (answer) {
          return {
            question_id: question.question_id,
            selected_choice_id: answer.choiceId.toString(),
            answered_at: answer.answeredAt,
          };
        }
        return null;
      }).filter((answer) => answer !== null) as Array<{
        question_id: string;
        selected_choice_id: string;
        answered_at: string;
      }>;

      if (answersArray.length === 0) {
        setTimeout(() => {
          Alert.alert(
            "Cảnh báo",
            "Bạn chưa trả lời câu hỏi nào. Bạn có muốn nộp bài thi không?",
            [
              { text: "Hủy", style: "cancel" },
              {
                text: "Nộp bài",
                onPress: async () => {
                  try {
                    const emptyResult = await submitExamResults(examId, {
                      user_id: user.id,
                      started_at: startedAt,
                      answers: [],
                    });
                    // Clear progress from storage after successful submission
                    await storage.removeExamProgress(examId);
                    const reviewDataWithAnswers = questions.map(q => {
                      const answer = answers.get(q.question_id);
                      return {
                        ...q,
                        is_selected: answer ? answer.choiceId : null,
                      };
                    });
                    navigation.navigate('ReviewExam', {
                      reviewData: reviewDataWithAnswers,
                      examResult: emptyResult,
                      examId: examId,
                      startedAt: startedAt,
                    });
                  } catch (err: any) {
                    console.error("Error submitting exam:", err);
                    setTimeout(() => {
                      Alert.alert("Lỗi", err.message || "Không thể nộp bài thi. Vui lòng trả lời ít nhất một câu hỏi.");
                    }, 100);
                  } finally {
                    setSubmitting(false);
                  }
                },
              },
            ]
          );
        }, 100);
        return;
      }

      const result = await submitExamResults(examId, {
        user_id: user.id,
        started_at: startedAt,
        answers: answersArray,
      });

      // Clear progress from storage after successful submission
      await storage.removeExamProgress(examId);

      const reviewDataWithAnswers = questions.map(q => {
        const answer = answers.get(q.question_id);
        return {
          ...q,
          is_selected: answer ? answer.choiceId : null,
        };
      });
      
      navigation.navigate('ReviewExam', {
        reviewData: reviewDataWithAnswers,
        examResult: result,
        examId: examId,
        startedAt: startedAt,
      });
    } catch (err: any) {
      console.error("Error submitting exam:", err);
      setTimeout(() => {
        Alert.alert("Lỗi", err.message || "Không thể nộp bài thi. Vui lòng thử lại.");
      }, 100);
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, examId, startedAt, navigation]);

  const handleExitExam = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const performExitExam = useCallback(() => {
    setShowExitModal(false);
    navigation.goBack();
  }, [navigation]);

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const reviewDataWithAnswers = questions.map(q => {
        const answer = answers.get(q.question_id);
        return {
          ...q,
          is_selected: answer ? answer.choiceId : null,
        };
      });
      
      navigation.navigate('ReviewExam', {
        reviewData: reviewDataWithAnswers,
        examId: examId,
        startedAt: startedAt,
      });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const toggleFlag = () => {
    const currentQuestionId = questions[currentQuestion]?.question_id;
    if (!currentQuestionId) return;
    
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionId)) {
        newSet.delete(currentQuestionId);
      } else {
        newSet.add(currentQuestionId);
      }
      return newSet;
    });
  };

  const answeredCount = useMemo(() => {
    return answers.size;
  }, [answers]);

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải đề thi...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="description" size={48} color={COLORS.gray} />
        <Text style={styles.emptyText}>Không có câu hỏi nào trong đề thi này.</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleExitExam}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers.get(currentQ?.question_id || '');
  const isFlagged = flaggedQuestions.has(currentQ?.question_id || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top - 20, 8) }]}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleExitExam}
          accessible={true}
          accessibilityLabel="Đóng"
        >
          <Icon name="close" size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Câu {currentQuestion + 1} / {questions.length}
          </Text>
          <Text style={styles.answeredText}>
            Đã trả lời: {answeredCount}/{questions.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (submitting || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmitExam}
          disabled={submitting || loading}
          accessible={true}
          accessibilityLabel="Nộp bài thi"
        >
          <Icon 
            name="send" 
            size={18} 
            color={submitting || loading ? COLORS.gray : COLORS.white} 
          />
          <Text style={[styles.submitButtonText, (submitting || loading) && { color: COLORS.gray }]}>
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Icon name="access-time" size={20} color={timeLeft < 300 ? COLORS.alert : COLORS.primary} />
        <Text style={[styles.timerText, timeLeft < 300 && styles.timerWarning]}>
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Question Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>Câu {currentQuestion + 1}</Text>
            <TouchableOpacity
              style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
              onPress={toggleFlag}
              accessible={true}
              accessibilityLabel={isFlagged ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
            >
              <Icon 
                name="flag" 
                size={18} 
                color={isFlagged ? COLORS.white : COLORS.alert} 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.questionText}>{currentQ?.question_text}</Text>
        </View>

        {/* Choices */}
        <View style={styles.choicesContainer}>
          {currentQ?.choices?.map((choice) => {
            const isSelected = currentAnswer?.choiceId === choice.choice_id;
            return (
              <TouchableOpacity
                key={choice.choice_id}
                style={[styles.choiceItem, isSelected && styles.choiceItemSelected]}
                onPress={() => handleSelectChoice(currentQ.question_id, choice.choice_id)}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.choiceLabel, isSelected && styles.choiceLabelSelected]}>
                  <Text style={[styles.choiceLabelText, isSelected && styles.choiceLabelTextSelected]}>
                    {choice.label}
                  </Text>
                </View>
                <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                  {choice.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonSecondary, currentQuestion === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          accessible={true}
          accessibilityLabel="Câu trước"
        >
          <Icon name="arrow-back" size={20} color={currentQuestion === 0 ? COLORS.gray : COLORS.primary} />
          <Text style={[styles.navButtonText, styles.navButtonTextSecondary, currentQuestion === 0 && { color: COLORS.gray }]}>
            Trước
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonMenu]}
          onPress={toggleMenu}
          accessible={true}
          accessibilityLabel="Danh sách câu hỏi"
        >
          <Icon name="view-list" size={20} color={COLORS.black} />
          <Text style={[styles.navButtonText, { color: COLORS.black }]}>
            Danh sách
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNextQuestion}
          accessible={true}
          accessibilityLabel={currentQuestion < questions.length - 1 ? "Câu tiếp theo" : "Xem lại"}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
            {currentQuestion < questions.length - 1 ? "Tiếp theo" : "Xem lại"}
          </Text>
          <Icon name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Question Menu Modal */}
      <QuestionMenuModal
        questions={questions.map(q => ({
          question_id: q.question_id,
          question_text: q.question_text,
          choices: q.choices || [],
          is_selected: answers.get(q.question_id)?.choiceId || null,
        }))}
        currentIndex={currentQuestion}
        jumpToQuestion={index => setCurrentQuestion(index)}
        isVisible={visible}
        toggleMenu={toggleMenu}
        flaggedQuestions={flaggedQuestions}
      />

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        visible={showSubmitModal}
        title="Lưu ý"
        message="Bạn có chắc chắn nộp bài không?"
        secondMessage="Bạn vẫn chưa hoàn thành bài thi?"
        cancelText="Quay lại bài thi"
        confirmText="Nộp bài"
        confirmColor={COLORS.primary}
        onCancel={() => setShowSubmitModal(false)}
        onConfirm={performSubmitExam}
      />

      {/* Exit Confirmation Modal */}
      <ConfirmModal
        visible={showExitModal}
        title="Lưu ý"
        message="Bạn có chắc chắn thoát bài thi không?"
        cancelText="Quay lại bài thi"
        confirmText="Thoát"
        confirmColor="#EF4444"
        onCancel={() => setShowExitModal(false)}
        onConfirm={performExitExam}
      />
    </SafeAreaView>
  );
}
