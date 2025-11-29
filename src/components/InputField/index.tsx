import React from "react";
import { View, TextInputProps, Platform } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import TextInput from "../TextInput";
import { styles } from "./styles";

type Props = TextInputProps & {
  icon: string;
};

export default function InputField({ icon, ...rest }: Props) {
  const iconSize = Platform.OS === "web" ? 16 : 18;
  
  return (
    <View style={styles.inputWrapper}>
      <Icon name={icon} size={iconSize} color="#666" style={styles.inputIcon} />
      <TextInput style={styles.input} {...rest} />
    </View>
  );
}
