import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}

export function StarRating({ value, onChange, size = 24, label }: StarRatingProps) {
  const interactive = Boolean(onChange);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            disabled={!interactive}
            onPress={() => onChange?.(star)}
            style={styles.star}
          >
            <FontAwesome
              name={star <= value ? 'star' : 'star-o'}
              size={size}
              color={star <= value ? '#f59e0b' : '#d1d5db'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  row: { flexDirection: 'row', gap: 4 },
  star: { padding: 2 },
});
