import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { getDatabase } from '../database/db';
import type { KoshEntry } from '../types';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export const VaultService = {
  
  async isBiometricHardwareAvailable() {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return {
      isAvailable: available,
      type: biometryType
    };
  },

  async authenticateBiometric(): Promise<boolean> {
    const hardware = await this.isBiometricHardwareAvailable();
    
    if (!hardware.isAvailable) {
      throw new Error('Biometric hardware is not available on this device');
    }

    const { success } = await rnBiometrics.simplePrompt({
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
