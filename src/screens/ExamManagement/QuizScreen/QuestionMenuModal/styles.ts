import { StyleSheet } from "react-native";
import { COLORS } from "../../../../constants/colors";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  questionGrid: {
    gap: 8,
  },
  questionBtnContainer: {
    position: "relative",
    margin: 4,
  },
  questionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.borderGray,
  },
  questionBtnCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  questionBtnAnswered: {
    backgroundColor: "#4A4A4A",
    borderColor: "#4A4A4A",
  },
  questionBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  questionBtnTextCurrent: {
    color: COLORS.white,
  },
  questionBtnTextAnswered: {
    color: COLORS.white,
  },
  flagIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.alert,
  },
  flagText: {
    fontSize: 10,
  },
});
