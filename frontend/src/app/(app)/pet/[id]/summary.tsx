import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { usePetData } from '@/hooks/usePetData';
import { Button, Card, Detail, Header, Loading, PetImage, Row, Screen, T } from '@/components/ui';
import { useOrigin, usePet, useProfile, useRecords } from '@/hooks/queries';
import { ageParts, formatDate, formatNumber } from '@/lib/dates';
import { notify } from '@/lib/platform';
import { summarize, summaryHtml } from '@/lib/summary';
import { colors, radius, space } from '@/theme';

export default function VetSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const profile = useProfile();
  const pet = usePet(id);
  const origin = useOrigin(id);
  const conditions = useRecords('conditions', id);
  const allergies = useRecords('allergies', id);
  const visits = useRecords('visits', id);
  const medicines = useRecords('medicines', id);
  const reports = useRecords('reports', id);
  const [busy, setBusy] = useState(false);

  const data = usePetData({
    pet: pet.data,
    origin: origin.data,
    conditions: conditions.data,
    allergies: allergies.data,
    visits: visits.data,
    medicines: medicines.data,
    reports: reports.data,
  });

  if (!data) return <Loading />;
  const s = summarize(data);
  const p = data.pet;
  const age = ageParts(p.birth_date);
  const html = () => summaryHtml(data, t, lang, profile.data?.full_name);

  const print = async () => {
    try {
      setBusy(true);
      if (Platform.OS === 'web') {
        const w = window.open('', '_blank');
        if (!w) return notify(t('common.error'));
        w.document.write(html());
        w.document.close();
        setTimeout(() => w.print(), 600); // let fonts load
      } else {
        await Print.printAsync({ html: html() });
      }
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    try {
      setBusy(true);
      const { uri } = await Print.printToFileAsync({ html: html(), width: 595, height: 842 });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e) {
      notify(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const list = (items: { key: string; title: string; sub?: string | null }[]) =>
    items.length ? (
      items.map((i) => (
        <View key={i.key} style={{ marginTop: 6 }}>
          <T size={14} weight="medium">
            {i.title}
          </T>
          {i.sub ? (
            <T size={12} color={colors.muted}>
              {i.sub}
            </T>
          ) : null}
        </View>
      ))
    ) : (
      <T size={13} color={colors.muted}>
        {t('summary.none')}
      </T>
    );

  return (
    <Screen>
      <Header title={t('summary.title')} />
      <T size={14} color={colors.muted} center style={{ marginBottom: space.lg }}>
        {t('summary.subtitle')}
      </T>

      <Card>
        <Row gap={space.md}>
          <PetImage pet={p} size={64} rounded={20} />
          <View style={{ flex: 1 }}>
            <T size={20} weight="bold">
              {p.name}
            </T>
            <T size={13} color={colors.muted}>
              {[t(`species.${p.species}`), p.breed, t(`sex.${p.sex}`)].filter(Boolean).join(' · ')}
            </T>
            <T size={13} color={colors.muted}>
              {[
                age
                  ? `${t('pet.years', { count: age.years })} ${t('pet.months', { count: age.months })}`
                  : null,
                p.weight_kg != null ? t('pet.kg', { value: formatNumber(p.weight_kg, lang) }) : null,
                p.neutered ? t('petForm.neutered') : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </T>
          </View>
        </Row>

        <View
          style={{
            marginTop: space.lg,
            backgroundColor: colors.dangerSoft,
            borderRadius: radius.md,
            padding: space.md,
          }}
        >
          <Row gap={6}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <T size={13} weight="semibold" color={colors.danger}>
              {t('pet.allergies')}
            </T>
          </Row>
          <T size={14} style={{ marginTop: 2 }}>
            {data.allergies.length
              ? data.allergies.map((a) => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join('; ')
              : t('pet.noAllergies')}
          </T>
        </View>

        <Detail label={t('petForm.microchip')} value={p.microchip} />

        <SummaryHeading>{t('pet.activeConditions')}</SummaryHeading>
        {list(
          s.activeConditions.map((c) => ({
            key: c.id,
            title: `${c.name} · ${t(`conditionStatus.${c.status}`)}`,
            sub: c.treatment,
          })),
        )}

        <SummaryHeading>{t('pet.currentMeds')}</SummaryHeading>
        {list(
          s.currentMeds.map((m) => ({
            key: m.id,
            title: m.name,
            sub: [m.dose, t(`frequency.${m.frequency}`)].filter(Boolean).join(' · '),
          })),
        )}

        <SummaryHeading>{t('summary.vaccines')}</SummaryHeading>
        {list(
          s.vaccines.map((m) => ({
            key: m.id,
            title: m.name,
            sub: m.next_due ? t('medicine.due', { date: formatDate(m.next_due, lang) }) : t('medicine.ended'),
          })),
        )}

        <SummaryHeading>{t('summary.recentVisits')}</SummaryHeading>
        {list(
          s.recentVisits.map((v) => ({
            key: v.id,
            title: `${formatDate(v.visit_date, lang)} · ${v.reason ?? ''}`,
            sub: [v.diagnosis, v.vet_name, v.clinic].filter(Boolean).join(' · '),
          })),
        )}

        {s.pastConditions.length ? (
          <>
            <SummaryHeading>{t('summary.pastConditions')}</SummaryHeading>
            {list(
              s.pastConditions.map((c) => ({
                key: c.id,
                title: c.name,
                sub: c.diagnosed_on ? formatDate(c.diagnosed_on, lang) : null,
              })),
            )}
          </>
        ) : null}

        <T size={11} color={colors.muted} style={{ marginTop: space.lg }}>
          {t('summary.disclaimer')}
        </T>
      </Card>

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Button title={t('summary.print')} icon="print-outline" onPress={print} loading={busy} />
        {Platform.OS !== 'web' ? (
          <Button
            title={t('summary.share')}
            icon="share-outline"
            variant="light"
            onPress={share}
            disabled={busy}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function SummaryHeading({ children }: { children: string }) {
  return (
    <T
      size={13}
      weight="semibold"
      color={colors.primaryDark}
      style={{ marginTop: space.lg, textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {children}
    </T>
  );
}
