import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  headerText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: COLORS.black,
  },

  fab: {
    backgroundColor: COLORS.white,
    width: 56,
    height: 56,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
    right: 20,
    elevation: 5,
  },
  fabText: { fontSize: 30, color: COLORS.primary, lineHeight: 34 },
});