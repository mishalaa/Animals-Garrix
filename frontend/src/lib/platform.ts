import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

import { showDialog } from '@/components/common/DialogHost';
import type { PickedFile } from '@/types';

/** Yes/no confirmation: in-app dialog on web, native Alert on mobile. */
export function confirm(message: string, okLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') return showDialog({ message, okLabel, cancelLabel, destructive: true });
  return new Promise((resolve) =>
    Alert.alert('', message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** Information message with a single OK button. */
export function notify(message: string) {
  if (Platform.OS === 'web') void showDialog({ message, okLabel: 'OK' });
  else Alert.alert('', message);
}

export async function pickImage(): Promise<PickedFile | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.fileName ?? `photo-${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg' };
}

export async function pickDocument(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? null };
}

/** Open a stored file. Data URLs (demo mode on web) are opened as blobs, since browsers block them as links. */
export async function openFile(url: string) {
  if (Platform.OS === 'web') {
    if (url.startsWith('data:')) {
      const blob = await (await fetch(url)).blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } else {
      window.open(url, '_blank');
    }
    return;
  }
  await Linking.openURL(url);
}
