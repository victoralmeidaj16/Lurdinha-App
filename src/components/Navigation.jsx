import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, User, Users } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupsScreen from '../screens/GroupsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import SearchGroupsScreen from '../screens/SearchGroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import CreateQuizScreen from '../screens/CreateQuizScreen';
import QuizScreen from '../screens/QuizScreen';
import CreateQuizGroupStep1Screen from '../screens/CreateQuizGroupStep1Screen';
import CreateQuizGroupStep2Screen from '../screens/CreateQuizGroupStep2Screen';
import QuizGroupDetailScreen from '../screens/QuizGroupDetailScreen';

export default function Navigation() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState({ name: 'home', params: {} });
  const [history, setHistory] = useState([]);

  const navigate = (name, params = {}) => {
    setHistory([...history, currentScreen]);
    setCurrentScreen({ name, params });
    if (['home', 'groups', 'profile'].includes(name)) {
      setActiveTab(name);
    }
  };

  const goBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentScreen(previous);
      if (['home', 'groups', 'profile'].includes(previous.name)) {
        setActiveTab(previous.name);
      }
    }
  };

  const tabs = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'groups', label: 'Grupos', icon: Users },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const renderScreen = () => {
    const { name, params } = currentScreen;
    
    switch (name) {
      case 'home':
        return <HomeScreen />;
      case 'groups':
        return <GroupsScreen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'profile':
        return <ProfileScreen />;
      case 'CreateGroup':
        return <CreateGroupScreen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'SearchGroups':
        return <SearchGroupsScreen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'GroupDetail':
        return <GroupDetailScreen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'CreateQuiz':
        return <CreateQuizScreen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'Quiz':
        return <QuizScreen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'CreateQuizGroupStep1':
        return <CreateQuizGroupStep1Screen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'CreateQuizGroupStep2':
        return <CreateQuizGroupStep2Screen navigation={{ navigate, goBack }} route={{ params }} />;
      case 'QuizGroupDetail':
        return <QuizGroupDetailScreen navigation={{ navigate, goBack }} route={{ params }} />;
      default:
        return <HomeScreen navigation={{ navigate, goBack }} route={{ params }} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      {['home', 'groups', 'profile'].includes(currentScreen.name) && (
        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  setActiveTab(tab.id);
                  navigate(tab.id);
                }}
              >
                <Icon 
                  size={20} 
                  color={isActive ? '#a855f7' : '#9ca3af'} 
                />
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive
                ]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 80,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(21, 22, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#a855f7',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a855f7',
    marginTop: 4,
  },
});
