import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { moderateScale, wp } from '../../lib/responsive';
import { api } from '../../lib/api';
import { useUIStore } from '../../lib/store';
import { useCards } from '../../hooks/useCards';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followUps?: string[];
}

const SUGGESTION_CHIPS = [
  'Which card for dining out?',
  'Best card for travel?',
  'How to redeem my points?',
  'Compare my rewards rates',
  'What's my best signup bonus?',
];

export default function AssistantScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { cards } = useCards();
  const { assistantThreadId, setAssistantThreadId } = useUIStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi! I'm your Reward AI assistant. Ask me anything about your credit card rewards — which card to use, how to maximize points, or travel redemption strategies.",
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

        if (res.threadId) setAssistantThreadId(res.threadId);

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.answer,
          followUps: res.suggestedFollowUps ?? [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm having trouble connecting right now. Please try again in a moment.",
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
          <View style={styles.avatar}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={{ fontSize: 26 }}>🤖</Text>
          <View style={styles.headerTextGroup}>
            <Text style={[styles.headerTitle, { fontSize: moderateScale(18) }]}>Ask AI</Text>
            <Text style={[styles.headerSub, { fontSize: moderateScale(12) }]}>
              Rewards specialist
            </Text>
          </View>
        </View>
        {assistantThreadId && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setMessages([{
                id: '0',
                role: 'assistant',
                content: 'Starting a new conversation. How can I help?',
                followUps: SUGGESTION_CHIPS.slice(0, 3),
              }]);
              setAssistantThreadId(null);
            }}
          >
            <Text style={[styles.newThread, { fontSize: moderateScale(13) }]}>New chat</Text>
          </Pressable>
        )}
      </View>

      {/* Suggestion chips (only shown when first message) */}
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
                <View style={styles.avatar}>
                  <Text style={{ fontSize: 18 }}>🤖</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleAssistant, { paddingVertical: Spacing['3'] }]}>
                  <ActivityIndicator size="small" color={Colors.textMuted} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing['3'] }]}>
          <TextInput
            style={[styles.input, { fontSize: moderateScale(15), flex: 1 }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your rewards…"
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
            <Text style={[styles.sendIcon, { fontSize: moderateScale(20) }]}>⬆</Text>
          </Pressable>
        </View>

        <Text style={[styles.disclaimer, { fontSize: moderateScale(10) }]}>
          AI for rewards guidance only. Not financial or investment advice.
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
  headerTitle: { color: Colors.text, fontWeight: Typography.weight.bold },
  headerSub: { color: Colors.textMuted },
  newThread: { color: Colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'], paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'] },
  chip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'], borderWidth: 1, borderColor: Colors.border },
  chipText: { color: Colors.textSecondary },
  kav: { flex: 1 },
  messageList: { padding: Spacing['4'], gap: Spacing['4'], paddingBottom: Spacing['4'] },
  msgRow: { flexDirection: 'row', gap: Spacing['2'] },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', borderWidth: 1, borderColor: Colors.border },
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
  sendBtn: { width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: Colors.white },
  disclaimer: { textAlign: 'center', color: Colors.textMuted, paddingVertical: Spacing['2'], paddingHorizontal: Spacing['4'] },
});
