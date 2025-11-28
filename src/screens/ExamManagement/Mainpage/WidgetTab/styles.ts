import { StyleSheet } from 'react-native';
import { COLORS } from '../../../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBlock: 12,
    elevation: 3, 
    shadowColor: COLORS.black, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%', 
    backgroundColor: '#f9f9f9',
    borderWidth: 0.8,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginBottom: 8,
  },
  value: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
