import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { UserPlus, Users, X, Check } from 'lucide-react-native';
import AvatarCircle from '../../components/AvatarCircle';
import { colors } from '../../theme';

export default function AdminNotificationBanner({
  adminNotifications,
  handleAcceptRequest,
  handleRejectRequest,
}) {
  if (!adminNotifications || adminNotifications.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <UserPlus size={20} color={colors.primaryLight} />
        <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.notificationsScroll}
      >
        {adminNotifications.map((notification) => (
          <Animated.View key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={[styles.groupBadgeSmall, { backgroundColor: notification.groupColor }]}>
                <Users size={12} color="#fff" />
              </View>
              <Text style={styles.notificationGroupName} numberOfLines={1}>
                {notification.groupName}
              </Text>
            </View>

            <View style={styles.notificationContent}>
              <AvatarCircle
                name={notification.userName}
                photoURL={notification.userPhoto}
                size={48}
              />
              <View style={styles.notificationUserInfo}>
                <Text style={styles.notificationUserName} numberOfLines={1}>
                  {notification.userName}
                </Text>
                <Text style={styles.notificationActionText}>quer entrar no grupo</Text>
              </View>
            </View>

            <View style={styles.notificationActions}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(notification)}
                activeOpacity={0.7}
              >
                <X size={20} color="#ef4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(notification)}
                activeOpacity={0.7}
              >
                <Text style={styles.acceptButtonText}>Aceitar</Text>
                <Check size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  notificationsScroll: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 4,
  },
  notificationCard: {
    width: 280,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  groupBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationGroupName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textAlt,
    flex: 1,
  },
  notificationContent: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  notificationUserInfo: {
    alignItems: 'center',
    gap: 2,
  },
  notificationUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    textAlign: 'center',
  },
  notificationActionText: {
    fontSize: 13,
    color: colors.textAlt,
    textAlign: 'center',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
