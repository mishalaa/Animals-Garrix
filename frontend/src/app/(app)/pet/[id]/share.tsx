import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Button, Card, ChipGroup, Field, Header, Row, Screen, SectionTitle, T } from '@/components/ui';
import { api } from '@/services';
import { useAuth } from '@/providers/AuthProvider';
import { keys, useMembers, usePet } from '@/hooks/queries';
import { notify } from '@/lib/platform';
import { colors, space } from '@/theme';

export default function SharePet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const pet = usePet(id);
  const members = useMembers(id);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [busy, setBusy] = useState(false);

  const isOwner = members.data?.some((m) => m.user_id === user?.id && m.role === 'owner');
  const demo = api.mode === 'demo';

  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.sharePet(id, email.trim(), role);
      notify(t('share.shared', { email: email.trim() }));
      setEmail('');
      qc.invalidateQueries({ queryKey: keys.members(id) });
    } catch (e) {
      notify(e instanceof Error && e.message !== 'demo-sharing' ? e.message : t('share.demoOnly'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t('share.title', { name: pet.data?.name ?? '' })} />
      <T size={14} color={colors.muted} style={{ marginBottom: space.lg }}>
        {t('share.body')}
      </T>

      {demo ? (
        <Card style={{ backgroundColor: colors.butter, marginBottom: space.lg }}>
          <T size={13} color={colors.butterInk}>
            {t('share.demoOnly')}
          </T>
        </Card>
      ) : null}

      {isOwner || demo ? (
        <Card>
          <Field
            label={t('share.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <ChipGroup
            label={t('share.role')}
            options={[
              { value: 'editor', label: t('share.editor') },
              { value: 'viewer', label: t('share.viewer') },
            ]}
            value={role}
            onChange={(v) => v && setRole(v)}
          />
          <Button
            title={t('share.invite')}
            icon="person-add-outline"
            onPress={invite}
            loading={busy}
            disabled={!email.trim()}
          />
        </Card>
      ) : null}

      <SectionTitle title={t('share.members')} />
      <View style={{ gap: space.sm }}>
        {(members.data ?? []).map((m) => (
          <Card key={m.user_id}>
            <Row gap={space.md}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.peach,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T size={16} weight="semibold" color={colors.primaryDark}>
                  {(m.full_name || m.email || '?').charAt(0).toUpperCase()}
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T size={15} weight="medium" numberOfLines={1}>
                  {m.full_name || m.email}
                </T>
                {m.full_name && m.email ? (
                  <T size={12} color={colors.muted} numberOfLines={1}>
                    {m.email}
                  </T>
                ) : null}
              </View>
              <Badge label={t(`share.${m.role}`)} />
              {isOwner && m.role !== 'owner' ? (
                <Button
                  title={t('share.remove')}
                  small
                  variant="ghost"
                  onPress={async () => {
                    await api.removeMember(id, m.user_id);
                    qc.invalidateQueries({ queryKey: keys.members(id) });
                  }}
                />
              ) : null}
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
