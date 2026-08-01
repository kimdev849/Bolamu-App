import { Tabs } from 'expo-router';
import { AppTabBar } from '../../../src/components/AppTabBar';

export default function DriverTabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="missions" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
