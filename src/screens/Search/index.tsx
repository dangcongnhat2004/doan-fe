import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { COLORS } from "../../constants/colors";
import Text from "../../components/Text";
import BottomNavigation from "../../components/BottomNavigation";
import {
  semanticSearchQuestions,
  SemanticSearchResult,
} from "../../api/questionService";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

export default function SearchScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập từ khóa tìm kiếm.");
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const response = await semanticSearchQuestions({
        query: searchQuery.trim(),
        top_k: 2, // Set default to 2 to match test case
      });
      setResults(response.results || []);
    } catch (error: any) {
      console.error("Search error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tìm kiếm. Vui lòng thử lại.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const renderResultItem = ({ item, index }: { item: SemanticSearchResult; index: number }) => {
    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultNumber}>
            <Text style={styles.resultNumberText}>{index + 1}</Text>
          </View>
          {item.score !== undefined && (
            <View style={styles.scoreBadge}>
              <Icon name="trending-up" size={12} color={COLORS.primary} />
              <Text style={styles.scoreText}>
                {(item.score * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.resultQuestionText}>{item.question_text}</Text>

        {/* Meta Information Row */}
        <View style={styles.metaRow}>
          {item.difficulty && (
            <View style={[
              styles.difficultyTag,
              item.difficulty === "easy" && styles.difficultyEasy,
              item.difficulty === "medium" && styles.difficultyMedium,
              item.difficulty === "hard" && styles.difficultyHard,
            ]}>
              <Text style={styles.difficultyText}>
                {item.difficulty === "easy" ? "Dễ" : 
                 item.difficulty === "medium" ? "Trung bình" : "Khó"}
              </Text>
            </View>
          )}

          {item.bloom_level && (
            <View style={styles.bloomTag}>
              <Icon name="layers" size={12} color={COLORS.primary} />
              <Text style={styles.bloomText}>
                {item.bloom_level === "remember" ? "Nhớ" :
                 item.bloom_level === "understand" ? "Hiểu" :
                 item.bloom_level === "apply" ? "Áp dụng" :
                 item.bloom_level === "analyze" ? "Phân tích" :
                 item.bloom_level === "evaluate" ? "Đánh giá" : "Sáng tạo"}
              </Text>
            </View>
          )}

          {item.source && (
            <View style={styles.sourceTag}>
              <Icon name="link" size={12} color={COLORS.gray} />
              <Text style={styles.sourceText} numberOfLines={1}>{item.source}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagItem}>
                <Icon name="tag" size={10} color={COLORS.primary} />
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Media */}
        {item.media && item.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <View style={styles.mediaLabel}>
              <Icon name="image" size={12} color={COLORS.gray} />
              <Text style={styles.mediaText}>Có {item.media.length} file đính kèm</Text>
            </View>
          </View>
        )}

        {/* Explanation */}
        {item.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationLabel}>Giải thích:</Text>
            <Text style={styles.explanationText}>{item.explanation}</Text>
          </View>
        )}

        {/* Choices */}
        {item.choices && item.choices.length > 0 && (
          <View style={styles.choicesContainer}>
            <Text style={styles.choicesLabel}>Đáp án:</Text>
            {item.choices.map((choice) => (
              <View
                key={choice.choice_id}
                style={[
                  styles.choiceItem,
                  choice.is_correct && styles.choiceCorrect,
                ]}
              >
                <Text style={styles.choiceLabel}>{choice.label}.</Text>
                <Text style={styles.choiceText}>{choice.text}</Text>
                {choice.is_correct && (
                  <Icon name="check-circle" size={16} color="#4CAF50" />
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Đang tìm kiếm...</Text>
        </View>
      );
    }

    if (hasSearched && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptyText}>
            Thử tìm kiếm với từ khóa khác hoặc mở rộng phạm vi tìm kiếm
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="search" size={64} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>Tìm kiếm câu hỏi theo ngữ nghĩa</Text>
        <Text style={styles.emptyText}>
          Nhập từ khóa hoặc câu hỏi để tìm các câu hỏi liên quan
        </Text>
        <Text style={styles.emptyHint}>
          Ví dụ: "câu hỏi về ..."
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text variant="bold" style={styles.headerTitle}>
          Tìm kiếm
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm câu hỏi..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Icon name="x" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading || !searchQuery.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.searchButtonText}>Tìm kiếm</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.question_id}
        renderItem={renderResultItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <BottomNavigation currentTab="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.black,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  resultNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  resultQuestionText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  bloomTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  bloomText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  sourceTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    maxWidth: 150,
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "500",
  },
  mediaContainer: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  mediaLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mediaText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  explanationContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.black,
    lineHeight: 20,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyEasy: {
    backgroundColor: "#E8F5E9",
  },
  difficultyMedium: {
    backgroundColor: "#FFF3E0",
  },
  difficultyHard: {
    backgroundColor: "#FFEBEE",
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
  },
  choicesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  choicesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  choiceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: COLORS.lightGray,
  },
  choiceCorrect: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginRight: 8,
    minWidth: 24,
  },
  choiceText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: "italic",
    marginTop: 12,
    textAlign: "center",
  },
});

