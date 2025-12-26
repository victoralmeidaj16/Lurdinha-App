import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, User, Users, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupsScreen from '../screens/GroupsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import SearchGroupsScreen from '../screens/SearchGroupsScreen';
import SelectGroupRankingScreen from '../screens/SelectGroupRankingScreen';
import SelectQuizGroupRankingScreen from '../screens/SelectQuizGroupRankingScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import CreateQuizScreen from '../screens/CreateQuizScreen';
import QuizScreen from '../screens/QuizScreen';

import CreateQuizGroupStep1Screen from '../screens/CreateQuizGroupStep1Screen';
import CreateQuizGroupStep2Screen from '../screens/CreateQuizGroupStep2Screen';
import QuizGroupDetailScreen from '../screens/QuizGroupDetailScreen';
import QuizGroupsScreen from '../screens/QuizGroupsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RankingScreen from '../screens/RankingScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AboutScreen from '../screens/AboutScreen';
import SelectGroupForQuizScreen from '../screens/SelectGroupForQuizScreen';
import SupportScreen from '../screens/SupportScreen';
import MarketingScreen from '../screens/MarketingScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import GameHomeScreen from '../screens/game/GameHomeScreen';
import CreateRoomScreen from '../screens/game/CreateRoomScreen';
import JoinRoomScreen from '../screens/game/JoinRoomScreen';
import LobbyScreen from '../screens/game/LobbyScreen';
import GameScreen from '../screens/game/GameScreen';
import RoundResultScreen from '../screens/game/RoundResultScreen';
import FinalResultScreen from '../screens/game/FinalResultScreen';

