import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
