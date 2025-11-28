import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { Images } from "../../assets/images";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import ErrorMessage from "../../components/ErrorMessage";
import SuccessMessage from "../../components/SuccessMessage";
import Divider from "../../components/Divider";

import { login } from "../../api/authService";
import { storage } from "../../utils/storage";

import { styles } from "./styles";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hiển thị thông báo thành công khi chuyển từ Register
  useEffect(() => {
    if (route.params?.successMessage) {
      setSuccessMessage(route.params.successMessage);
      // Clear params để không hiển thị lại khi quay lại màn hình
      navigation.setParams({ successMessage: undefined });
      // Tự động ẩn thông báo sau 5 giây
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    // Always return a cleanup function (even if it's a no-op)
    return () => {};
  }, [route.params?.successMessage, navigation]);

  const handleLogin = async () => {
    // Reset error
    setErrorMessage(null);

    // Validation
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Email không hợp lệ");
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password: password,
      });

      // Save token and user data
      await storage.setToken(response.token);
      await storage.setUser(response.user);

      // Navigate to Home screen
      navigation.navigate("Home");
    } catch (err: any) {
      // Handle error
      const errorMessage = err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/564/564445.png" }}
        style={styles.logo}
      />

      <Text style={styles.appName}>Question Hub</Text>
      <Text style={styles.title}>Chào mừng trở lại!</Text>

      <SuccessMessage message={successMessage} />
      <ErrorMessage message={errorMessage} />

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

      {/* ✅ Text Quên mật khẩu */}
      <Text style={styles.forgotText}>Quên mật khẩu?</Text>

      <PrimaryButton
        title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
        onPress={handleLogin}
        disabled={loading}
      />

      <Divider />

      {/* Google Login */}
      <TouchableOpacity style={styles.socialButton}>
      <Image source={Images.google} style={styles.socialLogo} />
        <Text style={styles.socialText}>Đăng nhập với Google</Text>
      </TouchableOpacity>

      {/* Facebook Login */}
      <TouchableOpacity style={[styles.socialButton, styles.fbButton]}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/733/733547.png" }}
          style={styles.socialLogo}
        />
        <Text style={styles.socialTextFB}>Đăng nhập với Facebook</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Chưa có tài khoản?
        <Text style={styles.registerLink} onPress={() => navigation.navigate("Register")}>
          {" "}Đăng ký
        </Text>
      </Text>
    </View>
  );
}
