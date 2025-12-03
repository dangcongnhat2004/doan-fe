import * as ImagePicker from "expo-image-picker";

export type FileResult = {
  uri: string;
  type: string;
  name: string;
  size?: number;
};

const mimeFromExtension = (ext?: string): string => {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "heic":
    case "heif":
      return "image/heic";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
};

const resolveMimeType = (asset: ImagePicker.ImagePickerAsset): string => {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  if (asset.type === "image") {
    const ext = asset.fileName?.split(".").pop()?.toLowerCase() ??
      asset.uri.split(".").pop()?.toLowerCase();
    return mimeFromExtension(ext) === "application/octet-stream"
      ? "image/jpeg"
      : mimeFromExtension(ext);
  }

  if (asset.type === "video") {
    const ext = asset.fileName?.split(".").pop()?.toLowerCase() ??
      asset.uri.split(".").pop()?.toLowerCase();
    return mimeFromExtension(ext) === "application/octet-stream"
      ? "video/mp4"
      : mimeFromExtension(ext);
  }

  return "application/octet-stream";
};

const ensureFilenameHasExtension = (name: string, mimeType: string): string => {
  if (name.includes(".")) {
    return name;
  }

  const defaultExt = mimeType.startsWith("image/")
    ? mimeType.replace("image/", "")
    : mimeType.startsWith("video/")
    ? mimeType.replace("video/", "")
    : "dat";

  return `${name}.${defaultExt}`;
};

const mapAssetToFile = (
  asset?: ImagePicker.ImagePickerAsset
): FileResult | null => {
  if (!asset?.uri) {
    return null;
  }

  const fallbackName =
    asset.fileName || asset.uri.split("/").pop() || `file_${Date.now()}`;
  const mimeType = resolveMimeType(asset);
  const normalizedName = ensureFilenameHasExtension(fallbackName, mimeType);

  return {
    uri: asset.uri,
    type: mimeType,
    name: normalizedName,
    size: asset.fileSize,
  };
};

const requestPermission = async (
  requestFn: () => Promise<ImagePicker.PermissionResponse>,
  permissionName: "camera" | "media library"
): Promise<boolean> => {
  const { status } = await requestFn();
  if (status !== ImagePicker.PermissionStatus.GRANTED) {
    console.warn(`Quyền truy cập ${permissionName} chưa được cấp.`);
    return false;
  }
  return true;
};

// Pick file from device storage (images/videos)
export const pickFile = async (): Promise<FileResult | null> => {
  const granted = await requestPermission(
    ImagePicker.requestMediaLibraryPermissionsAsync,
    "media library"
  );
  if (!granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsMultipleSelection: false,
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return mapAssetToFile(result.assets?.[0]);
};

// Take photo from camera
export const takePhoto = async (): Promise<FileResult | null> => {
  try {
    const granted = await requestPermission(
      ImagePicker.requestCameraPermissionsAsync,
      "camera"
    );
    if (!granted) {
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || !result.assets[0]?.uri) {
      return null;
    }

    const mapped = mapAssetToFile(result.assets[0]);

    if (!mapped) {
      throw new Error("Không lấy được thông tin file ảnh từ camera.");
    }

    return mapped;
  } catch (error) {
    console.error("takePhoto error:", error);
    // Để màn hình Upload hiển thị Alert thân thiện
    throw error instanceof Error
      ? error
      : new Error("Có lỗi xảy ra khi chụp ảnh. Vui lòng thử lại.");
  }
};

// Pick image from gallery (images only)
export const pickImage = async (): Promise<FileResult | null> => {
  const granted = await requestPermission(
    ImagePicker.requestMediaLibraryPermissionsAsync,
    "media library"
  );
  if (!granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return mapAssetToFile(result.assets?.[0]);
};

