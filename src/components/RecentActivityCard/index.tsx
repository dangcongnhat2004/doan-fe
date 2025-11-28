import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Text from "../Text";
import { COLORS } from "../../constants/colors";

type RecentActivityCardProps = {
  title: string;
  description: string;
  date: string;
  onPress?: () => void;
};

export default function RecentActivityCard({
  title,
  description,
  date,
  onPress,
}: RecentActivityCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text variant="bold" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      <Text style={styles.date}>{date}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

