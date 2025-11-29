import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import Text from "../../components/Text";
import { COLORS } from "../../constants/colors";
import { getQuestionSets, QuestionSet } from "../../api/questionService";
import { storage } from "../../utils/storage";
import QuestionSetCard from "./QuestionSetCard";
import DashboardLayout from "../../components/DashboardLayout";

type Props = NativeStackScreenProps<RootStackParamList, "QuestionManagement">;

export default function QuestionManagementScreen({ navigation }: Props) {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestionSets = async () => {
    try {
      setError(null);
      const user = await storage.getUser();
      console.log("Current user from storage:", user);
      
      if (!user || !user.id) {
        setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      console.log("Loading question sets for user_id:", user.id);
      const response = await getQuestionSets(user.id);
      console.log("Question sets response:", response);
      setQuestionSets(response.sets || []);
    } catch (err: any) {
      console.error("Error loading question sets:", err);
      setError(err.message || "Không thể tải danh sách bộ câu hỏi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestionSets();
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
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Content component
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={48} color={COLORS.gray} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadQuestionSets}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (questionSets.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="folder" size={64} color={COLORS.gray} />
          <Text variant="bold" style={styles.emptyTitle}>
            Chưa có bộ câu hỏi nào
          </Text>
          <Text style={styles.emptyText}>
            Tạo bộ câu hỏi đầu tiên của bạn bằng cách tải lên câu hỏi
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("Upload")}
          >
            <Icon name="plus" size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Tạo bộ câu hỏi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
        nestedScrollEnabled={Platform.OS === "web"}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Icon name="folder" size={24} color={COLORS.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Tổng số bộ câu hỏi</Text>
              <Text variant="bold" style={styles.summaryValue}>
                {questionSets.length}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Icon name="help-circle" size={24} color={COLORS.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Tổng số câu hỏi</Text>
              <Text variant="bold" style={styles.summaryValue}>
                {questionSets.reduce((sum, set) => sum + set.question_count, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Question Sets List */}
        <View style={styles.setsSection}>
          <Text variant="bold" style={styles.sectionTitle}>
            Bộ câu hỏi của tôi
          </Text>
          {questionSets.map((set) => (
            <QuestionSetCard
              key={set.set_id}
              setId={set.set_id}
              title={set.title}
              description={set.description}
              questionCount={set.question_count}
              createdAt={formatDate(set.created_at)}
              onPress={async () => {
                const user = await storage.getUser();
                if (user && user.id) {
                  navigation.navigate("QuestionSetDetail", {
                    userId: user.id,
                    setId: set.set_id,
                  });
                }
              }}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  // Web Layout
  if (Platform.OS === "web") {
    return (
      <DashboardLayout title="Quản lý câu hỏi" showSearch={true}>
        {renderContent()}
      </DashboardLayout>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text variant="bold" style={styles.headerTitle}>
          Quản lý câu hỏi
        </Text>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {renderContent()}
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
  searchButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Platform.OS === "web" ? 0 : 20,
    paddingBottom: Platform.OS === "web" ? 0 : 100,
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
  emptyTitle: {
    fontSize: 18,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  summaryCard: {
    flexDirection: "row",
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
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 20,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    color: COLORS.black,
  },
  setsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.black,
    marginBottom: 16,
  },
});

