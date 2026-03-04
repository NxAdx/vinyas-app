import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '@/src/components/AppScreen';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFileStore } from '@/src/stores/useFileStore';
import { useVaultStore } from '@/src/stores/useVaultStore';
import { colors } from '@/src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();

  const initialized = useFileStore((state) => state.initialized);
  const categories = useFileStore((state) => state.categories);
  const storageSources = useFileStore((state) => state.storageSources);
  const initialize = useFileStore((state) => state.initialize);

  const hydrateVault = useVaultStore((state) => state.hydrate);
  const unlockedVault = useVaultStore((state) => state.unlocked);

  const setHasLoadedApp = useAppStore((state) => state.setHasLoadedApp);
  const globalMode = useAppStore((state) => state.globalMode);
  const setGlobalMode = useAppStore((state) => state.setGlobalMode);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void (async () => {
      if (!initialized) {
        await initialize();
      }
      await hydrateVault();
      setHasLoadedApp(true);
    })();
  }, [hydrateVault, initialize, initialized, setHasLoadedApp]);

  useEffect(() => {
    if (unlockedVault) {
      setGlobalMode('kosh');
    } else if (globalMode === 'kosh') {
      setGlobalMode('warm');
    }
  }, [globalMode, setGlobalMode, unlockedVault]);

  return (
    <AppScreen>
      <View className="flex-1 px-[10%] pt-10 pb-xl justify-center">
        {/* Top Section: 3x2 Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-[15px] mb-8">
          {categories.slice(0, 6).map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => router.push({ pathname: '/category/[id]' as never, params: { id: cat.id } })}
              className="w-[30%] aspect-square bg-glass07 rounded-[20px] items-center justify-center active:bg-glass10"
            >
              <MaterialIcons name={cat.icon as any} size={36} color={colors.textPrimary} />
            </Pressable>
          ))}
        </View>

        {/* Middle Section: Search Bar */}
        <View className="bg-glass07 rounded-[14px] px-4 py-3.5 mb-[15px] justify-center">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push({ pathname: '/explorer' as never, params: { q: searchQuery.trim() } });
              }
            }}
            placeholder="search bar"
            placeholderTextColor={colors.textTertiary}
            className="text-textPrimary text-[17px] text-center p-0"
            returnKeyType="search"
          />
        </View>

        {/* Storage Buttons */}
        <View className="gap-y-[15px] mb-10">
          <Pressable
            onPress={() => router.push('/explorer')}
            className="bg-glass07 rounded-[14px] py-[18px] items-center active:bg-glass10"
          >
            <Text className="text-textPrimary text-[18px]">internal storage</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/explorer')}
            className="bg-glass07 rounded-[14px] py-[18px] items-center active:bg-glass10"
          >
            <Text className="text-textPrimary text-[18px]">sd card</Text>
          </Pressable>
        </View>

        {/* Bottom Section: 3 small blocks */}
        <View className="flex-row justify-center gap-x-[15px] mb-12">
          <Pressable onPress={() => router.push('/settings')} className="w-[50px] h-[50px] bg-glass07 rounded-[14px] active:bg-glass10 items-center justify-center">
             <MaterialIcons name="settings" size={24} color={colors.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push('/analytics')} className="w-[50px] h-[50px] bg-glass07 rounded-[14px] active:bg-glass10 items-center justify-center">
             <MaterialIcons name="analytics" size={24} color={colors.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/vault')} className="w-[50px] h-[50px] bg-glass07 rounded-[14px] active:bg-glass10 items-center justify-center">
             <MaterialIcons name="lock" size={24} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Floating Action Button */}
        <View className="items-center">
          <Pressable 
            className="w-[60px] h-[60px] rounded-full border border-[rgba(255,255,255,0.1)] bg-glass07 items-center justify-center active:bg-glass10"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/explorer');
            }}
          >
            <MaterialIcons name="add" size={30} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}
