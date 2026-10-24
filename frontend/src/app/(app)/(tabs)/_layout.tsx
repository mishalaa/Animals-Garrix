import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '@/theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, [IonName, IonName]> = {
  index: ['home', 'home-outline'],
  schedule: ['calendar', 'calendar-outline'],
  profile: ['person', 'person-outline'],
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

/** Obsidian floating pill with white circle on active tab and radiant coral add button. */
function FloatingTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    index: t('tabs.home'),
    schedule: t('tabs.schedule'),
    profile: t('tabs.profile'),
  };

  const tab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    const focused = state.index === routeIndex;
    const [on, off] = ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={labels[route.name]}
        onPress={() => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? colors.white : 'transparent',
        }}
      >
        <Ionicons name={focused ? on : off} size={22} color={focused ? colors.ink : '#8E98A4'} />
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 16,
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 6,
            borderRadius: 999,
            backgroundColor: colors.ink,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
          shadow,
        ]}
      >
        {tab(0)}
        {tab(1)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.addPet')}
          onPress={() => router.push('/pet/new')}
          style={({ pressed }) => ({
            width: 50,
            height: 50,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
            shadowColor: colors.primary,
            shadowOpacity: 0.35,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          })}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
        {tab(2)}
      </View>
    </View>
  );
}
