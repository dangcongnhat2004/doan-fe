import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Alert, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import ScreenHeader from "../../../components/ScreenHeader";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";
import { getExams, ExamListItem } from "../../../api/examService";
import { storage } from "../../../utils/storage";
import { Exam } from "../../../types";
import ExamCard from "./ExamCard";
import WidgetTab from "./WidgetTab";
import { BottomNavigation } from "../../../components";
import CreateExamModal from "./CreateExamModal";


export default function ExamMainPage() {
  const insets = useSafeAreaInsets();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Calculate stats
  const totalExams = exams.length;
  const inProgress = exams.filter(exam => {
    // Since API doesn't return status, we'll assume all are active for now
    // You may need to adjust this based on your actual API response
    return true;
  }).length;
  const totalStudents = 350; // This might come from a different API
  const pendingExam = 5; // This might come from a different API

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader    
          title="Quản lý đề thi"
          functionIcon="settings"
          function={() => Alert.alert('Icon clicked!')}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <ScreenHeader    
          title="Quản lý đề thi"
          functionIcon="settings"
          function={() => Alert.alert('Icon clicked!')}
        />

        {error && (
          <View style={{ padding: 16, backgroundColor: '#ffebee', margin: 16, borderRadius: 8 }}>
            <Text style={{ color: '#c62828' }}>{error}</Text>
          </View>
        )}

        <FlatList<ExamListItem>
          style={styles.listContainer}
          data={exams}
          keyExtractor={(item: ExamListItem) => item.exam_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }: { item: ExamListItem }) => (
            <ExamCard
              examId={item.exam_id}
              title={item.title}
              createdAt={item.created_at}
              questionCount={item.questions_count || 0} 
              durationMinutes={90} // Default duration, can be updated if API provides it
              status="published" // Default status, can be updated if API provides it
              progress={0} // Default progress
              onStart={() => handleStartExam(item.exam_id)}
            />
          )}
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
      />

      {/* Floating button */}
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

      {/* Create Exam Modal */}
      <CreateExamModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleExamCreated}
      />

       {/* Bottom Navigation */}
      <BottomNavigation currentTab={'ExamMainPage'} />


      {/* bottom navbar */}
      
    </SafeAreaView>
  );
}
