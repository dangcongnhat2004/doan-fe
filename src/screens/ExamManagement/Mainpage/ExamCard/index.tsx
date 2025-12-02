import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import styles from "./styles";
import { formatDate } from "../../../../api/mockData";
import { COLORS } from "../../../../constants/colors";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/types";

type ExamCardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExamDoingPage'>;

export type ExamCardProps = {
  examId: string;
  title: string;
  createdAt: string;
  questionCount: number;
  durationMinutes: number;
  status?: string;
  progress?: number; // 0 - 100
  onStart?: () => void;
  style?: object; // replace className
};

const ExamCard: React.FC<ExamCardProps> = ({
  examId,
  title,
  createdAt,
  questionCount,
  durationMinutes,
  status = "draft",
  progress = 0,
  onStart,
}) => {
  const canStart = status === "published" || status === "in-progress";
  const navigation = useNavigation<ExamCardNavigationProp>();

  const handleNavigate = () => {
    if (!canStart) {
      Alert.alert("Thông báo", "Bài thi chưa được bắt đầu hoặc đã kết thúc.");
    } else {
      navigation.navigate("ExamDoingPage", { examId });
    }
  };

  return (
    <TouchableOpacity style={[styles.card]} onPress={handleNavigate} activeOpacity={0.9}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.row}>
            <View style={styles.titleWrapper}>
                <Text style={styles.title} numberOfLines={2}>
                {title}
                </Text>
            </View>

            <View style={styles.actionWrapper}>
                <TouchableOpacity  style={styles.iconButton}>
                    <Icon name="edit" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity  style={styles.iconButton}>
                    <Icon name="share" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                
            </View>
          </View>

          {/* Ngày tạo  và thông tin*/}
          <Text style={styles.date}>Ngày tạo: {formatDate(createdAt)}</Text>
          <Text style={styles.metaText}>
            {questionCount} câu   |   {durationMinutes} phút
          </Text>
        </View>
      </View>

      {/* Trạng thái và tiến độ */}
        {
            !canStart ? (
                <View style={[styles.statusBadge]}>
                    <Text style={styles.badgeText}>Đã kết thúc</Text>
                </View>
            ): (
                <View style={{ marginTop: 12 }}>
                    {/* Tag "Đang hoạt động" nếu có tiến độ */}
                    {progress > 0 && progress < 100 && (
                        <View style={[styles.statusBadge, styles.activeBadge]}>
                            <Text style={[styles.badgeText, styles.activeBadgeText]}>Đang hoạt động</Text>
                        </View>
                    )}
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Tiến độ: {progress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                            styles.progressFill,
                            {
                                width: `${Math.max(0, Math.min(100, progress))}%`,
                            },
                            ]}
                        />
                    </View>
                </View>
            )
        }
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={canStart ? handleNavigate : onStart}
          disabled={!canStart && !onStart}
          style={[
            styles.button,
            { backgroundColor: canStart ? COLORS.primary : COLORS.lightGray },
          ]}
        >
          <Text style={[styles.buttonText, { color: canStart ? COLORS.white : COLORS.gray }]}>
            {canStart ? "Bắt đầu thi" : "Xem kết quả"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ExamCard;