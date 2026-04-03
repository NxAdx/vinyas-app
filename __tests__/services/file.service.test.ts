import { FileService } from '../../src/services/file.service';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-file-system');
jest.mock('expo-media-library');

describe('FileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null if no SAF URI is saved', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    const uri = await FileService.getSavedUri();
    expect(uri).toBeNull();
  });

  it('should return saved URI if file exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('content://sdcard/test');
    const uri = await FileService.getSavedUri();
    expect(uri).toBe('content://sdcard/test');
  });

  it('should detect volume connectivity based on SAF URI existence', async () => {
    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: true }) // for getSavedUri check (saf_uri.txt)
      .mockResolvedValueOnce({ exists: true }); // for the volume check itself
    
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('content://sdcard/test');
    
    const isConnected = await FileService.checkVolumeConnectivity();
    expect(isConnected).toBe(true);
  });
});
