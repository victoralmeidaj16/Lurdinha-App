import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, Gamepad2, Trophy, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';
import { colors } from '../theme';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  clearActiveSocialGameRoom,
  getActiveSocialGameRoom,
} from '../utils/socialGameRoomCache';

// ─── Screens: Main Tabs ──────────────────────────────────────
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupsScreen from '../screens/GroupsScreen';
import QuizGroupsScreen from '../screens/QuizGroupsScreen';

// ─── Screens: Secondary ──────────────────────────────────────
import SettingsScreen from '../screens/SettingsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import SearchGroupsScreen from '../screens/SearchGroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import CreateQuizScreen from '../screens/CreateQuizScreen';
import QuizScreen from '../screens/QuizScreen';
import CreateQuizGroupStep1Screen from '../screens/CreateQuizGroupStep1Screen';
import CreateQuizGroupStep2Screen from '../screens/CreateQuizGroupStep2Screen';
import QuizGroupDetailScreen from '../screens/QuizGroupDetailScreen';
import RankingScreen from '../screens/RankingScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AboutScreen from '../screens/AboutScreen';
import SelectGroupRankingScreen from '../screens/SelectGroupRankingScreen';
import SelectQuizGroupRankingScreen from '../screens/SelectQuizGroupRankingScreen';
import SelectGroupForQuizScreen from '../screens/SelectGroupForQuizScreen';
import SupportScreen from '../screens/SupportScreen';
import MarketingScreen from '../screens/MarketingScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ResultRevealScreen from '../screens/ResultRevealScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// ─── Screens: Game ───────────────────────────────────────────
import GameHomeScreen from '../screens/game/GameHomeScreen';
import CreateRoomScreen from '../screens/game/CreateRoomScreen';
import JoinRoomScreen from '../screens/game/JoinRoomScreen';
import LobbyScreen from '../screens/game/LobbyScreen';
import GameScreen from '../screens/game/GameScreen';
import DrawGameScreen from '../screens/game/DrawGameScreen';
import RoundResultScreen from '../screens/game/RoundResultScreen';
import DrawRoundResultScreen from '../screens/game/DrawRoundResultScreen';
import FinalResultScreen from '../screens/game/FinalResultScreen';
import RoundTransitionScreen from '../screens/game/RoundTransitionScreen';
import TelephoneResultScreen from '../screens/game/TelephoneResultScreen';

// ─── Screens: Impostor ───────────────────────────────────────
import ImpostorLobbyScreen from '../screens/impostor/ImpostorLobbyScreen';
import ImpostorRoleScreen from '../screens/impostor/ImpostorRoleScreen';
import ImpostorGameScreen from '../screens/impostor/ImpostorGameScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const STACK_ROUTE_TO_TAB = {
  GroupDetail: 'groups',
  SearchGroups: 'groups',
  SelectGroupRanking: 'groups',
  CreateGroup: 'groups',

  QuizGroupDetail: 'quiz',
  Quiz: 'quiz',
  SelectGroupForQuiz: 'quiz',
  SelectQuizGroupRanking: 'quiz',
  ResultReveal: 'quiz',

  Ranking: 'ranking',

  History: 'profile',
  UserProfile: 'profile',
  EditProfile: 'profile',
  Notifications: 'home',
};

const MODAL_LIKE_SCREENS = new Set([
  'Settings', 'About', 'Support', 'Marketing', 'PrivacyPolicy',
  'TermsOfService', 'DeleteAccount', 'ExportData',
]);

const FULLSCREEN_FLOW_SCREENS = new Set([
  'CreateGroup', 'SearchGroups', 'GroupDetail', 'CreateQuiz', 'Quiz',
  'CreateQuizGroupStep1', 'CreateQuizGroupStep2', 'QuizGroupDetail',
  'SelectGroupForQuiz', 'Ranking', 'SelectGroupRanking', 'SelectQuizGroupRanking',
  'UserProfile', 'EditProfile', 'Notifications', 'GameHome', 'CreateRoom', 'JoinRoom',
  'Lobby', 'Game', 'DrawGame', 'RoundTransition', 'ImpostorLobby',
  'ImpostorRole', 'ImpostorGame',
]);

