import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button, Row, T } from '@/components/ui';
import { colors, radius, shadow, space } from '@/theme';

/**
 * In-app dialog used on the web instead of window.confirm / window.alert,
 * which look out of place and are blocked inside some embedded viewers.
 * Mount <DialogHost /> once at the root; call showDialog() from anywhere.
 */

interface DialogRequest {
  message: string;
  okLabel: string;
  cancelLabel?: string; // omitted = information only (single button)
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

let current: DialogRequest | null = null;
const listeners = new Set<(d: DialogRequest | null) => void>();

function set(d: DialogRequest | null) {
  current = d;
  listeners.forEach((l) => l(d));
}

export function showDialog(opts: Omit<DialogRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    current?.resolve(false); // a new dialog dismisses any open one
    set({ ...opts, resolve });
  });
}

export function DialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(current);

  useEffect(() => {
    listeners.add(setDialog);
    return () => {
      listeners.delete(setDialog);
    };
  }, []);

  const close = (ok: boolean) => {
    dialog?.resolve(ok);
    set(null);
  };

  return (
    <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable
        accessibilityLabel={dialog?.cancelLabel ?? dialog?.okLabel}
        onPress={() => close(false)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(43, 36, 34, 0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.xl,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={[
            {
              width: '100%',
              maxWidth: 380,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: space.xl,
              gap: space.xl,
            },
            shadow,
          ]}
        >
          <T size={16}>{dialog?.message ?? ''}</T>
          <Row gap={space.sm}>
            {dialog?.cancelLabel ? (
              <View style={{ flex: 1 }}>
                <Button title={dialog.cancelLabel} variant="light" small onPress={() => close(false)} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button
                title={dialog?.okLabel ?? 'OK'}
                variant={dialog?.destructive ? 'danger' : 'dark'}
                small
                onPress={() => close(true)}
              />
            </View>
          </Row>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
