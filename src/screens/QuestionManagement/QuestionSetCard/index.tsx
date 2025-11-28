import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Text from "../../../components/Text";
import { COLORS } from "../../../constants/colors";

type QuestionSetCardProps = {
  setId: string;
  title: string;
  description: string;
  questionCount: number;
  createdAt: string;
  onPress: () => void;
};

export default function QuestionSetCard({
  setId,
  title,
  description,
  questionCount,
  createdAt,
  onPress,
}: QuestionSetCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Icon name="folder" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text variant="bold" style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.setId}>ID: {setId}</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.gray} />
      </View>

      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Icon name="help-circle" size={16} color={COLORS.gray} />
          <Text style={styles.footerText}>
            {questionCount} {questionCount === 1 ? "câu hỏi" : "câu hỏi"}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="calendar" size={16} color={COLORS.gray} />
          <Text style={styles.footerText}>{createdAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 4,
  },
  setId: {
    fontSize: 12,
    color: COLORS.gray,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.gray,
  },
});

