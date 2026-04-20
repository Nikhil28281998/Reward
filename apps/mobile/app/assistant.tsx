import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { moderateScale, wp } from '../lib/responsive';
import { api } from '../lib/api';
import { useUIStore } from '../lib/store';
import { useCards } from '../hooks/useCards';
import { AIAvatar } from '../components/ui/AIAvatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followUps?: string[];
}

const SUGGESTION_CHIPS = [
  'Best card for dining tonight?',
  'Which card for $500 at Costco?',
  'How do I redeem my points for travel?',
  'Am I missing a signup bonus?',
  'Compare my reward rates',
];

export default function AssistantScreen() {
  useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { cards } = useCards();
  const { assistantThreadId, setAssistantThreadId } = useUIStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi — I'm Labhly, your AI rewards strategist.\n\nI can see your wallet, your recent spend, and every card's earn rates. Ask me anything about points, cashback, or travel redemptions.",
      followUps: SUGGESTION_CHIPS.slice(0, 3),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);

      setTimeout(scrollToBottom, 50);

      try {
        const cardIds = (cards ?? []).map((c) => c.id);
        const res = await api.assistant.query({
          message: trimmed,
          threadId: assistantThreadId ?? undefined,
          cardAccountIds: cardIds,
        });

        const data = (res.data ?? {}) as {
          answer?: string;
          threadId?: string;
          suggestedFollowUps?: string[];
        };
        if (data.threadId) setAssistantThreadId(data.threadId);

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer ?? 'I could not produce an answer just now. Try rephrasing?',
          followUps: data.suggestedFollowUps ?? [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              (err instanceof Error ? err.message : "I'm having trouble connecting right now.") +
              ' Please try again in a moment.',
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    },
    [assistantThreadId, cards, isLoading, scrollToBottom, setAssistantThreadId],
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={styles.avatarWrap}>
            <AIAvatar size="sm" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            { maxWidth: wp(74) },
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { fontSize: moderateScale(15) },
              isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
            ]}
          >
            {item.content}
          </Text>

          {!isUser && item.followUps && item.followUps.length > 0 && (
            <View style={styles.followUps}>
              {item.followUps.map((fu, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.followUpChip, { opacity: pressed ? 0.75 : 1 }]}
                  onPress={() => void sendMessage(fu)}
                >
                  <Text style={[styles.followUpText, { fontSize: moderateScale(12) }]}>{fu}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AIAvatar size="md" withGlow />
          <View style={styles.headerTextGroup}>
            <Text style={[styles.headerTitle, { fontSize: moderateScale(17) }]}>Labhly AI</Text>
            <Text style={[styles.headerSub, { fontSize: moderateScale(11) }]}>
              Reading {cards?.length ?? 0} card{cards?.length === 1 ? '' : 's'} · live
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing['2'], alignItems: 'center' }}>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/best-card')}
            style={({ pressed }) => [styles.ctaPill, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.ctaPillText, { fontSize: moderateScale(11) }]}>⚡ Best card</Text>
          </Pressable>
          {assistantThreadId && (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setMessages([{
                  id: '0',
                  role: 'assistant',
                  content: 'Starting a new conversation. What would you like to optimize today?',
                  followUps: SUGGESTION_CHIPS.slice(0, 3),
                }]);
                setAssistantThreadId(null);
              }}
            >
              <Text style={[styles.newThread, { fontSize: moderateScale(12) }]}>New</Text>
            </Pressable>
          )}
          <Pressable
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>

      {messages.length === 1 && (
        <View style={styles.chips}>
          {SUGGESTION_CHIPS.map((chip, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => void sendMessage(chip)}
            >
              <Text style={[styles.chipText, { fontSize: moderateScale(12) }]}>{chip}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom + 10}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.typingIndicator}>
                <AIAvatar size="sm" />
                <View style={[styles.bubble, styles.bubbleAssistant, { paddingVertical: Spacing['3'] }]}>
                  <ActivityIndicator size="small" color={Colors.primaryLight} />
                </View>
              </View>
            ) : null
          }
        />

        <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing['3'] }]}>
          <TextInput
            style={[styles.input, { fontSize: moderateScale(15), flex: 1 }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your wallet…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={() => void sendMessage(inputText)}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              { opacity: (!inputText.trim() || isLoading) ? 0.4 : pressed ? 0.8 : 1 },
            ]}
            onPress={() => void sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.sendIcon, { fontSize: moderateScale(18) }]}>↑</Text>
          </Pressable>
        </View>

        <Text style={[styles.disclaimer, { fontSize: moderateScale(10) }]}>
          AI rewards guidance only. Not financial or investment advice.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] },
  headerTextGroup: {},
  headerTitle: { color: Colors.text, fontWeight: Typography.weight.bold, letterSpacing: -0.2 },
  headerSub: { color: Colors.accentLight, marginTop: 1, fontWeight: Typography.weight.medium },
  ctaPill: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderWidth: 1, borderColor: 'rgba(129,140,248,0.35)' },
  ctaPillText: { color: Colors.primaryLight, fontWeight: Typography.weight.semibold },
  newThread: { color: Colors.textMuted, paddingHorizontal: Spacing['2'], paddingVertical: Spacing['2'] },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  closeBtnText: { color: Colors.text, fontSize: 16, lineHeight: 16, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'], paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'] },
  chip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderWidth: 1, borderColor: Colors.border },
  chipText: { color: Colors.textSecondary },
  kav: { flex: 1 },
  messageList: { padding: Spacing['4'], gap: Spacing['4'], paddingBottom: Spacing['6'] },
  msgRow: { flexDirection: 'row', gap: Spacing['2'] },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatarWrap: { alignSelf: 'flex-end' },
  bubble: { borderRadius: Radius['2xl'], padding: Spacing['4'] },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },
  bubbleTextAssistant: { color: Colors.text },
  followUps: { marginTop: Spacing['3'], gap: Spacing['2'] },
  followUpChip: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'] },
  followUpText: { color: Colors.primaryLight },
  typingIndicator: { flexDirection: 'row', gap: Spacing['2'], alignItems: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing['3'], paddingHorizontal: Spacing['4'], paddingTop: Spacing['3'], borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.xl, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 44, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sendIcon: { color: Colors.white, fontWeight: Typography.weight.bold },
  disclaimer: { textAlign: 'center', color: Colors.textMuted, paddingVertical: Spacing['2'], paddingHorizontal: Spacing['4'] },
});
