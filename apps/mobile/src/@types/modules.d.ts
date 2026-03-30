// Type stubs for React Native modules that aren't installed in monorepo root.
// These will be replaced by actual types when running `npm install` inside apps/mobile.

declare module '@react-navigation/native' {
  export const NavigationContainer: React.ComponentType<{ children: React.ReactNode }>;
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator(): {
    Navigator: React.ComponentType<{ screenOptions?: Record<string, unknown>; children: React.ReactNode }>;
    Screen: React.ComponentType<{ name: string; component: React.ComponentType; options?: Record<string, unknown> }>;
  };
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): {
    Navigator: React.ComponentType<{ screenOptions?: Record<string, unknown>; children: React.ReactNode }>;
    Screen: React.ComponentType<{ name: string; component: React.ComponentType; options?: Record<string, unknown> }>;
  };
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: React.ComponentType<{ children: React.ReactNode }>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'react-native-geolocation-service' {
  interface Position {
    coords: { latitude: number; longitude: number; accuracy: number };
    mocked?: boolean;
  }
  interface GeoOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
  const Geolocation: {
    getCurrentPosition(
      success: (position: Position) => void,
      error: (error: { message: string; code: number }) => void,
      options?: GeoOptions,
    ): void;
  };
  export default Geolocation;
}

declare module 'react-native-wifi-reborn' {
  const WifiManager: {
    getBSSID(): Promise<string>;
  };
  export default WifiManager;
}

declare module 'react-native-device-info' {
  const DeviceInfo: {
    getUniqueId(): Promise<string>;
  };
  export default DeviceInfo;
}

declare const __DEV__: boolean;
