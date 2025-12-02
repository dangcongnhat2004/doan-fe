import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Circle, Line, Path, Rect, Svg } from "react-native-svg";
import Icon from "react-native-vector-icons/Feather";
import { getQuestionSets, QuestionSet } from "../../api/questionService";
import DashboardLayout from "../../components/DashboardLayout";
import Text from "../../components/Text";
import { COLORS } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { storage } from "../../utils/storage";

type TabType = "flashcard" | "whiteboard" | "results";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";
const IS_MOBILE = !IS_WEB || SCREEN_WIDTH < 768;

export default function LearningToolsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("flashcard");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardResults, setFlashcardResults] = useState<Array<{
    setId: string;
    title: string;
    rememberedCount: number;
    notRememberedCount: number;
    totalCount: number;
    updatedAt: string;
  }>>([]);
  const [whiteboardPaths, setWhiteboardPaths] = useState<Array<{ d: string; stroke: string; strokeWidth: number; opacity?: number }>>([]);
  const [currentWhiteboardPath, setCurrentWhiteboardPath] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<
    "pen" | "brush" | "highlighter" | "shape" | "eraser" | "lasso"
  >("pen");
  const [lassoPath, setLassoPath] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [whiteboardGrid, setWhiteboardGrid] = useState<"plain" | "dot" | "line" | "grid">("plain");
  const [whiteboardBgColor, setWhiteboardBgColor] = useState("#FFFFFF");
  const [whiteboardId] = useState(() => `whiteboard_${Date.now()}`);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [whiteboardTitle, setWhiteboardTitle] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showStrokeOptions, setShowStrokeOptions] = useState(false);
  const [strokeOptionsTool, setStrokeOptionsTool] = useState<"pen" | "brush" | "highlighter">(
    "pen"
  );
  const [shapeType, setShapeType] = useState<"line" | "rect" | "circle">("line");
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [selectedPathIndices, setSelectedPathIndices] = useState<number[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);

  const loadQuestionSets = useCallback(async () => {
    try {
      setError(null);
      const user = await storage.getUser();
      if (!user || !user.id) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const response = await getQuestionSets(user.id);
      setQuestionSets(response.sets || []);
    } catch (err: any) {
      console.error("Error loading question sets:", err);
      setError(err.message || "Không thể tải danh sách bộ câu hỏi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadFlashcardResults = useCallback(async () => {
    try {
      const allProgress = await storage.getAllFlashcardProgress();
      const results = allProgress.map((progress) => {
        // Find the question set to get title and total count
        const set = questionSets.find((s) => s.set_id === progress.setId);
        return {
          setId: progress.setId,
          title: set?.title || "Bộ câu hỏi",
          rememberedCount: progress.rememberedCards.length,
          notRememberedCount: progress.notRememberedCards.length,
          totalCount: progress.rememberedCards.length + progress.notRememberedCards.length,
          updatedAt: progress.updatedAt,
        };
      });
      setFlashcardResults(results);
    } catch (err) {
      console.error("Error loading flashcard results:", err);
    }
  }, [questionSets]);

  useEffect(() => {
    loadQuestionSets();
  }, [loadQuestionSets]);

  useFocusEffect(
    useCallback(() => {
      if (questionSets.length > 0) {
        loadFlashcardResults();
      }
    }, [questionSets, loadFlashcardResults])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestionSets();
  };

  const handleSetPress = (set: QuestionSet) => {
    navigation.navigate("FlashcardDetail", {
      userId: set.creator.user_id,
      setId: set.set_id,
    });
  };

  const renderSetCard = ({ item }: { item: QuestionSet }) => {
    // Extract chapter/subject from title or description
    const titleParts = item.title.split(" - ");
    const chapter = titleParts[0] || "Chương 1";
    const subject = titleParts[1] || item.description?.split(" ")[0] || "Toán Cao cấp";
    const result = flashcardResults.find((r) => r.setId === item.set_id);

    return (
      <TouchableOpacity
        style={styles.setCard}
        onPress={() => handleSetPress(item)}
        activeOpacity={0.7}
      >
        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Icon name="layers" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardChapter}>{chapter}</Text>
              <Text style={styles.cardSubject}>{subject}</Text>
            </View>
          </View>
          
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Icon name="file-text" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>{item.question_count} câu</Text>
            </View>
            {result && result.totalCount > 0 && (
              <View style={styles.statItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={[styles.statText, styles.statSuccess]}>
                  {result.rememberedCount}/{result.totalCount} đã nhớ
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.learnButton}
            onPress={() => handleSetPress(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.learnButtonText}>Học</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleWhiteboardTouchStart = (event: any) => {
    // Start drawing or lasso selection
    setSelectedPathIndices([]);
    if (whiteboardTool !== "lasso") {
      setLassoPath(null);
    }
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
    const locationX = touch.locationX || touch.pageX;
    const locationY = touch.locationY || touch.pageY;
    setIsDrawing(true);
    setCurrentWhiteboardPath(`M${locationX},${locationY}`);
  };

  const handleWhiteboardTouchMove = (event: any) => {
    if (!isDrawing) return;
    const now = Date.now();
    // Throttle updates to 60fps (~16ms per frame)
    if (now - lastUpdateTimeRef.current < 16) return;
    lastUpdateTimeRef.current = now;
    
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
    const locationX = Math.round(touch.locationX || touch.pageX);
    const locationY = Math.round(touch.locationY || touch.pageY);
    setCurrentWhiteboardPath((prev) => `${prev} L${locationX},${locationY}`);
  };

  const handleWhiteboardTouchEnd = () => {
    // Lasso tool: chỉ vẽ đường chọn, chưa tác động tới paths
    if (whiteboardTool === "lasso") {
      if (currentWhiteboardPath && isDrawing) {
        setLassoPath(currentWhiteboardPath);

        // Tính vùng chọn từ đường lasso (dạng polyline) và chọn các path nằm trong vùng đó
        try {
          const coordsText = currentWhiteboardPath
            .replace(/^M/, "")
            .split("L")
            .map((p) => p.trim())
            .filter(Boolean);

          if (coordsText.length >= 2) {
            const xs: number[] = [];
            const ys: number[] = [];
            coordsText.forEach((pt) => {
              const [xStr, yStr] = pt.split(",");
              const x = Number(xStr);
              const y = Number(yStr);
              if (!Number.isNaN(x) && !Number.isNaN(y)) {
                xs.push(x);
                ys.push(y);
              }
            });
            if (xs.length > 0 && ys.length > 0) {
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              const newlySelected: number[] = [];
              whiteboardPaths.forEach((path, index) => {
                const pathCoords = path.d
                  .replace(/^M/, "")
                  .split("L")
                  .map((p) => p.trim())
                  .filter(Boolean);
                const pathXs: number[] = [];
                const pathYs: number[] = [];
                pathCoords.forEach((pt) => {
                  const [xStr, yStr] = pt.split(",");
                  const x = Number(xStr);
                  const y = Number(yStr);
                  if (!Number.isNaN(x) && !Number.isNaN(y)) {
                    pathXs.push(x);
                    pathYs.push(y);
                  }
                });
                if (pathXs.length === 0 || pathYs.length === 0) return;
                const pMinX = Math.min(...pathXs);
                const pMaxX = Math.max(...pathXs);
                const pMinY = Math.min(...pathYs);
                const pMaxY = Math.max(...pathYs);

                const intersect =
                  !(pMaxX < minX || pMinX > maxX || pMaxY < minY || pMinY > maxY);
                if (intersect) {
                  newlySelected.push(index);
                }
              });

              setSelectedPathIndices(newlySelected);
            }
          }
        } catch {
          // ignore parse errors
        }

        setCurrentWhiteboardPath("");
      }
      setIsDrawing(false);
      return;
    }

    if (currentWhiteboardPath && isDrawing) {
      let finalPath = currentWhiteboardPath;

      // Shape tool: tự động làm thẳng đường (lấy điểm đầu & cuối)
      if (whiteboardTool === "shape") {
        try {
          const coordsText = currentWhiteboardPath
            .replace(/^M/, "")
            .split("L")
            .map((p) => p.trim())
            .filter(Boolean);
          if (coordsText.length >= 2) {
            const xs: number[] = [];
            const ys: number[] = [];
            coordsText.forEach((pt) => {
              const [xStr, yStr] = pt.split(",");
              const x = Number(xStr);
              const y = Number(yStr);
              if (!Number.isNaN(x) && !Number.isNaN(y)) {
                xs.push(x);
                ys.push(y);
              }
            });
            if (xs.length > 0 && ys.length > 0) {
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              if (shapeType === "line") {
                const startX = xs[0];
                const startY = ys[0];
                const endX = xs[xs.length - 1];
                const endY = ys[ys.length - 1];
                finalPath = `M${startX},${startY} L${endX},${endY}`;
              } else if (shapeType === "rect") {
                finalPath = `M${minX},${minY} L${maxX},${minY} L${maxX},${maxY} L${minX},${maxY} Z`;
              } else if (shapeType === "circle") {
                const cx = (minX + maxX) / 2;
                const cy = (minY + maxY) / 2;
                const rx = (maxX - minX) / 2;
                const ry = (maxY - minY) / 2;
                const r = Math.max(rx, ry);
                // Approximate circle using two arcs
                finalPath = `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy}`;
              }
            }
          }
        } catch {
          // fallback: dùng path gốc nếu parse lỗi
          finalPath = currentWhiteboardPath;
        }
      }

      // Thiết lập style theo tool
      let stroke = strokeColor;
      let width = strokeWidth;
      let opacity = 1;

      if (whiteboardTool === "brush") {
        width = strokeWidth * 2;
        opacity = 0.6;
      } else if (whiteboardTool === "highlighter") {
        // Highlighter: dùng màu đã chọn nhưng nét dày và trong suốt hơn
        width = strokeWidth * 2.4;
        opacity = 0.35;
      } else if (whiteboardTool === "eraser") {
        stroke = whiteboardBgColor;
        width = strokeWidth * 3;
        opacity = 1;
      }

      const newPath = {
        d: finalPath,
        stroke,
        strokeWidth: width,
        opacity,
      };
      const updatedPaths = [...whiteboardPaths, newPath];
      setWhiteboardPaths(updatedPaths);
      setCurrentWhiteboardPath("");
      
      // Auto-save after drawing
      saveWhiteboardAuto(updatedPaths);
    }
    setIsDrawing(false);
  };

  const saveWhiteboardAuto = async (paths?: Array<{ d: string; stroke: string; strokeWidth: number; opacity?: number }>) => {
    try {
      await storage.saveWhiteboard(whiteboardId, {
        paths: paths || whiteboardPaths,
        backgroundColor: whiteboardBgColor,
        gridType: whiteboardGrid,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error auto-saving whiteboard:", err);
    }
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const transformPathD = (d: string, dx: number, dy: number) => {
    try {
      const parts = d.split(" ");
      const resultParts: string[] = [];
      parts.forEach((part) => {
        if (part.startsWith("M") || part.startsWith("L")) {
          const cmd = part[0];
          const coords = part
            .slice(1)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          if (coords.length === 2) {
            const x = Number(coords[0]) + dx;
            const y = Number(coords[1]) + dy;
            resultParts.push(`${cmd}${x},${y}`);
          } else {
            resultParts.push(part);
          }
        } else if (part) {
          resultParts.push(part);
        }
      });
      return resultParts.join(" ");
    } catch {
      return d;
    }
  };

  const handleExportWhiteboard = async (format: "png" | "jpg" | "svg") => {
    if (!whiteboardPaths.length) {
      Alert.alert("Thông báo", "Chưa có nội dung để xuất.");
      return;
    }
    if (!IS_WEB) {
      Alert.alert("Thông báo", "Xuất file hiện chỉ hỗ trợ trên trình duyệt web.");
      return;
    }
    try {
      const canvasWidth = SCREEN_WIDTH;
      const canvasHeight = IS_WEB ? 600 : SCREEN_HEIGHT - 300;
      if (format === "svg") {
        const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="100%" height="100%" fill="${whiteboardBgColor}" />
  ${whiteboardPaths
    .map(
      (path) =>
        `<path d="${path.d}" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${path.opacity ?? 1}" />`
    )
    .join("\n")}
</svg>`;
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `whiteboard-${Date.now()}.svg`);
        URL.revokeObjectURL(url);
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Không thể khởi tạo canvas.");
        }
        ctx.fillStyle = whiteboardBgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        whiteboardPaths.forEach((path) => {
          const path2d = new Path2D(path.d);
          ctx.strokeStyle = path.stroke;
          ctx.lineWidth = path.strokeWidth;
          ctx.globalAlpha = path.opacity ?? 1;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke(path2d);
        });
        ctx.globalAlpha = 1;
        const mime = format === "png" ? "image/png" : "image/jpeg";
        const dataUrl =
          format === "png"
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", 0.92);
        triggerDownload(dataUrl, `whiteboard-${Date.now()}.${format}`);
      }
    } catch (err) {
      console.error("Error exporting whiteboard:", err);
      Alert.alert("Lỗi", "Không thể xuất file. Vui lòng thử lại.");
    } finally {
      setShowExportModal(false);
    }
  };

  const handleSaveWhiteboard = async () => {
    if (!whiteboardTitle.trim()) {
      setShowSaveModal(true);
      return;
    }
    try {
      await storage.saveWhiteboard(whiteboardId, {
        paths: whiteboardPaths,
        backgroundColor: whiteboardBgColor,
        gridType: whiteboardGrid,
        updatedAt: new Date().toISOString(),
      });
      setShowSaveModal(false);
      setWhiteboardTitle("");
      // Show success message (you can add a toast/alert here)
    } catch (err) {
      console.error("Error saving whiteboard:", err);
    }
  };

  const handleLoadWhiteboard = async () => {
    try {
      const saved = await storage.loadWhiteboard(whiteboardId);
      if (saved) {
        setWhiteboardPaths(saved.paths || []);
        setWhiteboardBgColor(saved.backgroundColor || "#FFFFFF");
        setWhiteboardGrid((saved.gridType as any) || "plain");
      }
    } catch (err) {
      console.error("Error loading whiteboard:", err);
    }
  };

  // Load whiteboard on mount
  useEffect(() => {
    if (activeTab === "whiteboard") {
      handleLoadWhiteboard();
    }
  }, [activeTab]);

  // (Optional) Nếu sau này bạn dùng expo-screen-orientation, có thể lock xoay màn hình tại đây.

  // Auto-save when paths, background color, or grid changes
  useEffect(() => {
    if (activeTab === "whiteboard" && whiteboardPaths.length > 0) {
      const timer = setTimeout(() => {
        saveWhiteboardAuto();
      }, 1000); // Debounce auto-save
      return () => clearTimeout(timer);
    }
  }, [whiteboardPaths, whiteboardBgColor, whiteboardGrid, activeTab]);

  const renderWhiteboardGrid = () => {
    if (whiteboardGrid === "plain") return null;
    const gridSize = 20;
    const gridLines: React.ReactNode[] = [];
    const canvasHeight = IS_WEB ? 600 : SCREEN_HEIGHT - 300;

    if (whiteboardGrid === "dot") {
      for (let x = 0; x < SCREEN_WIDTH; x += gridSize) {
        for (let y = 0; y < canvasHeight; y += gridSize) {
          gridLines.push(
            <Circle key={`dot-${x}-${y}`} cx={x} cy={y} r={1} fill="#CCCCCC" opacity={0.5} />
          );
        }
      }
    } else if (whiteboardGrid === "line" || whiteboardGrid === "grid") {
      for (let x = 0; x < SCREEN_WIDTH; x += gridSize) {
        gridLines.push(
          <Line key={`vline-${x}`} x1={x} y1={0} x2={x} y2={canvasHeight} stroke="#CCCCCC" strokeWidth={0.5} opacity={0.5} />
        );
      }
      for (let y = 0; y < canvasHeight; y += gridSize) {
        gridLines.push(
          <Line key={`hline-${y}`} x1={0} y1={y} x2={SCREEN_WIDTH} y2={y} stroke="#CCCCCC" strokeWidth={0.5} opacity={0.5} />
        );
      }
    }

    return gridLines;
  };

  const renderWhiteboard = () => {
    const canvasHeight = IS_WEB ? 600 : SCREEN_HEIGHT - 300;

    if (IS_WEB) {
      return (
        <View style={styles.whiteboardOuter}>
          <View style={styles.whiteboardCard}>
            {/* Whiteboard Toolbar - Web */}
            <View style={styles.whiteboardToolbar}>
          <TouchableOpacity
            style={[styles.whiteboardToolButton, whiteboardTool === "pen" && styles.whiteboardToolButtonActive]}
            onPress={() => {
              setWhiteboardTool("pen");
              setStrokeOptionsTool("pen");
              setShowStrokeOptions((prev) => !prev);
              setShowShapeMenu(false);
              setLassoPath(null);
              setSelectedPathIndices([]);
            }}
          >
            <Icon name="edit-3" size={20} color={whiteboardTool === "pen" ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.whiteboardToolButton, whiteboardTool === "brush" && styles.whiteboardToolButtonActive]}
            onPress={() => {
              setWhiteboardTool("brush");
              setStrokeOptionsTool("brush");
              setShowStrokeOptions((prev) => !prev);
              setShowShapeMenu(false);
              setLassoPath(null);
              setSelectedPathIndices([]);
            }}
          >
            <Icon name="edit" size={20} color={whiteboardTool === "brush" ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.whiteboardToolButton, whiteboardTool === "highlighter" && styles.whiteboardToolButtonActive]}
            onPress={() => {
              setWhiteboardTool("highlighter");
              setStrokeOptionsTool("highlighter");
              setShowStrokeOptions((prev) => !prev);
              setShowShapeMenu(false);
              setLassoPath(null);
              setSelectedPathIndices([]);
            }}
          >
            <Icon name="highlighter" size={20} color={whiteboardTool === "highlighter" ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.whiteboardToolButton, whiteboardTool === "shape" && styles.whiteboardToolButtonActive]}
            onPress={() => {
              setWhiteboardTool("shape");
              setShowShapeMenu((prev) => !prev);
              setShowStrokeOptions(false);
              setLassoPath(null);
              setSelectedPathIndices([]);
            }}
          >
            <Icon name="triangle" size={20} color={whiteboardTool === "shape" ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.whiteboardToolButton, whiteboardTool === "eraser" && styles.whiteboardToolButtonActive]}
            onPress={() => setWhiteboardTool("eraser")}
          >
            <Icon name="x" size={20} color={whiteboardTool === "eraser" ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.whiteboardToolButton, whiteboardTool === "lasso" && styles.whiteboardToolButtonActive]}
            onPress={() => {
              setWhiteboardTool("lasso");
              setShowStrokeOptions(false);
              setShowShapeMenu(false);
              setLassoPath(null);
              setSelectedPathIndices([]);
            }}
          >
            <Icon name="crop" size={20} color={whiteboardTool === "lasso" ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.whiteboardToolDivider} />
          <TouchableOpacity
            style={styles.whiteboardToolButton}
            onPress={() => setWhiteboardGrid(whiteboardGrid === "plain" ? "dot" : whiteboardGrid === "dot" ? "line" : whiteboardGrid === "line" ? "grid" : "plain")}
          >
            <Icon name="grid" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.whiteboardToolButton}
            activeOpacity={0.7}
            onPress={() => {
              const newColor = whiteboardBgColor === "#FFFFFF" ? "#FFF9C4" : whiteboardBgColor === "#FFF9C4" ? "#000000" : "#FFFFFF";
              setWhiteboardBgColor(newColor);
              saveWhiteboardAuto(whiteboardPaths);
            }}
          >
            <View style={[styles.colorPreview, { backgroundColor: whiteboardBgColor }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.whiteboardToolButton}
            onPress={() => {
              if (selectedPathIndices.length > 0) {
                // Xoá vùng đã chọn
                const remaining = whiteboardPaths.filter(
                  (_, index) => !selectedPathIndices.includes(index)
                );
                setWhiteboardPaths(remaining);
                setSelectedPathIndices([]);
                setLassoPath(null);
                saveWhiteboardAuto(remaining);
              } else {
                // Xoá toàn bộ
                setWhiteboardPaths([]);
                setCurrentWhiteboardPath("");
                setSelectedPathIndices([]);
                setLassoPath(null);
                saveWhiteboardAuto([]);
              }
            }}
          >
            <Icon name="trash-2" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          {selectedPathIndices.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.whiteboardToolButton}
                onPress={() => {
                  // Di chuyển vùng chọn xuống phải một đoạn nhỏ
                  const moved = whiteboardPaths.map((p, index) =>
                    selectedPathIndices.includes(index)
                      ? {
                          ...p,
                          d: transformPathD(p.d, 20, 20),
                        }
                      : p
                  );
                  setWhiteboardPaths(moved);
                  saveWhiteboardAuto(moved);
                }}
              >
                <Icon name="move" size={20} color={COLORS.gray} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.whiteboardToolButton}
                onPress={() => {
                  // Copy vùng chọn và dán lệch xuống phải
                  const copies = whiteboardPaths
                    .map((p, index) =>
                      selectedPathIndices.includes(index)
                        ? {
                            ...p,
                            d: transformPathD(p.d, 30, 30),
                          }
                        : null
                    )
                    .filter((p): p is typeof whiteboardPaths[0] => !!p);
                  const updated = [...whiteboardPaths, ...copies];
                  setWhiteboardPaths(updated);
                  saveWhiteboardAuto(updated);
                }}
              >
                <Icon name="copy" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </>
          )}
          </View>

          {/* Stroke Options */}
          {showStrokeOptions && (
            <View style={styles.strokeOptionsContainer}>
              <Text style={styles.strokeOptionsLabel}>Màu:</Text>
              <View style={styles.strokeColorsRow}>
                {["#000000", "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6"].map(
                  (color) => (
                    <TouchableOpacity
                      key={color}
                      activeOpacity={0.7}
                      style={[
                        styles.strokeColorDot,
                        { backgroundColor: color },
                        strokeColor === color && styles.strokeColorDotActive,
                      ]}
                      onPress={() => setStrokeColor(color)}
                    />
                  )
                )}
              </View>
              <Text style={[styles.strokeOptionsLabel, { marginTop: 8 }]}>Độ dày:</Text>
              <View style={styles.strokeWidthRow}>
                {[2, 4, 6, 8, 12].map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.strokeWidthButton,
                      strokeWidth === w && styles.strokeWidthButtonActive,
                    ]}
                    onPress={() => setStrokeWidth(w)}
                  >
                    <View
                      style={[
                        styles.strokeWidthPreview,
                        { height: w / 2 },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Shape Menu */}
          {showShapeMenu && (
            <View style={styles.shapeMenuContainer}>
              <TouchableOpacity
                style={[
                  styles.shapeMenuButton,
                  shapeType === "line" && styles.shapeMenuButtonActive,
                ]}
                onPress={() => setShapeType("line")}
              >
                <Icon name="minus" size={18} color={COLORS.gray} />
                <Text style={styles.shapeMenuText}>Line</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shapeMenuButton,
                  shapeType === "rect" && styles.shapeMenuButtonActive,
                ]}
                onPress={() => setShapeType("rect")}
              >
                <Icon name="square" size={18} color={COLORS.gray} />
                <Text style={styles.shapeMenuText}>Rectangle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shapeMenuButton,
                  shapeType === "circle" && styles.shapeMenuButtonActive,
                ]}
                onPress={() => setShapeType("circle")}
              >
                <Icon name="circle" size={18} color={COLORS.gray} />
                <Text style={styles.shapeMenuText}>Circle</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Canvas */}
          <View
            style={styles.whiteboardCanvasContainer}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleWhiteboardTouchStart}
            onResponderMove={handleWhiteboardTouchMove}
            onResponderRelease={handleWhiteboardTouchEnd}
          >
            <Svg width={SCREEN_WIDTH} height={canvasHeight} style={styles.whiteboardCanvas}>
              <Rect
                x={0}
                y={0}
                width={SCREEN_WIDTH}
                height={canvasHeight}
                fill={whiteboardBgColor}
              />
              {renderWhiteboardGrid()}
              {whiteboardPaths.map((path, index) => (
                <Path
                  key={index}
                  d={path.d}
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth}
                  fill="none"
                  opacity={path.opacity || 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentWhiteboardPath && (
                <Path
                  d={currentWhiteboardPath}
                  stroke={
                    whiteboardTool === "eraser"
                      ? whiteboardBgColor
                      : whiteboardTool === "highlighter"
                      ? "#FFD54F"
                      : strokeColor
                  }
                  strokeWidth={
                    whiteboardTool === "brush"
                      ? strokeWidth * 2
                      : whiteboardTool === "highlighter"
                      ? strokeWidth * 2.4
                      : whiteboardTool === "eraser"
                      ? strokeWidth * 3
                      : strokeWidth
                  }
                  fill="none"
                  opacity={whiteboardTool === "brush" ? 0.6 : whiteboardTool === "highlighter" ? 0.35 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {lassoPath && (
                <Path
                  d={lassoPath}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="6 4"
                />
              )}
            </Svg>
            </View>
          </View>
        </View>
      );
    }

    // Mobile version
    return (
      <View style={styles.whiteboardOuter}>
        <View style={styles.whiteboardCard}>
          <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.whiteboardToolbar}
          >
            <TouchableOpacity
              style={[
                styles.whiteboardToolButton,
                whiteboardTool === "pen" && styles.whiteboardToolButtonActive,
              ]}
              onPress={() => {
                setWhiteboardTool("pen");
                setStrokeOptionsTool("pen");
                setShowStrokeOptions((prev) => !prev);
                setShowShapeMenu(false);
                setLassoPath(null);
                setSelectedPathIndices([]);
              }}
            >
              <Icon
                name="edit-3"
                size={20}
                color={whiteboardTool === "pen" ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.whiteboardToolButton,
                whiteboardTool === "brush" && styles.whiteboardToolButtonActive,
              ]}
              onPress={() => {
                setWhiteboardTool("brush");
                setStrokeOptionsTool("brush");
                setShowStrokeOptions((prev) => !prev);
                setShowShapeMenu(false);
                setLassoPath(null);
                setSelectedPathIndices([]);
              }}
            >
              <Icon
                name="edit"
                size={20}
                color={whiteboardTool === "brush" ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.whiteboardToolButton,
                whiteboardTool === "highlighter" && styles.whiteboardToolButtonActive,
              ]}
              onPress={() => {
                setWhiteboardTool("highlighter");
                setStrokeOptionsTool("highlighter");
                setShowStrokeOptions((prev) => !prev);
                setShowShapeMenu(false);
                setLassoPath(null);
                setSelectedPathIndices([]);
              }}
            >
              <Icon
                name="highlighter"
                size={20}
                color={
                  whiteboardTool === "highlighter" ? COLORS.primary : COLORS.gray
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.whiteboardToolButton,
                whiteboardTool === "shape" && styles.whiteboardToolButtonActive,
              ]}
              onPress={() => {
                setWhiteboardTool("shape");
                setShowShapeMenu((prev) => !prev);
                setShowStrokeOptions(false);
                setLassoPath(null);
                setSelectedPathIndices([]);
              }}
            >
              <Icon
                name="triangle"
                size={20}
                color={whiteboardTool === "shape" ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.whiteboardToolButton,
                whiteboardTool === "eraser" && styles.whiteboardToolButtonActive,
              ]}
              onPress={() => setWhiteboardTool("eraser")}
            >
              <Icon
                name="x"
                size={20}
                color={whiteboardTool === "eraser" ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.whiteboardToolButton,
                whiteboardTool === "lasso" && styles.whiteboardToolButtonActive,
              ]}
              onPress={() => {
                setWhiteboardTool("lasso");
                setShowStrokeOptions(false);
                setShowShapeMenu(false);
                setLassoPath(null);
                setSelectedPathIndices([]);
              }}
            >
              <Icon
                name="crop"
                size={20}
                color={whiteboardTool === "lasso" ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
            <View style={styles.whiteboardToolDivider} />
            <TouchableOpacity
              style={styles.whiteboardToolButton}
              onPress={() =>
                setWhiteboardGrid(
                  whiteboardGrid === "plain"
                    ? "dot"
                    : whiteboardGrid === "dot"
                    ? "line"
                    : whiteboardGrid === "line"
                    ? "grid"
                    : "plain"
                )
              }
            >
              <Icon name="grid" size={20} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.whiteboardToolButton}
              activeOpacity={0.7}
              onPress={() => {
                const newColor = whiteboardBgColor === "#FFFFFF"
                  ? "#FFF9C4"
                  : whiteboardBgColor === "#FFF9C4"
                  ? "#000000"
                  : "#FFFFFF";
                setWhiteboardBgColor(newColor);
                saveWhiteboardAuto(whiteboardPaths);
              }}
            >
              <View
                style={[styles.colorPreview, { backgroundColor: whiteboardBgColor }]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.whiteboardToolButton}
              onPress={() => {
                if (selectedPathIndices.length > 0) {
                  const remaining = whiteboardPaths.filter(
                    (_, index) => !selectedPathIndices.includes(index)
                  );
                  setWhiteboardPaths(remaining);
                  setSelectedPathIndices([]);
                  setLassoPath(null);
                  saveWhiteboardAuto(remaining);
                } else {
                  setWhiteboardPaths([]);
                  setCurrentWhiteboardPath("");
                  setSelectedPathIndices([]);
                  setLassoPath(null);
                  saveWhiteboardAuto([]);
                }
              }}
            >
              <Icon name="trash-2" size={20} color={COLORS.gray} />
            </TouchableOpacity>

            {selectedPathIndices.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.whiteboardToolButton}
                  onPress={() => {
                    const moved = whiteboardPaths.map((p, index) =>
                      selectedPathIndices.includes(index)
                        ? {
                            ...p,
                            d: transformPathD(p.d, 20, 20),
                          }
                        : p
                    );
                    setWhiteboardPaths(moved);
                    saveWhiteboardAuto(moved);
                  }}
                >
                  <Icon name="move" size={20} color={COLORS.gray} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.whiteboardToolButton}
                  onPress={() => {
                    const copies = whiteboardPaths
                      .map((p, index) =>
                        selectedPathIndices.includes(index)
                          ? {
                              ...p,
                              d: transformPathD(p.d, 30, 30),
                            }
                          : null
                      )
                      .filter(
                        (p): p is typeof whiteboardPaths[0] => !!p
                      );
                    const updated = [...whiteboardPaths, ...copies];
                    setWhiteboardPaths(updated);
                    saveWhiteboardAuto(updated);
                  }}
                >
                  <Icon name="copy" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          {/* Stroke Options (mobile) */}
          {showStrokeOptions && (
            <View style={styles.strokeOptionsContainer}>
              <Text style={styles.strokeOptionsLabel}>Màu:</Text>
              <View style={styles.strokeColorsRow}>
                {["#000000", "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6"].map(
                  (color) => (
                    <TouchableOpacity
                      key={color}
                      activeOpacity={0.7}
                      style={[
                        styles.strokeColorDot,
                        { backgroundColor: color },
                        strokeColor === color && styles.strokeColorDotActive,
                      ]}
                      onPress={() => setStrokeColor(color)}
                    />
                  )
                )}
              </View>
              <Text style={[styles.strokeOptionsLabel, { marginTop: 8 }]}>Độ dày:</Text>
              <View style={styles.strokeWidthRow}>
                {[2, 4, 6, 8, 12].map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.strokeWidthButton,
                      strokeWidth === w && styles.strokeWidthButtonActive,
                    ]}
                    onPress={() => setStrokeWidth(w)}
                  >
                    <View
                      style={[
                        styles.strokeWidthPreview,
                        { height: w / 2 },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Shape Menu (mobile) */}
          {showShapeMenu && (
            <View style={styles.shapeMenuContainer}>
              <TouchableOpacity
                style={[
                  styles.shapeMenuButton,
                  shapeType === "line" && styles.shapeMenuButtonActive,
                ]}
                onPress={() => setShapeType("line")}
              >
                <Icon name="minus" size={18} color={COLORS.gray} />
                <Text style={styles.shapeMenuText}>Line</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shapeMenuButton,
                  shapeType === "rect" && styles.shapeMenuButtonActive,
                ]}
                onPress={() => setShapeType("rect")}
              >
                <Icon name="square" size={18} color={COLORS.gray} />
                <Text style={styles.shapeMenuText}>Rectangle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shapeMenuButton,
                  shapeType === "circle" && styles.shapeMenuButtonActive,
                ]}
                onPress={() => setShapeType("circle")}
              >
                <Icon name="circle" size={18} color={COLORS.gray} />
                <Text style={styles.shapeMenuText}>Circle</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Canvas */}
          <View
            style={styles.whiteboardCanvasContainer}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleWhiteboardTouchStart}
            onResponderMove={handleWhiteboardTouchMove}
            onResponderRelease={handleWhiteboardTouchEnd}
          >
            <Svg width={SCREEN_WIDTH} height={canvasHeight} style={styles.whiteboardCanvas}>
              <Rect
                x={0}
                y={0}
                width={SCREEN_WIDTH}
                height={canvasHeight}
                fill={whiteboardBgColor}
              />
              {renderWhiteboardGrid()}
              {whiteboardPaths.map((path, index) => (
                <Path
                  key={index}
                  d={path.d}
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth}
                  fill="none"
                  opacity={path.opacity || 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentWhiteboardPath && (
                <Path
                  d={currentWhiteboardPath}
                  stroke={
                    whiteboardTool === "eraser"
                      ? whiteboardBgColor
                      : whiteboardTool === "highlighter"
                      ? "#FFD54F"
                      : strokeColor
                  }
                  strokeWidth={
                    whiteboardTool === "brush"
                      ? strokeWidth * 2
                      : whiteboardTool === "highlighter"
                      ? strokeWidth * 2.4
                      : whiteboardTool === "eraser"
                      ? strokeWidth * 3
                      : strokeWidth
                  }
                  fill="none"
                  opacity={whiteboardTool === "brush" ? 0.6 : whiteboardTool === "highlighter" ? 0.35 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {lassoPath && (
                <Path
                  d={lassoPath}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="6 4"
                />
              )}
            </Svg>
            </View>
          </>
        </View>
      </View>
    );
  }

  const renderResultCard = ({ item }: { item: typeof flashcardResults[0] }) => {
    const progress = item.totalCount > 0 
      ? Math.round((item.rememberedCount / item.totalCount) * 100) 
      : 0;
    const titleParts = item.title.split(" - ");
    const chapter = titleParts[0] || "Chương 1";
    const subject = titleParts[1] || "Toán Cao cấp";

    return (
      <TouchableOpacity
        style={styles.resultCard}
        activeOpacity={0.7}
      >
        <View style={styles.resultCardHeader}>
          <View style={styles.resultCardIconContainer}>
            <Icon name="layers" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.resultCardTitleContainer}>
            <Text style={styles.resultCardChapter}>{chapter}</Text>
            <Text style={styles.resultCardSubject}>{subject}</Text>
          </View>
        </View>
        
        <View style={styles.resultCardStats}>
          <View style={styles.resultStatItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.resultStatText}>
              {item.rememberedCount} đã nhớ
            </Text>
          </View>
          <View style={styles.resultStatItem}>
            <Icon name="x-circle" size={16} color="#F44336" />
            <Text style={styles.resultStatText}>
              {item.notRememberedCount} chưa nhớ
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "flashcard" && styles.tabActive]}
        onPress={() => setActiveTab("flashcard")}
        activeOpacity={0.7}
      >
        <Icon
          name="layers"
          size={20}
          color={activeTab === "flashcard" ? COLORS.primary : COLORS.gray}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "flashcard" && styles.tabTextActive,
          ]}
        >
          Thẻ ghi nhớ
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "whiteboard" && styles.tabActive]}
        onPress={() => setActiveTab("whiteboard")}
        activeOpacity={0.7}
      >
        <Icon
          name="edit-3"
          size={20}
          color={activeTab === "whiteboard" ? COLORS.primary : COLORS.gray}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "whiteboard" && styles.tabTextActive,
          ]}
        >
          Bảng trắng
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "results" && styles.tabActive]}
        onPress={() => setActiveTab("results")}
        activeOpacity={0.7}
      >
        <Icon
          name="bar-chart-2"
          size={20}
          color={activeTab === "results" ? COLORS.primary : COLORS.gray}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "results" && styles.tabTextActive,
          ]}
          numberOfLines={1}
        >
          Kết quả
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadQuestionSets}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === "whiteboard") {
      return renderWhiteboard();
    }

    if (activeTab === "results") {
      if (flashcardResults.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="bar-chart-2" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              Chưa có kết quả học tập nào. Hãy bắt đầu học để xem kết quả!
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsHeaderTitle}>Kết quả học tập</Text>
          </View>
          <FlatList
            data={flashcardResults}
            renderItem={renderResultCard}
            keyExtractor={(item) => item.setId}
            contentContainerStyle={styles.resultsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }

    if (questionSets.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="inbox" size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            Chưa có bộ câu hỏi nào. Hãy tạo bộ câu hỏi mới!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={questionSets}
        renderItem={renderSetCard}
        keyExtractor={(item) => item.set_id}
        numColumns={IS_MOBILE ? 2 : 3}
        contentContainerStyle={styles.setsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (IS_WEB) {
    return (
      <DashboardLayout title="Công cụ học tập" showSearch={false}>
        <View style={styles.webContainer}>
          {renderTabs()}
          {renderContent()}
        </View>
      </DashboardLayout>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Công cụ học tập</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="zap" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="edit-3" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webContainer: {
    flex: 1,
    padding: IS_WEB ? 24 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerIcon: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: IS_WEB ? 0 : 16,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    minWidth: 80,
  },
  tabActive: {
    backgroundColor: COLORS.primary + "15",
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.alert,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
  },
  whiteboardOuter: {
    flex: 1,
    paddingVertical: IS_WEB ? 16 : 0,
    paddingHorizontal: IS_WEB ? 24 : 0,
    alignItems: IS_WEB ? "center" : "stretch",
  },
  whiteboardCard: {
    width: "100%",
    maxWidth: IS_WEB ? 1200 : undefined,
    borderRadius: IS_WEB ? 16 : 0,
    backgroundColor: IS_WEB ? COLORS.white : "transparent",
    borderWidth: IS_WEB ? 1 : 0,
    borderColor: IS_WEB ? "#E5E5E5" : "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: IS_WEB ? 4 : 0 },
    shadowOpacity: IS_WEB ? 0.08 : 0,
    shadowRadius: IS_WEB ? 10 : 0,
    elevation: IS_WEB ? 4 : 0,
    overflow: IS_WEB ? "hidden" : "visible",
  },
  whiteboardContainer: {
    flex: 1,
  },
  setsList: {
    padding: IS_WEB ? 0 : 16,
    paddingBottom: 100,
  },
  setCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: IS_MOBILE ? 6 : 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: IS_MOBILE ? "48%" : "31%",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardSubject: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  cardChapter: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statSuccess: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  learnButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  learnButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: IS_WEB ? 0 : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: IS_WEB ? 0 : 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  resultsHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  resultsList: {
    padding: IS_WEB ? 0 : 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resultCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultCardTitleContainer: {
    flex: 1,
  },
  resultCardChapter: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  resultCardSubject: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  resultCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  resultStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultStatText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    minWidth: 40,
    textAlign: "right",
  },
  whiteboardToolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    gap: 8,
  },
  whiteboardToolButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  whiteboardToolButtonActive: {
    backgroundColor: COLORS.primary + "15",
  },
  whiteboardToolDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 4,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  whiteboardCanvasContainer: {
    flex: 1,
    width: IS_WEB ? SCREEN_WIDTH : "100%",
  },
  whiteboardCanvas: {
    flex: 1,
  },
  strokeOptionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  strokeOptionsLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  strokeColorsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  strokeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E5E5",
  },
  strokeColorDotActive: {
    borderColor: COLORS.black,
    borderWidth: 3,
  },
  strokeWidthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  strokeWidthButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  strokeWidthButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  strokeWidthPreview: {
    width: "80%",
    backgroundColor: COLORS.black,
    borderRadius: 4,
  },
  shapeMenuContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: COLORS.white,
  },
  shapeMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  shapeMenuButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  shapeMenuText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  saveModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: IS_WEB ? 400 : SCREEN_WIDTH - 40,
    maxWidth: 400,
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 8,
  },
  saveModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
    lineHeight: 20,
  },
  saveModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  saveModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  exportOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: COLORS.primary + "15",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