const CELEBRATION_SCREENS = new Set([
  'ResultReveal', 'RoundResult', 'DrawRoundResult', 'FinalResult',
]);

const LIVE_ROOM_SCREENS = new Set([
  'Lobby', 'Game', 'DrawGame', 'RoundResult', 'DrawRoundResult',
  'TelephoneResult', 'RoundTransition', 'FinalResult',
]);

function getRoomResumeRoute(roomData) {
  const status = roomData?.status;
  const gameType = roomData?.settings?.gameType;

  if (status === 'waiting') return 'Lobby';
  if (status === 'party_transition') return 'RoundTransition';
  if (status === 'playing') return gameType === 'draw' ? 'DrawGame' : 'Game';
  if (status === 'round_results') {
    if (gameType === 'draw') return 'DrawRoundResult';
    if (gameType === 'telephone' || gameType === 'secret') return 'TelephoneResult';
    return 'RoundResult';
  }

  return null;
}

function getTransitionOptions(routeName) {
  if (MODAL_LIKE_SCREENS.has(routeName)) {
    return Platform.OS === 'ios'
      ? TransitionPresets.ModalPresentationIOS
      : TransitionPresets.FadeFromBottomAndroid;
  }
  if (CELEBRATION_SCREENS.has(routeName)) {
    return Platform.OS === 'ios'
      ? TransitionPresets.ModalSlideFromBottomIOS
      : TransitionPresets.RevealFromBottomAndroid;
  }
  if (FULLSCREEN_FLOW_SCREENS.has(routeName)) {
    return Platform.OS === 'ios'
      ? TransitionPresets.SlideFromRightIOS
      : TransitionPresets.ScaleFromCenterAndroid;
  }
  return Platform.OS === 'ios'
    ? TransitionPresets.SlideFromRightIOS
    : TransitionPresets.FadeFromBottomAndroid;
}

