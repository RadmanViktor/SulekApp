import { Platform } from 'react-native';
import Constants from 'expo-constants';

const LOCALHOST_URL = 'http://localhost:5026';
const DEVICE_URL = 'http://192.168.68.102:5026';

/**
 * Auto-detects if running on simulator or real device and returns appropriate API base URL
 * - iOS Simulator/Android Emulator: Uses localhost (http://localhost:5026)
 * - Real devices: Uses local network IP (http://192.168.68.106:5026)
 * @returns API base URL string
 */
export const getApiBaseUrl = (): string => {
  // Try multiple detection methods
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const hostname = Constants.expoConfig?.hostUri?.split(':')[0];

  if (Constants.deviceName === 'iPhone 17 Pro') {
    return LOCALHOST_URL;
  }

  // If running in Expo Go on a phone, hostname will be your computer's IP
  if (isExpoGo && hostname && hostname !== 'localhost') {
    return DEVICE_URL;
  }

  return LOCALHOST_URL;
};

/**
 * Get the device URL for manual override when needed
 * @returns Device URL string
 */
export const getDeviceUrl = (): string => DEVICE_URL;

/**
 * Get the localhost URL for manual override when needed
 * @returns Localhost URL string
 */
export const getLocalhostUrl = (): string => LOCALHOST_URL;


