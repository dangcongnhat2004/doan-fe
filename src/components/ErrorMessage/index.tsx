import React from "react";
import { View, Text } from "react-native";
import { styles } from "./styles";

type Props = {
  message: string | null;
};

export default function ErrorMessage({ message }: Props) {
  if (!message) return null; // Không render gì nếu không có lỗi

  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorTitle}>Thông tin đăng nhập không hợp lệ</Text>
      <Text style={styles.errorDesc}>{message}</Text>
    </View>
  );
}
