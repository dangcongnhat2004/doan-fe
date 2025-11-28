import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

type StatItemProps = {
  iconName: string;
  value: number;
  label: string;
  color?: string;
};

const StatItem = ({ iconName, value, label, color = '#3498db' }: StatItemProps) => (
  <View style={styles.statItem}>
    <Icon name={iconName} size={24} color={color} style={styles.icon} />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);
type WidgetTabProps = {
  totalExams: number;
  inProgress: number;
  totalStudents: number;
  pendingExam: number;
};

export default function WidgetTab({
  totalExams,
  inProgress,
  totalStudents,
  pendingExam,
}: WidgetTabProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tổng quan về Đề thi</Text>
      <View style={styles.grid}>
        <StatItem iconName="description" value={totalExams} label="Tổng số Đề thi" />
        <StatItem iconName="check-circle-outline" value={inProgress} label="Đang Hoạt động" />
        {/* Tạm thời ẩn - có thể mở lại khi cần */}
        {/* <StatItem iconName="person-outline" value={totalStudents} label="Số Học viên" /> */}
        {/* <StatItem iconName="hourglass-empty" value={pendingExam} label="Đề cần Duyệt" /> */}
      </View>
    </View>
  );
}
