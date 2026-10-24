import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';
import type { ConditionStatus, ReportKind } from '@/types';

export const STATUS_TONE: Record<ConditionStatus, { bg: string; fg: string }> = {
  active: { bg: colors.dangerSoft, fg: colors.danger },
  managed: { bg: colors.butter, fg: colors.butterInk },
  resolved: { bg: colors.mint, fg: colors.mintInk },
};

export const REPORT_ICON: Record<ReportKind, ComponentProps<typeof Ionicons>['name']> = {
  lab: 'flask-outline',
  xray: 'scan-outline',
  prescription: 'document-text-outline',
  vaccine_card: 'card-outline',
  invoice: 'receipt-outline',
  other: 'document-outline',
};