export default function Navigation() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState({ name: 'home', params: {} });
  const [history, setHistory] = useState([]);

  const tabLayouts = useRef({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  const pillStyle = useAnimatedStyle(() => ({
    left: pillX.value,
    width: pillWidth.value,
    opacity: pillWidth.value ? 1 : 0,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const animateToTab = useCallback((tabId) => {
    const layout = tabLayouts.current[tabId];
    if (!layout) return;

    pillX.value = withSpring(layout.x, {
      damping: 18,
      stiffness: 220,
    });

    pillWidth.value = withSpring(layout.width, {
      damping: 18,
      stiffness: 220,
    });
  }, [pillWidth, pillX]);

  const navigate = (name, params = {}) => {
    setHistory([...history, currentScreen]);
    setCurrentScreen({ name, params });

    if (['home', 'groups', 'quiz', 'profile'].includes(name)) {
      setActiveTab(name);
      contentOpacity.value = withTiming(0, { duration: 120 }, (finished) => {
        if (finished) {
          contentOpacity.value = withTiming(1, { duration: 120 });
        }
      });

      animateToTab(name);

      const tabLabel = tabs.find((tab) => tab.id === name)?.label;
      if (tabLabel) {
        AccessibilityInfo.announceForAccessibility(`Aba ${tabLabel} ativa`);
      }

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const replace = (name, params = {}) => {
    setCurrentScreen({ name, params });
    // We don't add to history for replace, effectively replacing the current screen

    if (['home', 'groups', 'quiz', 'profile'].includes(name)) {
      setActiveTab(name);
      animateToTab(name);
    }
  };

  const goBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentScreen(previous);
      if (['home', 'groups', 'quiz', 'profile'].includes(previous.name)) {
        setActiveTab(previous.name);
        animateToTab(previous.name);
      }
    }
  };

  const tabs = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'groups', label: 'Grupos', icon: Users },
    { id: 'quiz', label: 'Quiz', icon: Trophy },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  // Páginas que devem mostrar o bottom navigation
  const shouldShowBottomNav = () => {
    const { name } = currentScreen;
    const mainTabs = ['home', 'groups', 'quiz', 'profile'];

    // Sempre mostrar nas páginas principais
    if (mainTabs.includes(name)) return true;

    // Mostrar também em páginas secundárias relacionadas
    const secondaryPagesWithNav = [
      'CreateGroup',
      'SearchGroups',
      'GroupDetail',
      'QuizGroupDetail',
      'Ranking',
      'SelectGroupRanking',
      'SelectQuizGroupRanking',
      'Settings',
      'About',
      'PrivacyPolicy',
      'TermsOfService',
      'DeleteAccount',
      'Support',
      'Marketing',
      'ExportData',
      'CreateQuizGroupStep1',
      'CreateQuizGroupStep2',
      'SelectGroupForQuiz',
      'EditProfile',
      'History',
      'UserProfile',
    ];

    return secondaryPagesWithNav.includes(name);
  };

  useEffect(() => {
    if (tabLayouts.current[activeTab]) {
      animateToTab(activeTab);
    }
  }, [activeTab, animateToTab]);

  const renderScreen = () => {
    const { name, params } = currentScreen;

    switch (name) {
      case 'home':
        return <HomeScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'groups':
        return <GroupsScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'quiz':
        return <QuizGroupsScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'profile':
        return <ProfileScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Settings':
        return <SettingsScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'CreateGroup':
        return <CreateGroupScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'SearchGroups':
        return <SearchGroupsScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'GroupDetail':
        return <GroupDetailScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'CreateQuiz':
        return <CreateQuizScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Quiz':
        return <QuizScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'CreateQuizGroupStep1':
        return <CreateQuizGroupStep1Screen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'CreateQuizGroupStep2':
        return <CreateQuizGroupStep2Screen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'QuizGroupDetail':
        return <QuizGroupDetailScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Ranking':
        return <RankingScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'PrivacyPolicy':
        return <PrivacyPolicyScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'TermsOfService':
        return <TermsOfServiceScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'DeleteAccount':
        return <DeleteAccountScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'About':
        return <AboutScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'SelectGroupRanking':
        return <SelectGroupRankingScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'SelectQuizGroupRanking':
        return <SelectQuizGroupRankingScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'SelectGroupForQuiz':
        return <SelectGroupForQuizScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Support':
        return <SupportScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Marketing':
        return <MarketingScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'ExportData':
        return <ExportDataScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'EditProfile':
        return <EditProfileScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      // Game Screens
      case 'GameHome':
        return <GameHomeScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'CreateRoom':
        return <CreateRoomScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'JoinRoom':
        return <JoinRoomScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Lobby':
        return <LobbyScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'Game':
        return <GameScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'RoundResult':
        return <RoundResultScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'FinalResult':
        return <FinalResultScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'History':
        return <HistoryScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      case 'UserProfile':
        return <UserProfileScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
      default:
        return <HomeScreen navigation={{ navigate, goBack, replace }} route={{ params }} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {renderScreen()}
      </Animated.View>

      {/* Bottom Navigation */}
      {shouldShowBottomNav() && (
        <View style={styles.bottomNavContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={styles.blurView}
            >
              <View style={styles.bottomNav}>
                <Animated.View style={[styles.pillIndicator, pillStyle]} />
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={styles.tabButton}
                      onPress={() => {
                        navigate(tab.id);
                      }}
                      onLayout={(event) => {
                        tabLayouts.current[tab.id] = event.nativeEvent.layout;
                        if (tab.id === activeTab) {
                          animateToTab(tab.id);
                        }
                      }}
                    >
                      <Icon
                        size={22}
                        color={isActive ? '#9061F9' : '#9ca3af'}
                      />
                      <Text style={styles.tabLabel}>
                        {tab.label}
                      </Text>
                      {isActive && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>
          ) : (
            <View style={[styles.blurView, styles.androidBlurView]}>
              <View style={styles.bottomNav}>
                <Animated.View style={[styles.pillIndicator, pillStyle]} />
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={styles.tabButton}
                      onPress={() => {
                        navigate(tab.id);
                      }}
                      onLayout={(event) => {
                        tabLayouts.current[tab.id] = event.nativeEvent.layout;
                        if (tab.id === activeTab) {
                          animateToTab(tab.id);
                        }
                      }}
                    >
                      <Icon
                        size={22}
                        color={isActive ? '#9061F9' : '#9ca3af'}
                      />
                      <Text style={styles.tabLabel}>
                        {tab.label}
                      </Text>
                      {isActive && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
  },
  blurView: {
    width: '100%',
    borderRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  androidBlurView: {
    backgroundColor: 'rgba(21, 22, 26, 0.98)',
    backdropFilter: 'blur(20px)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginHorizontal: 2,
    position: 'relative',
    minWidth: 60,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 4,
  },
  pillIndicator: {
    position: 'absolute',
    top: 6,
    bottom: Platform.OS === 'ios' ? 20 : 8,
    borderRadius: 16,
    backgroundColor: 'rgba(144, 97, 249, 0.18)',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9061F9',
    marginTop: 4,
  },
});
