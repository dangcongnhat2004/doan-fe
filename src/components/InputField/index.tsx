import React from "react";
import { View, TextInputProps } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import TextInput from "../TextInput";
import { styles } from "./styles";

type Props = TextInputProps & {
  icon: string;
};

export default function InputField({ icon, ...rest }: Props) {
  return (
    <View style={styles.inputWrapper}>
      <Icon name={icon} size={18} color="#666" style={styles.inputIcon} />
      <TextInput style={styles.input} {...rest} />
    </View>
  );
}
