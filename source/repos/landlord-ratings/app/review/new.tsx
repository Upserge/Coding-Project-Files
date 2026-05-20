import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import { StarRating } from '@/src/components/StarRating';
import {
  CATEGORY_LABELS,
  MIN_REVIEW_LENGTH,
  PROHIBITED_TAG_PATTERNS,
  SUGGESTED_TAGS,
} from '@/src/constants/reviewCategories';
import { useAuth } from '@/src/context/AuthContext';
import { createLandlord, findLandlordByName } from '@/src/services/landlords';
import { getPlaceDetails, searchPlaces } from '@/src/services/places';
import { findPropertyByPlaceId, getProperty, upsertProperty } from '@/src/services/properties';
import { createReview, userHasReviewForProperty } from '@/src/services/reviews';
import type { CategoryScores, LandlordType, Property } from '@/src/types';
import { REVIEW_CATEGORIES } from '@/src/types';

const reviewSchema = z.object({
  moveIn: z.string().min(4, 'Move-in date required (YYYY-MM)'),
  moveOut: z.string().optional(),
  isCurrent: z.boolean(),
  landlordName: z.string().min(2, 'Landlord name required'),
  landlordType: z.enum(['individual', 'company', 'property_manager']),
  body: z.string().min(MIN_REVIEW_LENGTH, `Review must be at least ${MIN_REVIEW_LENGTH} characters`),
  tags: z.array(z.string()),
  categories: z.object({
    overall: z.number().min(1).max(5),
    responsiveness: z.number().min(1).max(5),
    maintenance: z.number().min(1).max(5),
    safety: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
    leaseFairness: z.number().min(1).max(5),
  }),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const defaultCategories: CategoryScores = {
  overall: 0,
  responsiveness: 0,
  maintenance: 0,
  safety: 0,
  value: 0,
  leaseFairness: 0,
};

export default function NewReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { propertyId: initialPropertyId } = useLocalSearchParams<{ propertyId?: string }>();

  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    Array<{ placeId: string; description: string }>
  >([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      moveIn: '',
      moveOut: '',
      isCurrent: false,
      landlordName: '',
      landlordType: 'individual',
      body: '',
      tags: [],
      categories: defaultCategories,
    },
  });

  const categories = watch('categories');
  const isCurrent = watch('isCurrent');

  useEffect(() => {
    if (!initialPropertyId) return;
    getProperty(initialPropertyId).then((p) => {
      if (p) {
        setProperty(p);
        setAddressQuery(p.formattedAddress);
      }
    });
  }, [initialPropertyId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (addressQuery.length < 3 || property?.formattedAddress === addressQuery) {
        setSuggestions([]);
        return;
      }
      const results = await searchPlaces(addressQuery);
      setSuggestions(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [addressQuery, property?.formattedAddress]);

  async function selectPlace(placeId: string, description: string) {
    setAddressQuery(description);
    setSuggestions([]);
    const details = await getPlaceDetails(placeId);
    if (!details) {
      Alert.alert('Error', 'Could not load address details.');
      return;
    }

    let existing = await findPropertyByPlaceId(placeId);
    if (!existing) {
      existing = await upsertProperty({
        placeId,
        formattedAddress: details.formattedAddress,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    }
    setProperty(existing);
  }

  function toggleTag(tag: string) {
    if (PROHIBITED_TAG_PATTERNS.some((p) => p.test(tag))) {
      Alert.alert('Tag not allowed', 'Tags cannot reference protected characteristics.');
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!property) {
      Alert.alert('Property required', 'Select an address before submitting.');
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to submit a review.');
      router.push('/(auth)/login');
      return;
    }

    const incomplete = REVIEW_CATEGORIES.some((k) => !values.categories[k]);
    if (incomplete) {
      Alert.alert('Ratings required', 'Please rate every category.');
      return;
    }

    const hasReview = await userHasReviewForProperty(user.uid, property.id);
    if (hasReview) {
      Alert.alert('Already reviewed', 'You have already reviewed this property.');
      return;
    }

    try {
      setSubmitting(true);
      let landlord = await findLandlordByName(values.landlordName);
      if (!landlord) {
        landlord = await createLandlord({
          name: values.landlordName.trim(),
          type: values.landlordType as LandlordType,
        });
      }

      await createReview({
        propertyId: property.id,
        landlordId: landlord.id,
        moveIn: values.moveIn,
        moveOut: values.isCurrent ? undefined : values.moveOut,
        isCurrent: values.isCurrent,
        categories: values.categories as CategoryScores,
        body: values.body,
        tags: selectedTags,
      });

      Alert.alert('Review submitted', 'Thank you for helping other renters!', [
        { text: 'OK', onPress: () => router.replace(`/property/${property.id}`) },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Write a review</Text>

        <Text style={styles.label}>Property address</Text>
        <TextInput
          style={styles.input}
          placeholder="Start typing an address…"
          value={addressQuery}
          onChangeText={(t) => {
            setAddressQuery(t);
            setProperty(null);
          }}
        />
        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Pressable key={s.placeId} style={styles.suggestion} onPress={() => selectPlace(s.placeId, s.description)}>
                <Text>{s.description}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {property ? <Text style={styles.selected}>Selected: {property.formattedAddress}</Text> : null}

        <Text style={styles.label}>Landlord / management</Text>
        <Controller
          control={control}
          name="landlordName"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Name" value={value} onChangeText={onChange} />
          )}
        />
        <View style={styles.typeRow}>
          {(['individual', 'company', 'property_manager'] as LandlordType[]).map((t) => (
            <Controller
              key={t}
              control={control}
              name="landlordType"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  style={[styles.typeChip, value === t && styles.typeChipActive]}
                  onPress={() => onChange(t)}
                >
                  <Text style={[styles.typeText, value === t && styles.typeTextActive]}>
                    {t.replace('_', ' ')}
                  </Text>
                </Pressable>
              )}
            />
          ))}
        </View>

        <Text style={styles.label}>Tenure</Text>
        <Controller
          control={control}
          name="moveIn"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Move-in (YYYY-MM)" value={value} onChangeText={onChange} />
          )}
        />
        <View style={styles.switchRow}>
          <Text>Currently living here</Text>
          <Controller
            control={control}
            name="isCurrent"
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>
        {!isCurrent ? (
          <Controller
            control={control}
            name="moveOut"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} placeholder="Move-out (YYYY-MM)" value={value} onChangeText={onChange} />
            )}
          />
        ) : null}

        <Text style={styles.section}>Category ratings</Text>
        {REVIEW_CATEGORIES.map((key) => (
          <StarRating
            key={key}
            label={CATEGORY_LABELS[key]}
            value={categories[key]}
            onChange={(v) =>
              setValue('categories', { ...categories, [key]: v }, { shouldValidate: true })
            }
          />
        ))}

        <Text style={styles.label}>Written review</Text>
        <Controller
          control={control}
          name="body"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={`Share your experience (min ${MIN_REVIEW_LENGTH} characters)`}
              value={value}
              onChangeText={onChange}
              multiline
            />
          )}
        />

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tags}>
          {SUGGESTED_TAGS.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                #{tag}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.submit} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit review'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#fff', paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  label: { fontWeight: '600', color: '#374151', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  suggestions: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  suggestion: { padding: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  selected: { fontSize: 13, color: '#0f766e' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  typeText: { fontSize: 12, color: '#374151', textTransform: 'capitalize' },
  typeTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  tagText: { fontSize: 12, color: '#374151' },
  tagTextActive: { color: '#fff' },
  submit: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
