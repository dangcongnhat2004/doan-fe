import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Text from "../Text";
import { COLORS } from "../../constants/colors";

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  onPress?: () => void;
};

export default function FeatureCard({
  icon,
  title,
  description,
  onPress,
}: FeatureCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={24} color={COLORS.white} />
      </View>
      <Text variant="bold" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 16,
  },
});

