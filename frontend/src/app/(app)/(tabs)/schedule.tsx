/**
 * Schedule screen — calendar + vaccine card + reminders.
 *
 * Animations:
 *  • Month transition: calendar slides left/right when switching months
 *  • Day select: smooth spring scale bounce on the selected day cell
 *  • Vaccine cards: staggered spring entrance from below
 *  • Section stagger: each section fades + slides up on mount
 *  • Dose list: each item fades in with index stagger
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoseItem } from '@/components/schedule/DoseItem';
import { EmptyState, Loading, T } from '@/components/ui';
import { usePets, useRecords } from '@/hooks/queries';
import { addDays, addMonths, localeTag, parseISODate, startOfDay, today, toISODate } from '@/lib/dates';
import { buildAgenda, dosesBetween } from '@/lib/schedule';
import { shadow, shadowLg } from '@/theme';

// Warm palette
const CREAM = '#F5EDD8';
const AMBER = '#E8793A';
const AMBER_DARK = '#C45E20';
const AMBER_SOFT = '#FAD9B8';
const CARD_BG = '#FFFDF8';
const INK = '#2C1E0F';
const INK_SOFT = '#7A6245';

// Vaccine card accent colours (one per vaccine kind, cycling)
const VAX_PALETTES = [
  { bg: '#E8D4F4', fg: '#5C2080', stripe: '#C4A0E0' },
  { bg: '#D4E8F4', fg: '#1A508C', stripe: '#90C4E0' },
  { bg: '#D4F4E4', fg: '#1A6040', stripe: '#80D4A8' },
  { bg: '#F4E8D4', fg: '#8C4A00', stripe: '#E0B880' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Calendar grid helpers ────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const pets = usePets();
  const meds = useRecords('medicines');
  const logs = useRecords('dose_logs');

  const [calMonth, setCalMonth] = useState(() => {
    const n = today();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<Date>(today());

  // Calendar slide animation (left = -1, right = +1)
  const calSlide = useRef(new Animated.Value(0)).current;
  const calOpacity = useRef(new Animated.Value(1)).current;

  // Section entrance
  const sectionAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sectionAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const todayDate = today();
  const tag = localeTag(i18n.language);

  // Month navigation with slide transition
  const changeMonth = (dir: -1 | 1) => {
    // Slide out
    Animated.parallel([
      Animated.timing(calSlide, {
        toValue: -dir * 40,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(calOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update month
      setCalMonth((c) => {
        const d = addMonths(new Date(c.year, c.month, 1), dir);
        return { year: d.getFullYear(), month: d.getMonth() };
      });
      // Slide in from opposite side
      calSlide.setValue(dir * 40);
      Animated.parallel([
        Animated.spring(calSlide, {
          toValue: 0,
          friction: 16,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(calOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // All doses in the visible month
  const monthStart = useMemo(
    () => new Date(calMonth.year, calMonth.month, 1),
    [calMonth],
  );
  const monthEnd = useMemo(
    () => new Date(calMonth.year, calMonth.month + 1, 0),
    [calMonth],
  );
  const monthDoses = useMemo(
    () =>
      dosesBetween(
        meds.data ?? [],
        logs.data ?? [],
        pets.data ?? [],
        monthStart,
        addDays(monthEnd, 1),
      ),
    [meds.data, logs.data, pets.data, monthStart, monthEnd],
  );

  // Dot map: ISO date → counts
  const dotMap = useMemo(() => {
    const m = new Map<string, { pending: number; done: number }>();
    for (const dose of monthDoses) {
      const key = toISODate(dose.at);
      const v = m.get(key) ?? { pending: 0, done: 0 };
      if (dose.status === 'pending') v.pending++;
      else v.done++;
      m.set(key, v);
    }
    return m;
  }, [monthDoses]);

  // Selected day's doses
  const dayDoses = useMemo(
    () =>
      dosesBetween(
        meds.data ?? [],
        logs.data ?? [],
        pets.data ?? [],
        selectedDay,
        addDays(selectedDay, 1),
      ).filter((d) => d.at < addDays(selectedDay, 1)),
    [meds.data, logs.data, pets.data, selectedDay],
  );

  // Vaccine-only items across all meds for "vaccine passport cards"
  const vaccines = useMemo(
    () =>
      (meds.data ?? []).filter(
        (m) => m.kind === 'vaccine' && m.active && !m.deleted_at,
      ),
    [meds.data],
  );

  // Upcoming reminders (next 7 days) — non-day-specific list
  const agenda = useMemo(
    () => buildAgenda(meds.data ?? [], logs.data ?? [], pets.data ?? []),
    [meds.data, logs.data, pets.data],
  );

  if (pets.isLoading || meds.isLoading) return <Loading />;

  const selectedISO = toISODate(selectedDay);
  const monthLabel = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString(tag, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* ── Page title ── */}
        <Animated.View
          style={{
            opacity: sectionAnim,
            transform: [{ translateY: sectionAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <T size={26} weight="bold" color={INK} style={{ marginBottom: 16 }}>
            Schedule
          </T>
        </Animated.View>

        {/* ── Full Calendar — animated container ── */}
        <Animated.View
          style={[
            styles.calendarCard,
            {
              opacity: Animated.multiply(calOpacity, sectionAnim),
              transform: [{ translateX: calSlide }],
            },
          ]}
        >
          {/* Month nav */}
          <View style={styles.calHeader}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.monthNavBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color={INK} />
            </Pressable>
            <T size={16} weight="bold" color={INK}>
              {monthLabel}
            </T>
            <Pressable onPress={() => changeMonth(1)} style={styles.monthNavBtn} hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color={INK} />
            </Pressable>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <View key={i} style={styles.weekCell}>
                <T size={12} weight="semibold" color={i === 0 || i === 6 ? '#C06030' : INK_SOFT}>
                  {w}
                </T>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.dayGrid}>
            {/* Leading offset blanks */}
            {Array.from({ length: firstDayOfWeek(calMonth.year, calMonth.month) }).map((_, i) => (
              <View key={`blank-${i}`} style={styles.dayCellWrap} />
            ))}
            {/* Days — each with animated press */}
            {Array.from({ length: daysInMonth(calMonth.year, calMonth.month) }).map((_, i) => {
              const dayNum = i + 1;
              const date = new Date(calMonth.year, calMonth.month, dayNum);
              const iso = toISODate(date);
              const isToday = iso === toISODate(todayDate);
              const isSelected = iso === selectedISO;
              const dots = dotMap.get(iso);
              return (
                <AnimatedDayCell
                  key={iso}
                  dayNum={dayNum}
                  isToday={isToday}
                  isSelected={isSelected}
                  dots={dots}
                  onPress={() => setSelectedDay(startOfDay(date))}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* ── Selected day doses ── */}
        <Animated.View
          style={{
            opacity: sectionAnim,
            transform: [{ translateY: sectionAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }}
        >
          <View style={styles.sectionHeader}>
            <T size={16} weight="bold" color={INK}>
              {toISODate(selectedDay) === toISODate(todayDate)
                ? 'Today'
                : selectedDay.toLocaleDateString(tag, { weekday: 'long', day: 'numeric', month: 'short' })}
            </T>
            <View style={[styles.countBadge, dayDoses.length === 0 && { opacity: 0 }]}>
              <T size={11} weight="bold" color={AMBER_DARK}>
                {dayDoses.length}
              </T>
            </View>
          </View>

          {/* Overdue banner */}
          {agenda.overdue.length > 0 && toISODate(selectedDay) === toISODate(todayDate) ? (
            <View style={styles.overdueBanner}>
              <Ionicons name="alert-circle" size={16} color="#B33A24" />
              <T size={13} weight="semibold" color="#B33A24">
                {agenda.overdue.length} overdue — tap items below to log
              </T>
            </View>
          ) : null}

          {dayDoses.length > 0 ? (
            <View style={{ gap: 10, marginBottom: 8 }}>
              {dayDoses.map((d, idx) => (
                <AnimatedListItem key={d.key} index={idx}>
                  <DoseItem dose={d} />
                </AnimatedListItem>
              ))}
            </View>
          ) : (
            <EmptyState icon="calendar-outline" body="Nothing scheduled for this day" />
          )}
        </Animated.View>

        {/* ── Vaccine Passport Cards ── */}
        {vaccines.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <T size={16} weight="bold" color={INK}>
                Vaccine Passport
              </T>
              <MaterialCommunityIcons name="needle" size={18} color={INK_SOFT} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
            >
              {vaccines.map((v, i) => {
                const pal = VAX_PALETTES[i % VAX_PALETTES.length];
                const pet = (pets.data ?? []).find((p) => p.id === v.pet_id);
                const nextDue = parseISODate(v.next_due);
                const isOverdue = nextDue && nextDue < todayDate;
                const daysUntil = nextDue
                  ? Math.ceil((nextDue.getTime() - todayDate.getTime()) / 86400000)
                  : null;

                return (
                  <AnimatedListItem key={v.id} index={i}>
                    <View style={[styles.vaccineCard, { backgroundColor: pal.bg }]}>
                      {/* Decorative stripe */}
                      <View style={[styles.vaccineStripe, { backgroundColor: pal.stripe }]} />
                      {/* Header */}
                      <View style={styles.vaccineTop}>
                        <View style={[styles.vaccineIconCircle, { backgroundColor: pal.fg + '22' }]}>
                          <MaterialCommunityIcons name="needle" size={18} color={pal.fg} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <T size={14} weight="bold" color={INK} numberOfLines={1}>
                            {v.name}
                          </T>
                          <T size={11} color={INK_SOFT} numberOfLines={1}>
                            {pet?.name ?? 'Pet'}
                            {v.dose ? ` · ${v.dose}` : ''}
                          </T>
                        </View>
                      </View>

                      {/* Status */}
                      <View style={styles.vaccineStatus}>
                        <T size={11} weight="semibold" color={INK_SOFT}>
                          Next due
                        </T>
                        <T size={16} weight="bold" color={isOverdue ? '#B33A24' : INK}>
                          {nextDue
                            ? nextDue.toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Not scheduled'}
                        </T>
                        {daysUntil !== null ? (
                          <View
                            style={[
                              styles.daysChip,
                              { backgroundColor: isOverdue ? '#FDECEA' : '#E6F7EF' },
                            ]}
                          >
                            <T size={11} weight="bold" color={isOverdue ? '#B33A24' : '#0E7A4A'}>
                              {isOverdue
                                ? `${Math.abs(daysUntil)}d overdue`
                                : daysUntil === 0
                                ? 'Due today!'
                                : `In ${daysUntil}d`}
                            </T>
                          </View>
                        ) : null}
                      </View>

                      {/* Series progress */}
                      {v.total_doses && v.total_doses > 1 ? (
                        <View style={styles.progressRow}>
                          {Array.from({ length: v.total_doses }).map((_, di) => (
                            <View
                              key={di}
                              style={[
                                styles.progressDot,
                                di < (v.total_doses ?? 0) - 1
                                  ? { backgroundColor: pal.fg }
                                  : { backgroundColor: pal.fg + '44' },
                              ]}
                            />
                          ))}
                          <T size={10} color={INK_SOFT} style={{ marginLeft: 6 }}>
                            series
                          </T>
                        </View>
                      ) : null}
                    </View>
                  </AnimatedListItem>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {/* ── Upcoming reminders ── */}
        {agenda.upcoming.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <T size={16} weight="bold" color={INK}>
                Upcoming
              </T>
              <T size={12} color={INK_SOFT}>
                Next 7 days
              </T>
            </View>
            <View style={{ gap: 10 }}>
              {agenda.upcoming.slice(0, 6).map((d) => (
                <DoseItem key={d.key} dose={d} showDate />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ── Day Cell with soft spring press animation ─────────────────────────────────

function AnimatedDayCell({
  dayNum,
  isToday,
  isSelected,
  dots,
  onPress,
}: {
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
  dots?: { pending: number; done: number };
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.88, friction: 8, tension: 150, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 150, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.dayCellWrap, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.dayCell,
          isToday && styles.dayCellToday,
          isSelected && styles.dayCellSelected,
        ]}
      >
        <T
          size={13}
          weight={isSelected ? 'bold' : isToday ? 'bold' : 'medium'}
          color={isSelected ? '#fff' : isToday ? AMBER : INK}
        >
          {dayNum}
        </T>
        {dots && (dots.pending > 0 || dots.done > 0) ? (
          <View style={styles.dotRow}>
            {dots.pending > 0 && (
              <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : AMBER }]} />
            )}
            {dots.done > 0 && (
              <View style={[styles.dot, { backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#0E7A4A' }]} />
            )}
          </View>
        ) : (
          <View style={{ height: 5 }} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Staggered list item fade-in ───────────────────────────────────────────────

function AnimatedListItem({ children, index }: { children: React.ReactNode; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    }, Math.min(index * 35, 200));

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    paddingHorizontal: 20,
  },

  // Calendar card
  calendarCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDE0C0',
    ...shadow,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EDD8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE0C0',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrap: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: AMBER,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: AMBER,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: AMBER_SOFT,
  },

  // Overdue banner
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F5BFBB',
  },

  // Vaccine cards
  vaccineCard: {
    width: 200,
    borderRadius: 20,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadow,
  },
  vaccineStripe: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: '100%',
    opacity: 0.25,
  },
  vaccineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  vaccineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineStatus: {
    gap: 2,
    marginBottom: 10,
  },
  daysChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
