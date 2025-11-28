import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { Images } from "../../assets/images";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import Divider from "../../components/Divider";
import ErrorMessage from "../../components/ErrorMessage";

import { register } from "../../api/authService";

import { styles } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    // Reset error
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password: password,
      });

      // Success - Navigate to Login with success message
      navigation.navigate("Login", {
        successMessage: "Đăng ký tài khoản thành công!",
      });
    } catch (err: any) {
      // Handle error
      const errorMessage = err.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={Images.logo} style={styles.logo} />
      <Text style={styles.appName}>Question Hub</Text>
      <Text style={styles.title}>Tạo tài khoản mới</Text>

      <ErrorMessage message={error} />

      <InputField
        icon="user"
        placeholder="Họ và tên"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <InputField
        icon="mail"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <InputField
        icon="lock"
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      <InputField
        icon="lock"
        placeholder="Xác nhận mật khẩu"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!loading}
      />

      <PrimaryButton
        title={loading ? "Đang đăng ký..." : "Đăng ký"}
        onPress={handleRegister}
        disabled={loading}
      />

      <Divider />

      {/* Google Login */}
      <TouchableOpacity style={styles.socialButton}>
      <Image source={Images.google} style={styles.socialLogo} />

        <Text style={styles.socialText}>Đăng ký với Google</Text>
      </TouchableOpacity>

      {/* Facebook Login */}
      <TouchableOpacity style={[styles.socialButton, styles.fbButton]}>
      <Image source={Images.facebook} style={styles.socialLogo} />

        <Text style={styles.socialTextFB}>Đăng ký với Facebook</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Đã có tài khoản?
        <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
          {" "}Đăng nhập
        </Text>
      </Text>
    </View>
  );
}
