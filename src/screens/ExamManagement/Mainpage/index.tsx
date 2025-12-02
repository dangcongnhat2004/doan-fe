import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Alert, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenHeader from "../../../components/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";
import { getExams, ExamListItem } from "../../../api/examService";
import { storage } from "../../../utils/storage";
import { Exam } from "../../../types";
import ExamCard from "./ExamCard";
import WidgetTab from "./WidgetTab";
import { BottomNavigation } from "../../../components";
import CreateExamModal from "./CreateExamModal";
import DashboardLayout from "../../../components/DashboardLayout";


export default function ExamMainPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examProgress, setExamProgress] = useState<Map<string, number>>(new Map());

  const loadExams = useCallback(async () => {
    try {
      setError(null);
      const user = await storage.getUser();
      
      if (!user || !user.id) {
        setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      const response = await getExams({
        created_by: user.id,
        limit: 50,
        offset: 0,
      });
      
      setExams(response.exams || []);

      // Load progress for each exam from storage
      const progressMap = new Map<string, number>();
      for (const exam of response.exams || []) {
        const savedProgress = await storage.getExamProgress(exam.exam_id);
        if (savedProgress) {
          progressMap.set(exam.exam_id, savedProgress.progress);
        }
      }
      setExamProgress(progressMap);
    } catch (err: any) {
      console.error("Error loading exams:", err);
      setError(err.message || "Không thể tải danh sách đề thi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Reload progress when screen is focused (when returning from exam screen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const reloadProgress = async () => {
        if (exams.length === 0) return;
        const progressMap = new Map<string, number>();
        for (const exam of exams) {
          const savedProgress = await storage.getExamProgress(exam.exam_id);
          if (savedProgress) {
            progressMap.set(exam.exam_id, savedProgress.progress);
          }
        }
        setExamProgress(progressMap);
      };
      reloadProgress();
    });

    return unsubscribe;
  }, [navigation, exams]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const handleCreateExam = () => {
    setShowCreateModal(true);
  };

  const handleExamCreated = () => {
    setShowCreateModal(false);
    loadExams(); // Reload exams after creating
  };

  const handleStartExam = (examId: string) => {
    // Navigate to exam doing page
    // This will be handled by ExamCard component
  };

  // Helper function to extract duration from description
  const extractDuration = (description: string | null): number => {
    if (!description) return 90; // Default duration
    const durationMatch = description.match(/\[Duration:\s*(\d+)\s*minutes?\]/i);
    if (durationMatch && durationMatch[1]) {
      return parseInt(durationMatch[1], 10);
    }
    return 90; // Default duration if not found
  };

  // Calculate stats
  const totalExams = exams.length;
  const inProgress = exams.filter(exam => {
    // Since API doesn't return status, we'll assume all are active for now
    // You may need to adjust this based on your actual API response
    return true;
  }).length;
  const totalStudents = 350; // This might come from a different API
  const pendingExam = 5; // This might come from a different API

  // Content component
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <>
        {error && (
          <View style={{ padding: 16, backgroundColor: '#ffebee', margin: 16, borderRadius: 8 }}>
            <Text style={{ color: '#c62828' }}>{error}</Text>
          </View>
        )}

        <FlatList<ExamListItem>
          style={styles.listContainer}
          contentContainerStyle={[
            styles.listContentContainer,
            { paddingBottom: Math.max(insets.bottom, 12) + 72 } // BottomNavigation height + safe area
          ]}
          data={exams}
          keyExtractor={(item: ExamListItem) => item.exam_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }: { item: ExamListItem }) => {
            const savedProgress = examProgress.get(item.exam_id) || 0;
            const isActive = savedProgress > 0 && savedProgress < 100;
            const duration = extractDuration(item.description);
            return (
              <ExamCard
                examId={item.exam_id}
                title={item.title}
                createdAt={item.created_at}
                questionCount={item.questions_count || 0} 
                durationMinutes={duration}
                status={isActive ? "in-progress" : "published"} // Show as in-progress if has saved progress
                progress={savedProgress}
                onStart={() => handleStartExam(item.exam_id)}
              />
            );
          }}
          ListHeaderComponent={
            <View>
              <WidgetTab
                totalExams={totalExams}
                inProgress={inProgress}
                totalStudents={totalStudents}
                pendingExam={pendingExam}
              />
              
              <Text style={styles.headerText}>Đề thi của tôi</Text>

            </View>
            
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>
                  Chưa có đề thi nào. Tạo đề thi mới để bắt đầu!
                </Text>
              </View>
            ) : null
          }
          nestedScrollEnabled={Platform.OS === "web"}
        />

        {/* Floating button */}
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={[
              styles.fab,
              {
                bottom: Math.max(insets.bottom, 12) + 72,
              },
            ]}
            onPress={handleCreateExam}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  // Web Layout
  if (Platform.OS === "web") {
    return (
      <>
        <DashboardLayout title="Đề thi" showSearch={true}>
          {renderContent()}
        </DashboardLayout>
        {/* Create Exam Modal */}
        <CreateExamModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleExamCreated}
        />
      </>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.container}>
        <ScreenHeader    
          title="Quản lý đề thi"
          functionIcon="settings"
          function={() => Alert.alert('Icon clicked!')}
        />

        {renderContent()}

      {/* Create Exam Modal */}
      <CreateExamModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleExamCreated}
      />

       {/* Bottom Navigation */}
      <BottomNavigation currentTab={'ExamMainPage'} />
    </View>
  );
}