function AppBottomNav({ activeRoute, onNavigate }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, target: 'home' },
    { id: 'groups', label: 'Grupos', icon: Users, target: 'groups' },
    { id: 'jogar', label: 'Jogar', icon: Gamepad2, target: 'GameHome' },
    { id: 'ranking', label: 'Ranking', icon: Trophy, target: 'Ranking' }, // Roteia para RankingScreen
    { id: 'profile', label: 'Perfil', icon: User, target: 'profile' }
  ];

  const currentTabId = activeRoute === 'Ranking' ? 'ranking'
                     : activeRoute === 'GameHome' ? 'jogar'
                     : activeRoute;

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = currentTabId === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigate(tab.target);
              }}
              style={styles.navItem}
            >
              <tab.icon
                size={20}
                color={isActive ? (tab.id === 'jogar' ? '#8B5CF6' : '#FFFFFF') : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[styles.navLabel, { color: isActive ? (tab.id === 'jogar' ? '#8B5CF6' : '#FFFFFF') : 'rgba(255,255,255,0.4)' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function CustomTabBar({ state, navigation }) {
  const activeRoute = state.routes[state.index]?.name;
  return (
    <AppBottomNav
      activeRoute={activeRoute}
      onNavigate={(route) => navigation.navigate(route)}
    />
  );
}

function FloatingRootBottomNav({ activeRoute, navigationRef }) {
  return (
    <AppBottomNav
      activeRoute={activeRoute}
      onNavigate={(route) => {
        if (['home', 'groups', 'quiz', 'profile'].includes(route)) {
          navigationRef.current?.navigate('MainTabs', { screen: route });
        } else {
          navigationRef.current?.navigate(route);
        }
      }}
    />
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="home" component={HomeScreen} />
      <Tab.Screen name="groups" component={GroupsScreen} />
      <Tab.Screen name="quiz" component={QuizGroupsScreen} />
      <Tab.Screen name="profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        gestureEnabled: true,
        cardOverlayEnabled: true,
        ...getTransitionOptions(route.name),
      })}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="SearchGroups" component={SearchGroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />

      <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="CreateQuizGroupStep1" component={CreateQuizGroupStep1Screen} />
      <Stack.Screen name="CreateQuizGroupStep2" component={CreateQuizGroupStep2Screen} />
      <Stack.Screen name="QuizGroupDetail" component={QuizGroupDetailScreen} />
      <Stack.Screen name="SelectGroupForQuiz" component={SelectGroupForQuizScreen} />

      <Stack.Screen name="Ranking" component={RankingScreen} />
      <Stack.Screen name="SelectGroupRanking" component={SelectGroupRankingScreen} />
      <Stack.Screen name="SelectQuizGroupRanking" component={SelectQuizGroupRankingScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ResultReveal" component={ResultRevealScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Marketing" component={MarketingScreen} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} />

      <Stack.Screen name="GameHome" component={GameHomeScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="DrawGame" component={DrawGameScreen} />
      <Stack.Screen name="RoundResult" component={RoundResultScreen} />
      <Stack.Screen name="DrawRoundResult" component={DrawRoundResultScreen} />
      <Stack.Screen name="FinalResult" component={FinalResultScreen} />
      <Stack.Screen name="RoundTransition" component={RoundTransitionScreen} />
      <Stack.Screen name="TelephoneResult" component={TelephoneResultScreen} />

      <Stack.Screen name="ImpostorLobby" component={ImpostorLobbyScreen} />
      <Stack.Screen name="ImpostorRole" component={ImpostorRoleScreen} />
      <Stack.Screen name="ImpostorGame" component={ImpostorGameScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { currentUser } = useAuth();
  const navigationRef = useRef();
  const routeNameRef = useRef();
  const [currentRouteName, setCurrentRouteName] = useState(null);
  const floatingNavTab = STACK_ROUTE_TO_TAB[currentRouteName];
  const didTryResumeActiveRoomRef = useRef(false);

  const resumeActiveRoomIfNeeded = async () => {
    if (!currentUser?.uid || !navigationRef.current || didTryResumeActiveRoomRef.current) return;

    didTryResumeActiveRoomRef.current = true;

    try {
      const activeRoom = await getActiveSocialGameRoom();
      if (!activeRoom?.roomId) return;

      const roomDoc = await getDoc(doc(db, 'game_rooms', activeRoom.roomId));
      if (!roomDoc.exists()) {
        await clearActiveSocialGameRoom(activeRoom.roomId);
        return;
      }

      const roomData = roomDoc.data();
      const players = Array.isArray(roomData.players) ? roomData.players : [];
      const isParticipant = players.some((player) => player.uid === currentUser.uid);
      if (!isParticipant || ['finished', 'abandoned'].includes(roomData.status)) {
        await clearActiveSocialGameRoom(activeRoom.roomId);
        return;
      }

      const targetRoute = getRoomResumeRoute(roomData);
      if (!targetRoute || LIVE_ROOM_SCREENS.has(routeNameRef.current)) return;

      navigationRef.current.navigate(targetRoute, { roomId: activeRoom.roomId });
    } catch (error) {
      console.warn('[RootNavigator] active room resume failed:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.uid && navigationRef.current) {
      resumeActiveRoomIfNeeded();
    }
  }, [currentUser?.uid]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
        setCurrentRouteName(routeNameRef.current);
        resumeActiveRoomIfNeeded();
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current.getCurrentRoute().name;
        routeNameRef.current = currentRouteName;
        setCurrentRouteName(currentRouteName);
      }}
    >
      <View style={styles.navigationShell}>
        <AppNavigator />
        {floatingNavTab && (
          <FloatingRootBottomNav
            activeRoute={floatingNavTab}
            navigationRef={navigationRef}
          />
        )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  navigationShell: { flex: 1, backgroundColor: '#09090B' },
  bottomNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 27, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});
