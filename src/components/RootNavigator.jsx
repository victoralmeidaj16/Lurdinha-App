import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home, Users, Trophy, User } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

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

// ─── Screens: Game ───────────────────────────────────────────
import GameHomeScreen from '../screens/game/GameHomeScreen';
import CreateRoomScreen from '../screens/game/CreateRoomScreen';
import JoinRoomScreen from '../screens/game/JoinRoomScreen';
import LobbyScreen from '../screens/game/LobbyScreen';
import GameScreen from '../screens/game/GameScreen';
import RoundResultScreen from '../screens/game/RoundResultScreen';
import FinalResultScreen from '../screens/game/FinalResultScreen';

// ─── Screens: Impostor ───────────────────────────────────────
import ImpostorLobbyScreen from '../screens/impostor/ImpostorLobbyScreen';
import ImpostorRoleScreen from '../screens/impostor/ImpostorRoleScreen';
import ImpostorGameScreen from '../screens/impostor/ImpostorGameScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { label: 'Início', Icon: Home, route: 'home' },
  { label: 'Grupos', Icon: Users, route: 'groups' },
  { label: 'Quiz',   Icon: Trophy, route: 'quiz' },
  { label: 'Perfil', Icon: User,  route: 'profile' },
];

// ─── Custom Animated Tab Bar ─────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const tabLayouts = useRef({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => ({
    left: pillX.value,
    width: pillWidth.value,
    opacity: pillWidth.value ? 1 : 0,
  }));

  const animateToKey = (key) => {
    const layout = tabLayouts.current[key];
    if (!layout) return;
    pillX.value = withSpring(layout.x, { damping: 18, stiffness: 220 });
    pillWidth.value = withSpring(layout.width, { damping: 18, stiffness: 220 });
  };

  useEffect(() => {
    animateToKey(state.routes[state.index].key);
  }, [state.index]);

  const NavBody = () => (
    <View style={styles.bottomNav}>
      <Animated.View style={[styles.pillIndicator, pillStyle]} />
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { Icon, label } = TAB_ITEMS[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabButton}
            onPress={onPress}
            activeOpacity={0.7}
            onLayout={(e) => {
              tabLayouts.current[route.key] = e.nativeEvent.layout;
              if (isFocused) animateToKey(route.key);
            }}
          >
            <Icon size={22} color={isFocused ? colors.primaryMuted : colors.textMuted} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
            {isFocused && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.bottomNavContainer}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={styles.blurView}>
          <NavBody />
        </BlurView>
      ) : (
        <View style={[styles.blurView, styles.androidBlurView]}>
          <NavBody />
        </View>
      )}
    </View>
  );
}

// ─── Bottom Tabs Navigator ───────────────────────────────────
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

// ─── App Stack Navigator ─────────────────────────────────────
function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Bottom Tabs (root) */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* Groups */}
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="SearchGroups" component={SearchGroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />

      {/* Quiz */}
      <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="CreateQuizGroupStep1" component={CreateQuizGroupStep1Screen} />
      <Stack.Screen name="CreateQuizGroupStep2" component={CreateQuizGroupStep2Screen} />
      <Stack.Screen name="QuizGroupDetail" component={QuizGroupDetailScreen} />
      <Stack.Screen name="SelectGroupForQuiz" component={SelectGroupForQuizScreen} />

      {/* Ranking & History */}
      <Stack.Screen name="Ranking" component={RankingScreen} />
      <Stack.Screen name="SelectGroupRanking" component={SelectGroupRankingScreen} />
      <Stack.Screen name="SelectQuizGroupRanking" component={SelectQuizGroupRankingScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ResultReveal" component={ResultRevealScreen} />

      {/* Settings & Profile */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Marketing" component={MarketingScreen} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} />

      {/* Game */}
      <Stack.Screen name="GameHome" component={GameHomeScreen} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="RoundResult" component={RoundResultScreen} />
      <Stack.Screen name="FinalResult" component={FinalResultScreen} />

      {/* Impostor */}
      <Stack.Screen name="ImpostorLobby" component={ImpostorLobbyScreen} />
      <Stack.Screen name="ImpostorRole" component={ImpostorRoleScreen} />
      <Stack.Screen name="ImpostorGame" component={ImpostorGameScreen} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator (exported) ────────────────────────────────
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
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
    borderTopColor: colors.whiteAlpha10,
    overflow: 'hidden',
  },
  androidBlurView: {
    backgroundColor: 'rgba(21, 22, 26, 0.98)',
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
    minWidth: 60,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primaryMuted,
  },
  pillIndicator: {
    position: 'absolute',
    top: 6,
    bottom: Platform.OS === 'ios' ? 20 : 8,
    borderRadius: 16,
    backgroundColor: colors.primaryAlpha20,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryMuted,
    marginTop: 4,
  },
});
