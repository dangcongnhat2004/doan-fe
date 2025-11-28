import React from "react";
import { View, Text } from "react-native";
import { styles } from "./styles";

type Props = {
  message: string | null;
};

export default function SuccessMessage({ message }: Props) {
  if (!message) return null; // Không render gì nếu không có message

  return (
    <View style={styles.successBox}>
      <Text style={styles.successTitle}>Thành công</Text>
      <Text style={styles.successDesc}>{message}</Text>
    </View>
  );
}

