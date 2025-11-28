import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "../Text";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";

type TabItem = {
  name: string;
  icon: string;
  label: string;
};

type BottomNavigationProps = {
  currentTab?: string;
  tabs?: TabItem[];
  activeTab?: string;
  onTabPress?: (tabName: string) => void;
};

const DEFAULT_TABS: TabItem[] = [
  { name: "Dashboard", icon: "home", label: "Dashboard" },
  { name: "Upload", icon: "upload", label: "Tải lên" },
  { name: "Search", icon: "search", label: "Tìm kiếm" },
  { name: "ExamMainPage", icon: "file-text", label: "Đề thi" },
  { name: "Study", icon: "book-open", label: "Học tập" },
];

export default function BottomNavigation({
  currentTab,
  tabs,
  activeTab,
  onTabPress,
}: BottomNavigationProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const availableTabs = useMemo(() => tabs ?? DEFAULT_TABS, [tabs]);
  const [internalTab, setInternalTab] = useState(
    currentTab ?? availableTabs[0]?.name ?? "Dashboard"
  );

  useEffect(() => {
    if (currentTab) {
      setInternalTab(currentTab);
    }
  }, [currentTab]);

  const resolvedActiveTab = activeTab ?? internalTab;

  const handleDefaultNavigation = (tabName: string) => {
    switch (tabName) {
      case "Dashboard":
        navigation.navigate("Home");
        break;
      case "Upload":
        navigation.navigate("Upload");
        break;
      case "ExamMainPage":
        navigation.navigate("ExamMainPage");
        break;
      case "Search":
        navigation.navigate("Search");
        break;
      case "Study":
        Alert.alert(
          "Sắp có",
          "Mục này sẽ được cập nhật trong phiên bản tới."
        );
        break;
      default:
        break;
    }
  };

  const handleHomeTabPress = (tabName: string) => {
    if (!activeTab) {
      setInternalTab(tabName);
    }

    if (onTabPress) {
      onTabPress(tabName);
    } else {
      handleDefaultNavigation(tabName);
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webBrand}>Question Hub</Text>
        <View style={styles.webNav}>
          {availableTabs.map((tab) => {
            const isActive = resolvedActiveTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.webTab}
                onPress={() => handleHomeTabPress(tab.name)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.webLabel,
                    isActive && styles.webLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.webIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.webProfile}>
          <Text style={styles.webProfileText}>NA</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8) + 4,
        },
      ]}
    >
      {availableTabs.map((tab) => {
        const isActive = resolvedActiveTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleHomeTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={isActive ? COLORS.primary : COLORS.gray}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? COLORS.primary : COLORS.gray },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 8,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
  webContainer: {
    width: "100%",
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  },
  webBrand: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  webNav: {
    flexDirection: "row",
    gap: 32,
  },
  webTab: {
    alignItems: "center",
  },
  webLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
  },
  webLabelActive: {
    color: COLORS.primary,
  },
  webIndicator: {
    marginTop: 6,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  webProfile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  webProfileText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
