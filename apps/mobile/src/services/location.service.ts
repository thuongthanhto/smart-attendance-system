import Geolocation from 'react-native-geolocation-service';
import WifiManager from 'react-native-wifi-reborn';
import DeviceInfo from 'react-native-device-info';
import { Platform, PermissionsAndroid } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  bssid?: string;
  deviceId: string;
  isFromMockProvider?: boolean;
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Quyền truy cập vị trí',
      message: 'Ứng dụng cần quyền truy cập vị trí để chấm công',
      buttonPositive: 'Cho phép',
      buttonNegative: 'Từ chối',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function getGpsPosition(): Promise<{
  latitude: number;
  longitude: number;
  isFromMockProvider: boolean;
}> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          isFromMockProvider: position.mocked ?? false,
        });
      },
      (error) => reject(new Error(`GPS error: ${error.message}`)),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  });
}

async function getCurrentBssid(): Promise<string | undefined> {
  try {
    const bssid = await WifiManager.getBSSID();
    // "02:00:00:00:00:00" = unknown/unavailable on some devices
    if (bssid && bssid !== '02:00:00:00:00:00') {
      return bssid.toUpperCase();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Acquire GPS + WiFi BSSID + Device ID simultaneously.
 * This is the main function called before check-in.
 */
export async function acquireLocationData(): Promise<LocationData> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Cần quyền truy cập vị trí để chấm công');
  }

  // Run GPS and WiFi acquisition in parallel
  const [gps, bssid, deviceId] = await Promise.all([
    getGpsPosition(),
    getCurrentBssid(),
    DeviceInfo.getUniqueId(),
  ]);

  return {
    latitude: gps.latitude,
    longitude: gps.longitude,
    bssid,
    deviceId,
    isFromMockProvider: gps.isFromMockProvider,
  };
}

export async function getDeviceId(): Promise<string> {
  return DeviceInfo.getUniqueId();
}
