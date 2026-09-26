import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AddScreen from '../screens/AddScreen';
import ViewScreen from '../screens/viewScreen';
import { categoryIconMap } from '../utils/categoriesIcons';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#15151C',
          borderTopWidth: 0,
          height: 70,
        },
        tabBarActiveTintColor: '#D4A017',
        tabBarInactiveTintColor: '#8B8B99',
      }}
    >
      {/* HOME */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: () => (
            <Image source={categoryIconMap.home} style={{ width: 22, height: 22 }} />
          ),
        }}
      />

      {/* HISTORY */}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: () => (
            <Image source={categoryIconMap.history} style={{ width: 22, height: 22 }} />
          ),
        }}
      />

      {/* VIEW */}
      <Tab.Screen
        name="View"
        component={ViewScreen}
        options={{
          tabBarIcon: () => (
            <Image source={categoryIconMap.viewsearch} style={{ width: 22, height: 22 }} />
          ),
        }}
      />

      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarIcon: () => (
            <Image source={categoryIconMap.add} style={{ width: 22, height: 22 }} />
          ),
        }}
      />

    </Tab.Navigator>
  );
}