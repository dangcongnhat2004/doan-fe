import { Feather as Icon } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    ImageResultItem,
    extractStringValue,
    pollImageResult,
    uploadImage,
} from "../../api/imageService";
import BottomNavigation from "../../components/BottomNavigation";
import DashboardLayout from "../../components/DashboardLayout";
import Divider from "../../components/Divider";
import LoadingProgress from "../../components/LoadingProgress";
import PrimaryButton from "../../components/PrimaryButton";
import Text from "../../components/Text";
import UploadBox from "../../components/UploadBox";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { FileResult, pickFile, takePhoto } from "../../utils/filePicker";

type Props = NativeStackScreenProps<RootStackParamList, "Upload">;

export default function UploadScreen({ navigation }: Props) {
  const [selectedFile, setSelectedFile] = useState<FileResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Đang xử lý ảnh...");
  const pollingAbortRef = useRef<boolean>(false);

  const handleFileUpload = async () => {
    try {
      const file = await pickFile();
      if (file) {
        setSelectedFile(file);
        await processImageUpload(file);
      }
    } catch (error: any) {
      console.error("Error picking file:", error);
      Alert.alert("Lỗi", error.message || "Không thể chọn file. Vui lòng thử lại.");
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleCameraUpload = async () => {
    try {
      const photo = await takePhoto();
      if (photo) {
        setSelectedFile(photo);
        await processImageUpload(photo);
      }
    } catch (error: any) {
      console.error("Error taking photo:", error);
      Alert.alert("Lỗi", error.message || "Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const processImageUpload = async (file: FileResult, retryCount = 0) => {
    setIsUploading(true);
    setIsProcessing(true);
    setProcessingProgress(0);
    pollingAbortRef.current = false;

    try {
      // Step 1: Upload image (0% - 20%)
      if (retryCount > 0) {
        setProcessingMessage(`Đang thử lại lần ${retryCount + 1}...`);
      } else {
        setProcessingMessage("Đang tải ảnh lên server...");
      }
      setProcessingProgress(10);

      const uploadResponse = await uploadImage(
        file.uri,
        file.name,
        file.type,
        file.size
      );

      // Upload complete, move to processing phase
      setProcessingProgress(20);
      setProcessingMessage("Đang trong quá trình trích xuất câu hỏi...");

      // Step 2: Start polling for results (20% - 95%)
      const maxAttempts = 30;
      const pollingStartProgress = 20;
      const pollingEndProgress = 95;
      const progressRange = pollingEndProgress - pollingStartProgress;

      const result = await pollImageResult(
        uploadResponse.job_id,
        (attempt, maxAttempts) => {
          if (!pollingAbortRef.current) {
            // Calculate progress: 20% + (attempt/maxAttempts) * 75%
            const pollingProgress = (attempt / maxAttempts) * progressRange;
            const totalProgress = pollingStartProgress + pollingProgress;
            setProcessingProgress(Math.min(totalProgress, pollingEndProgress));
            setProcessingMessage("Đang trong quá trình trích xuất câu hỏi...");
          }
        },
        maxAttempts,
        2000 // 2 seconds interval
      );

      // Step 3: Processing complete (95% - 100%)
      setProcessingProgress(95);
      setProcessingMessage("Đang hoàn tất...");

      // Small delay to show 95%
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 300);
      });

      setProcessingProgress(100);
      setProcessingMessage("Hoàn thành!");

      // Wait a bit to show 100%
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });

      // Step 4: Navigate to ReviewQuestions with extracted data
      const questions = result.data.items.map(
        (item: ImageResultItem, index: number) => {
          // Extract string values from nullable fields (handle {NULL: true} format)
          const topicValue = extractStringValue(item.topic);
          const difficultyValue = extractStringValue(item.difficulty);
          
          return {
            id: `extracted_${result.data.job_id}_${index}`,
            questionText: item.question_text,
            questionImage: undefined, // Can add image URL if available
            topic: topicValue,
            difficulty:
              difficultyValue === "easy"
                ? "Dễ"
                : difficultyValue === "medium"
                ? "Trung bình"
                : difficultyValue === "hard"
                ? "Khó"
                : "",
            status: "under_review" as const,
            order: index + 1,
            choices: item.options.map((opt, optIndex) => ({
              id: `opt_${index}_${optIndex}`,
              label: opt.label,
              text: opt.text,
              isCorrect: opt.is_correct,
            })),
          };
        }
      );

      setIsProcessing(false);
      setIsUploading(false);
      setSelectedFile(null);

      navigation.navigate("ReviewQuestions", {
        questions: questions,
      });
    } catch (error: any) {
      // Provide more specific error messages
      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại.";

      if (error.message) {
        errorMessage = error.message;

        // Auto-retry for 503 errors (server overloaded) - check both message and status
        const is503Error =
          error.status === 503 ||
          error.message.includes("quá tải") ||
          error.message.includes("503") ||
          error.message.toLowerCase().includes("process");

        // Auto-retry for 500 errors (internal server error) - sometimes temporary
        const is500Error =
          error.status === 500 ||
          error.message.includes("Lỗi server nội bộ") ||
          error.message.includes("500");

        if (is503Error && retryCount < 2) {
          // Wait 3 seconds before retry
          const waitSeconds = 3;
          console.log(
            `[RETRY] 503 error detected. Retry attempt ${
              retryCount + 1
            }/2. Waiting ${waitSeconds} seconds...`
          );
          setProcessingMessage(
            `Server đang quá tải. Đang thử lại sau ${waitSeconds} giây...`
          );
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), waitSeconds * 1000);
          });
          console.log(`[RETRY] Starting retry attempt ${retryCount + 1}...`);
          // Don't reset state, just retry
          return processImageUpload(file, retryCount + 1);
        } else if (is500Error && retryCount < 2) {
          // Retry 500 errors up to 2 times (might be temporary server issues)
          const waitSeconds = 3;
          console.log(
            `[RETRY] 500 error detected. Retry attempt ${
              retryCount + 1
            }/2. Waiting ${waitSeconds} seconds...`
          );
          setProcessingMessage(
            `Lỗi server. Đang thử lại sau ${waitSeconds} giây...`
          );
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), waitSeconds * 1000);
          });
          console.log(
            `[RETRY] Starting retry attempt ${retryCount + 1} for 500 error...`
          );
          // Don't reset state, just retry
          return processImageUpload(file, retryCount + 1);
        }
      } else if (error.response) {
        errorMessage =
          error.response.message || "Server trả về lỗi. Vui lòng thử lại.";
      } else if (error.name === "TypeError" || error.message?.includes("Network")) {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      }

      // Only reset state and show error if not retrying
      setIsUploading(false);
      setIsProcessing(false);
      setProcessingProgress(0);

      console.error("Image upload error (final):", error);
      Alert.alert("Lỗi", errorMessage);
    }
  };

  const handleCancelProcessing = () => {
    pollingAbortRef.current = true;
    setIsUploading(false);
    setIsProcessing(false);
    setSelectedFile(null);
  };

  const handleDirectAdd = () => {
    // Navigate to ReviewQuestions with empty question to add manually
    navigation.navigate("ReviewQuestions", {
      questions: [
        {
          id: `q_${Date.now()}`,
          questionText: "",
          choices: [
            {
              id: `c_${Date.now()}_1`,
              label: "A",
              text: "",
              isCorrect: true,
            },
            {
              id: `c_${Date.now()}_2`,
              label: "B",
              text: "",
              isCorrect: false,
            },
          ],
          topic: "",
        },
      ],
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleImport = () => {
    // TODO: Implement import to warehouse
    console.log("Import to warehouse");
  };

  // Content component
  const renderContent = () => (
    <>
      {/* Page Title and Description (Web only) */}
      {Platform.OS === "web" && (
        <View style={styles.webPageHeader}>
          <Text variant="bold" style={styles.webPageTitle}>
            Tải lên Câu hỏi
          </Text>
          <Text style={styles.webPageSubtitle}>
            Chọn phương thức nhập liệu phù hợp với tài liệu của bạn
          </Text>
        </View>
      )}

      {/* Section Title */}
      <Text variant="bold" style={styles.sectionTitle}>
        {Platform.OS === "web" ? "CHỌN FILE ĐỂ TRÍCH XUẤT" : "Chọn file để trích xuất"}
      </Text>

      {/* Upload Boxes */}
      <View style={styles.uploadBoxesContainer}>
        <UploadBox
          icon="upload"
          title="Chọn ảnh từ thư viện"
          subtitle={Platform.OS === "web" ? "Hỗ trợ JPG, PNG, PDF" : undefined}
          onPress={handleFileUpload}
          disabled={isUploading || isProcessing}
        />
        <View style={styles.spacer} />
        <UploadBox
          icon="camera"
          title={Platform.OS === "web" ? "Chụp ảnh trực tiếp" : "Chụp ảnh trực tiếp từ camera"}
          subtitle={Platform.OS === "web" ? "Sử dụng Camera thiết bị" : undefined}
          onPress={handleCameraUpload}
          disabled={isUploading || isProcessing}
        />
      </View>

      {/* Divider */}
      <Divider />

      {/* Direct Add Button */}
      {Platform.OS === "web" ? (
        <TouchableOpacity
          style={[styles.webDirectAddButton, (isUploading || isProcessing) && styles.webDirectAddButtonDisabled]}
          onPress={handleDirectAdd}
          disabled={isUploading || isProcessing}
        >
          <Icon name="plus" size={20} color={COLORS.white} style={styles.webDirectAddIcon} />
          <Text style={styles.webDirectAddText}>Thêm câu hỏi thủ công (Nhập text)</Text>
        </TouchableOpacity>
      ) : (
        <PrimaryButton
          title="Thêm câu hỏi trực tiếp"
          onPress={handleDirectAdd}
          disabled={isUploading || isProcessing}
        />
      )}
    </>
  );

  // Loading Modal (shared for both web and mobile)
  const loadingModal = (
    <Modal
      visible={isUploading || isProcessing}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelProcessing}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LoadingProgress
            message={processingMessage}
            progress={processingProgress}
            showProgress={true}
          />
          <TouchableOpacity
            style={styles.cancelProcessingButton}
            onPress={handleCancelProcessing}
            disabled={processingProgress >= 95}
          >
            <Text
              style={[
                styles.cancelProcessingText,
                processingProgress >= 95 && styles.cancelProcessingTextDisabled,
              ]}
            >
              {processingProgress >= 95 ? "Đang hoàn tất..." : "Hủy"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Web Layout
  if (Platform.OS === "web") {
    return (
      <>
        <DashboardLayout title="Tải lên Câu hỏi" showSearch={false}>
          <View style={styles.card}>
            {renderContent()}

            {/* Card Footer Buttons (inside the card) */}
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterRow}>
                <TouchableOpacity style={styles.webCancelButton} onPress={handleCancel}>
                  <Icon name="trash-2" size={18} color={COLORS.gray} style={styles.webCancelButtonIcon} />
                  <Text style={styles.webCancelButtonText}>Hủy bỏ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.webImportButton} onPress={handleImport}>
                  <Icon name="archive" size={18} color={COLORS.white} style={styles.webImportButtonIcon} />
                  <Text style={styles.webImportButtonText}>Nhập kho & Lưu trữ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </DashboardLayout>
        {loadingModal}
      </>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text variant="bold" style={styles.headerTitle}>
            Tải lên Câu hỏi
          </Text>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-2" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </ScrollView>

      {loadingModal}

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
          <Text style={styles.importButtonText}>Nhập kho</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation currentTab={"Upload"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.black,
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  webPageHeader: {
    marginBottom: 32,
    ...(Platform.OS === "web" ? ({ marginTop: 0 } as any) : {}),
  },
  webPageTitle: {
    fontSize: 28,
    color: COLORS.black,
    marginBottom: 8,
    fontWeight: "700",
    ...(Platform.OS === "web" ? ({ lineHeight: 36 } as any) : {}),
  },
  webPageSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 22,
    ...(Platform.OS === "web" ? ({ marginTop: 4 } as any) : {}),
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 20,
    ...(Platform.OS === "web" ? ({
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 24,
    } as any) : {}),
  },
  uploadBoxesContainer: {
    flexDirection: "row",
    marginBottom: 24,
    ...(Platform.OS === "web" ? ({ gap: 20, marginBottom: 32 } as any) : {}),
  },
  spacer: {
    width: Platform.OS === "web" ? 16 : 12,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "600",
  },
  importButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  importButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  cancelProcessingButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  cancelProcessingText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "600",
  },
  cancelProcessingTextDisabled: {
    color: COLORS.gray,
    opacity: 0.6,
  },
  /* Web card styles */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: Platform.OS === "web" ? 32 : 24,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    ...(Platform.OS === "web"
      ? ({
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        maxWidth: 900,
        width: "100%",
        alignSelf: "center",
        marginHorizontal: "auto",
      } as any)
      : {}),
    marginBottom: 24,
  },
  cardFooter: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    ...(Platform.OS === "web" ? ({ marginTop: 40 } as any) : {}),
  },
  cardFooterRow: {
    flexDirection: "row",
    gap: 12,
  },
  webDirectAddButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    ...(Platform.OS === "web" ? ({
      width: "100%",
      cursor: "pointer",
      paddingVertical: 16,
    } as any) : {}),
  },
  webDirectAddButtonDisabled: {
    opacity: 0.6,
    ...(Platform.OS === "web" ? ({ cursor: "not-allowed" } as any) : {}),
  },
  webDirectAddIcon: {
    marginRight: 0,
  },
  webDirectAddText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: "600",
  },
  webCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    flexDirection: "row",
    gap: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  webCancelButtonIcon: {
    marginRight: 0,
  },
  webCancelButtonText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "600",
  },
  webImportButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  webImportButtonIcon: {
    marginRight: 0,
  },
  webImportButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: "600",
  },
});
