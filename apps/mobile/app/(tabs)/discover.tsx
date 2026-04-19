import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ScrollView,
  useWindowDimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { useRecommendations, useOffers } from '../../hooks/useRecommendations';
import { LoadingPulse } from '../../components/ui/LoadingPulse';
import { EmptyState } from '../../components/ui/EmptyState';
import type { CardRecommendation, Offer } from '@reward/shared';

const TABS = ['Cards', 'Offers'] as const;
type Tab = (typeof TABS)[number];

function RecommendationCard({ rec }: { rec: CardRecommendation }) {
  const gradient = (rec.cardProduct?.gradient ?? ['#5B21B6', '#7C3AED']) as [string, string];

  const handleApply = () => {
    if (rec.referralUrl) void Linking.openURL(rec.referralUrl);
  };

  return (
    <View style={[styles.recCard, { width: wp(80) }]}>
      {/* Card gradient header */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recGradient}
      >
        <View style={styles.recGradientContent}>
          <Text style={[styles.recIssuer, { fontSize: moderateScale(10) }]}>
            {rec.cardProduct.issuer.toUpperCase()}
          </Text>
          <Text style={[styles.recCardName, { fontSize: moderateScale(16) }]}>
            {rec.cardProduct.name}
          </Text>
          {/* Match score chip */}
          <View style={styles.matchBadge}>
            <Text style={[styles.matchText, { fontSize: moderateScale(11) }]}>
              {rec.matchScore}% match
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Details */}
      <View style={styles.recBody}>
        {rec.cardProduct.signupBonus && (
          <View style={styles.bonusRow}>
            <Text style={[styles.bonusLabel, { fontSize: moderateScale(12) }]}>Welcome bonus</Text>
            <Text style={[styles.bonusValue, { fontSize: moderateScale(14) }]}>
              {rec.cardProduct.signupBonus.toLocaleString()} pts
            </Text>
          </View>
        )}

        <View style={styles.valueRow}>
          <Text style={[styles.valueLabel, { fontSize: moderateScale(12) }]}>Est. annual value</Text>
          <Text style={[styles.valueAmount, { fontSize: moderateScale(15) }]}>
            ${rec.estimatedAnnualValue.toLocaleString()}
          </Text>
        </View>

        {/* Reasoning bullets */}
        <View style={styles.reasoning}>
          {rec.reasoning.slice(0, 3).map((r, i) => (
            <Text key={i} style={[styles.reasonBullet, { fontSize: moderateScale(12) }]}>
              • {r}
            </Text>
          ))}
        </View>

        {/* Annual fee */}
        <Text style={[styles.annualFee, { fontSize: moderateScale(11) }]}>
          ${rec.cardProduct.annualFee}/yr annual fee
        </Text>

        {/* Affiliate disclosure */}
        {rec.isSponsored && (
          <Text style={[styles.sponsored, { fontSize: moderateScale(10) }]}>Partner offer</Text>
        )}

        <Pressable
          style={({ pressed }) => [styles.applyBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleApply}
        >
          <Text style={[styles.applyBtnText, { fontSize: moderateScale(14) }]}>
            Learn more ↗
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function OfferItem({ offer }: { offer: Offer }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.offerCard, { opacity: pressed ? 0.88 : 1, width: wp(90) }]}
      onPress={() => offer.activationUrl && void Linking.openURL(offer.activationUrl)}
    >
      <View style={styles.offerLeft}>
        <View style={styles.offerEmoji}>
          <Text style={{ fontSize: 24 }}>🏬</Text>
        </View>
        <View>
          <Text style={[styles.offerMerchant, { fontSize: moderateScale(15) }]}>
            {offer.merchantName}
          </Text>
          <Text style={[styles.offerCategory, { fontSize: moderateScale(12) }]}>
            {offer.merchantCategory}
          </Text>
        </View>
      </View>
      <View style={styles.offerRight}>
        <Text style={[styles.offerValue, { fontSize: moderateScale(18) }]}>{offer.displayValue}</Text>
        {offer.endDate && (
          <Text style={[styles.offerExpiry, { fontSize: moderateScale(11) }]}>
            Ends {new Date(offer.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<Tab>('Cards');
  const { recommendations, isLoading: recsLoading } = useRecommendations();
  const { offers, isLoading: offersLoading } = useOffers();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: moderateScale(26) }]}>Discover</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { marginHorizontal: wp(5) }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { fontSize: moderateScale(14) }, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'Cards' && (
        <View>
          {recsLoading ? (
            <LoadingPulse rows={2} style={{ marginHorizontal: wp(5) }} />
          ) : !recommendations || recommendations.length === 0 ? (
            <EmptyState
              emoji="🃏"
              title="Building your profile"
              body="Add more transactions to get personalized card recommendations"
            />
          ) : (
            <FlatList
              data={recommendations}
              keyExtractor={(r) => r.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recList}
              renderItem={({ item }) => <RecommendationCard rec={item} />}
              snapToInterval={wp(80) + Spacing['4']}
              decelerationRate="fast"
            />
          )}

          <View style={[styles.disclaimerBox, { marginHorizontal: wp(5) }]}>
            <Text style={[styles.disclaimerText, { fontSize: moderateScale(11) }]}>
              ℹ️ Card recommendations may include partner offers that generate revenue.
              All recommendations are ranked by estimated value to you first.
            </Text>
          </View>
        </View>
      )}

      {activeTab === 'Offers' && (
        <FlatList
          data={offers ?? []}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => <OfferItem offer={item} />}
          contentContainerStyle={styles.offerList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            offersLoading ? (
              <LoadingPulse rows={5} style={{ marginHorizontal: wp(5) }} />
            ) : (
              <EmptyState
                emoji="🎁"
                title="No offers yet"
                body="Offers tailored to your cards will appear here"
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing['4'], paddingVertical: Spacing['4'] },
  title: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 4, marginBottom: Spacing['4'], borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: Spacing['2'], alignItems: 'center', borderRadius: Radius.lg },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: Typography.weight.semibold },
  tabTextActive: { color: Colors.white },
  recList: { paddingHorizontal: Spacing['4'], gap: Spacing['4'], paddingBottom: Spacing['4'] },
  recCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  recGradient: { height: 120, padding: Spacing['4'] },
  recGradientContent: { flex: 1, justifyContent: 'space-between' },
  recIssuer: { color: 'rgba(255,255,255,0.6)', fontWeight: Typography.weight.bold, letterSpacing: 1 },
  recCardName: { color: Colors.white, fontWeight: Typography.weight.bold, letterSpacing: -0.3 },
  matchBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: 3, alignSelf: 'flex-start' },
  matchText: { color: Colors.white, fontWeight: Typography.weight.bold },
  recBody: { padding: Spacing['4'], gap: Spacing['2'] },
  bonusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primaryMuted, borderRadius: Radius.md, padding: Spacing['3'] },
  bonusLabel: { color: Colors.textSecondary },
  bonusValue: { color: Colors.primaryLight, fontWeight: Typography.weight.bold },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueLabel: { color: Colors.textMuted },
  valueAmount: { color: Colors.accent, fontWeight: Typography.weight.bold },
  reasoning: { gap: 3 },
  reasonBullet: { color: Colors.textSecondary, lineHeight: 18 },
  annualFee: { color: Colors.textMuted },
  sponsored: { color: Colors.textMuted, fontStyle: 'italic' },
  applyBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing['3'], alignItems: 'center', marginTop: Spacing['2'] },
  applyBtnText: { color: Colors.white, fontWeight: Typography.weight.bold },
  offerList: { paddingHorizontal: wp(5), gap: Spacing['3'], paddingBottom: Spacing['20'] },
  offerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['4'], borderWidth: 1, borderColor: Colors.border },
  offerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], flex: 1 },
  offerEmoji: { width: 44, height: 44, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  offerMerchant: { color: Colors.text, fontWeight: Typography.weight.semibold },
  offerCategory: { color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  offerRight: { alignItems: 'flex-end' },
  offerValue: { color: Colors.accent, fontWeight: Typography.weight.bold },
  offerExpiry: { color: Colors.textMuted, marginTop: 2 },
  disclaimerBox: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing['3'], borderWidth: 1, borderColor: Colors.border, marginTop: Spacing['4'] },
  disclaimerText: { color: Colors.textMuted, lineHeight: 16 },
});
