import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";

type Props = {
  title: string;
  functionIcon: string; 
  function: () => void;
};

export default function ScreenHeader({
  title,
  functionIcon,
  function: onPress,
}: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, 12);

  return (
    <View style={[styles.container, { paddingTop }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.iconContainer}
      >
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onPress} style={styles.iconContainer}>
        <Icon name={functionIcon} size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}