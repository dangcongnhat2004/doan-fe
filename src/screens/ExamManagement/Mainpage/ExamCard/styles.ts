import { StyleSheet } from "react-native";
import { COLORS } from "../../../../constants/colors";


const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 0.8,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 12,
    width: "100%",
    
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    
    elevation: 2,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  
  titleWrapper: {
    justifyContent: "center",
  },

  actionWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  headerLeft: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  iconButton: {
    padding: 8,
  },

  date: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.gray,
    marginBottom: 4,
  },

  metaText: {
    fontSize: 14,
    color: COLORS.gray,
  },

  statusBadge: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "capitalize",
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  progressLabel: {
    fontSize: 13,
    color: COLORS.black,
  },

  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },

  buttonRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default styles;