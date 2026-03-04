import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { getDatabase } from '../database/db';
import type { KoshEntry } from '../types';

let _rnBiometrics: ReactNativeBiometrics | null = null;

function getBiometrics() {
  if (!_rnBiometrics) {
    _rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
  }
  return _rnBiometrics;
}

export const VaultService = {

  async isBiometricHardwareAvailable() {
    try {
      const bio = getBiometrics();
      const { available, biometryType } = await bio.isSensorAvailable();
      return {
        isAvailable: available,
        type: biometryType
      };
    } catch (e) {
      console.warn("Biometrics missing or incompatible:", e);
      return { isAvailable: false, type: undefined };
    }
  },

  async authenticateBiometric(): Promise<boolean> {
    const hardware = await this.isBiometricHardwareAvailable();

    if (!hardware.isAvailable) {
      throw new Error('Biometric hardware is not available on this device');
    }

    const bio = getBiometrics();
    const { success } = await bio.simplePrompt({
      promptMessage: 'Unlock Kosh Vault',
      cancelButtonText: 'Cancel',
    });

    return success;
  },

  async setupPasscode(passcode: string): Promise<void> {
    // Store securely in keychain
    await Keychain.setGenericPassword('vinyas_user', passcode, {
      service: 'vinyas_vault_credentials'
    });
  },

  async verifyPasscode(passcode: string): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword({
      service: 'vinyas_vault_credentials'
    });

    if (credentials) {
      return credentials.password === passcode;
    }
    return false;
  },

  async isVaultConfigured(): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword({
      service: 'vinyas_vault_credentials'
    });
    return !!credentials;
  },

  // Mocked for now until AES GCM module is added
  async getEncryptedEntries(): Promise<KoshEntry[]> {
    const db = await getDatabase();
    return db.getAllAsync<KoshEntry>('SELECT * FROM kosh_entries ORDER BY created_at DESC');
  }
};
