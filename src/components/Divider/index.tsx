import React from "react";
import { View } from "react-native";
import Text from "../Text";
import { styles } from "./styles";

export default function Divider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>Hoặc</Text>
      <View style={styles.line} />
    </View>
  );
}
