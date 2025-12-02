import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import HomeScreen from "../screens/Home";
import RegisterScreen from "../screens/Register";
import LoginScreen from "../screens/Login";
import UploadScreen from "../screens/Upload";
import ReviewQuestionsScreen from "../screens/ReviewQuestions";
import ImportQuestionsScreen from "../screens/ImportQuestions";
import QuestionManagementScreen from "../screens/QuestionManagement";
import QuestionSetDetailScreen from "../screens/QuestionSetDetail";
import { RootStackParamList } from "./types";
import ExamMainPage from "../screens/ExamManagement/Mainpage";
import ExamDoingPage from "../screens/ExamManagement/QuizScreen";
import ReviewExamScreen from "../screens/ExamManagement/ReviewChoices";
import SearchScreen from "../screens/Search";
import LearningToolsScreen from "../screens/LearningTools";
import FlashcardDetailScreen from "../screens/FlashcardDetail";
import FlashcardSessionScreen from "../screens/FlashcardSession";
import { storage } from "../utils/storage";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, user] = await Promise.all([
          storage.getToken(),
          storage.getUser(),
        ]);
        if (token && user?.id) {
          setInitialRoute("Home");
        } else {
          setInitialRoute("Login");
        }
      } catch {
        setInitialRoute("Login");
      }
    };

    checkAuth();
  }, []);

  if (!initialRoute) {
    // Simple splash: tránh nhấp nháy màn Login khi đang check
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ExamMainPage"
          component={ExamMainPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ExamDoingPage"
          component={ExamDoingPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReviewExam"
          component={ReviewExamScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Upload"
          component={UploadScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReviewQuestions"
          component={ReviewQuestionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ImportQuestions"
          component={ImportQuestionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="QuestionManagement"
          component={QuestionManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="QuestionSetDetail"
          component={QuestionSetDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LearningTools"
          component={LearningToolsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FlashcardDetail"
          component={FlashcardDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FlashcardSession"
          component={FlashcardSessionScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
