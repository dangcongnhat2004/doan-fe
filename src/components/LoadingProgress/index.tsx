import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

type Props = {
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
};

export default function LoadingProgress({
  message = "Đang xử lý...",
  progress = 0,
  showProgress = false,
}: Props) {
  const progressPercent = Math.round(progress);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.message}>{message}</Text>
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{progressPercent}%</Text>
            <Text style={styles.progressLabel}>Đang xử lý...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: 16,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.black,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginTop: 20,
  },
  progressBar: {
    width: "100%",
    height: 10,
    backgroundColor: "#E5E5E5",
    borderRadius: 5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    minWidth: 2,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

