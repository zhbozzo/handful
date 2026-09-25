import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';

export type PickedPhoto = { uri: string; width: number; height: number; hasGPS: boolean };

const gpsIn = (exif: Record<string, unknown> | null | undefined) =>
  !!exif && (!!exif['{GPS}'] || 'GPSLatitude' in exif || 'GPSLongitude' in exif);

function toPicked(result: ImagePicker.ImagePickerResult): PickedPhoto | null {
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, width: a.width, height: a.height, hasGPS: gpsIn(a.exif as Record<string, unknown> | null) };
}

export async function pickFromLibrary(): Promise<PickedPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: true });
  return toPicked(result);
}

export const cameraAvailable = () => Device.isDevice;

export async function takePhoto(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 1, exif: true });
  return toPicked(result);
}
