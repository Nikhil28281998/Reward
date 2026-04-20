import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches render-time errors anywhere below it and shows a recoverable fallback
 * instead of a blank screen. Especially important on web where a single bad
 * render kills the whole React tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[Labhly] Render error:', error, info);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.emoji}>ðŸ›Ÿ</Text>
        <Text style={styles.title}>Something went sideways</Text>
        <Text style={styles.message}>
          {this.state.error.message || 'Unexpected error'}
        </Text>
        <Pressable style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['8'],
  },
  emoji: { fontSize: 56, marginBottom: Spacing['4'] },
  title: {
    color: Colors.text,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing['2'],
  },
  message: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginBottom: Spacing['6'],
    maxWidth: 360,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['6'],
    borderRadius: Radius.lg,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.base,
  },
});
