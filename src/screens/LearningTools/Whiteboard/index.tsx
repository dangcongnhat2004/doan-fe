import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  InteractionManager,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Circle, Line, Path, Rect, Svg } from "react-native-svg";
import Icon from "react-native-vector-icons/Feather";
import { COLORS } from "../../../constants/colors";
import { storage } from "../../../utils/storage";
import Text from "../../../components/Text";
import { styles } from "./styles";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "./viewShotHelper";

const IS_WEB = Platform.OS === "web";

export default function Whiteboard() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
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
  const canvasRef = useRef<View>(null);
  const whiteboardCardRef = useRef<View>(null);

  const handleWhiteboardTouchStart = (event: any) => {
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
    if (now - lastUpdateTimeRef.current < 16) return;
    lastUpdateTimeRef.current = now;
    
    const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
    const locationX = Math.round(touch.locationX || touch.pageX);
    const locationY = Math.round(touch.locationY || touch.pageY);
    setCurrentWhiteboardPath((prev) => `${prev} L${locationX},${locationY}`);
  };

  const handleWhiteboardTouchEnd = () => {
    if (whiteboardTool === "lasso") {
      if (currentWhiteboardPath && isDrawing) {
        setLassoPath(currentWhiteboardPath);

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
                finalPath = `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy}`;
              }
            }
          }
        } catch {
          finalPath = currentWhiteboardPath;
        }
      }

      let stroke = strokeColor;
      let width = strokeWidth;
      let opacity = 1;

      if (whiteboardTool === "brush") {
        width = strokeWidth * 2;
        opacity = 0.6;
      } else if (whiteboardTool === "highlighter") {
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
    if (typeof document === "undefined") return;
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

  const handleSaveWhiteboardToDevice = async () => {
    if (!whiteboardPaths.length) {
      Alert.alert("Thông báo", "Chưa có nội dung để lưu.");
      return;
    }

    try {
      const canvasWidth = SCREEN_WIDTH;
      const canvasHeight = IS_WEB ? 600 : SCREEN_HEIGHT - 300;
      const filename = `whiteboard-${Date.now()}.png`;

      if (IS_WEB) {
        // Web: Use canvas to create image and download
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
        const dataUrl = canvas.toDataURL("image/png");
        triggerDownload(dataUrl, filename);
        Alert.alert("Thành công", "Đã lưu file thành công!");
      } else {
        // Mobile: Convert SVG to image and save
        // Since view-shot has issues with SVG on Android, we'll save as SVG file
        try {
          const canvasWidth = SCREEN_WIDTH;
          const mobileCanvasHeight = SCREEN_HEIGHT - 300;
          
          // Create SVG string
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${mobileCanvasHeight}" viewBox="0 0 ${canvasWidth} ${mobileCanvasHeight}">
  <rect width="100%" height="100%" fill="${whiteboardBgColor}" />
  ${whiteboardPaths
    .map(
      (path) =>
        `<path d="${path.d}" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${path.opacity ?? 1}" />`
    )
    .join("\n")}
</svg>`;

          // Try view-shot first, fallback to SVG file
          if (captureRef && typeof captureRef === 'function' && whiteboardCardRef.current) {
            try {
              // Wait for UI to finish rendering
              await new Promise((resolve) => {
                InteractionManager.runAfterInteractions(() => {
                  setTimeout(resolve, 300);
                });
              });

              const uri = await (captureRef as (view: any, options?: any) => Promise<string>)(whiteboardCardRef.current, {
                format: "png",
                quality: 1,
                result: "tmpfile",
                snapshotContentContainer: true,
              });

              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                await Sharing.shareAsync(uri, {
                  mimeType: "image/png",
                  dialogTitle: "Lưu whiteboard",
                  UTI: "public.png",
                });
                Alert.alert("Thành công", "Đã lưu file thành công!");
                return;
              }
            } catch (viewShotError) {
              console.warn("View-shot failed, using SVG fallback:", viewShotError);
              // Fall through to SVG file method
            }
          }

          // Fallback: Save SVG file directly
          // Create a temporary file path using expo-file-system's cache directory
          const fileName = `whiteboard-${Date.now()}.svg`;
          // Get the cache directory - expo-file-system provides this as a constant
          const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
          const fileUri = `${cacheDir}${fileName}`;
          // writeAsStringAsync defaults to UTF8 encoding, no encoding parameter needed
          await FileSystem.writeAsStringAsync(fileUri, svgContent);
          
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: "image/svg+xml",
              dialogTitle: "Lưu whiteboard",
              UTI: "public.svg-image",
            });
            Alert.alert("Thành công", "Đã lưu file SVG thành công!");
          } else {
            Alert.alert("Thông báo", "Không thể chia sẻ file trên thiết bị này.");
          }
        } catch (err) {
          console.error("Error saving whiteboard:", err);
          Alert.alert("Lỗi", "Không thể lưu file. Vui lòng thử lại.");
        }
      }
    } catch (err) {
      console.error("Error saving whiteboard:", err);
      Alert.alert("Lỗi", "Không thể lưu file. Vui lòng thử lại.");
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

  useEffect(() => {
    handleLoadWhiteboard();
  }, []);

  useEffect(() => {
    if (whiteboardPaths.length > 0) {
      const timer = setTimeout(() => {
        saveWhiteboardAuto();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [whiteboardPaths, whiteboardBgColor, whiteboardGrid]);

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

  const canvasHeight = IS_WEB ? 600 : SCREEN_HEIGHT - 300;

  const renderToolbar = () => {
    const toolbarButtons = (
      <>
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
        <View style={styles.whiteboardToolDivider} />
        <TouchableOpacity
          style={styles.whiteboardToolButton}
          onPress={handleSaveWhiteboardToDevice}
        >
          <Icon name="save" size={20} color={COLORS.primary} />
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
      </>
    );

    if (IS_WEB) {
      return <View style={styles.whiteboardToolbar}>{toolbarButtons}</View>;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.whiteboardToolbar}
      >
        {toolbarButtons}
      </ScrollView>
    );
  };

  const renderStrokeOptions = () => {
    if (!showStrokeOptions) return null;

    return (
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
    );
  };

  const renderShapeMenu = () => {
    if (!showShapeMenu) return null;

    return (
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
    );
  };

  if (IS_WEB) {
    return (
      <View style={styles.whiteboardOuter}>
        <View ref={whiteboardCardRef} style={styles.whiteboardCard} collapsable={false}>
          {renderToolbar()}
          {renderStrokeOptions()}
          {renderShapeMenu()}
          <View
            ref={canvasRef}
            style={styles.whiteboardCanvasContainer}
            collapsable={false}
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

  return (
    <View style={styles.whiteboardOuter}>
      <View ref={whiteboardCardRef} style={styles.whiteboardCard} collapsable={false}>
        {renderToolbar()}
        {renderStrokeOptions()}
        {renderShapeMenu()}
        <View
          ref={canvasRef}
          style={styles.whiteboardCanvasContainer}
          collapsable={false}
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

