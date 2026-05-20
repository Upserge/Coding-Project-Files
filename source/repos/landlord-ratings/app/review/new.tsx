import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
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
import { Button } from '@/src/components/ui/Button';
import {
  CATEGORY_LABELS,
  MIN_REVIEW_LENGTH,
  PROHIBITED_TAG_PATTERNS,
  SUGGESTED_TAGS,
} from '@/src/constants/reviewCategories';
import { useAuth } from '@/src/context/AuthContext';
import { createLandlord, findLandlordByName } from '@/src/services/landlords';
import { getPlaceDetails } from '@/src/services/places';
import { findPropertyByPlaceId, getProperty, upsertProperty } from '@/src/services/properties';
import { useAddressSearch } from '@/src/hooks/useAddressSearch';
import {
  createReview,
  userHasReviewForProperty,
  waitForReviewModeration,
} from '@/src/services/reviews';
import { useTheme } from '@/src/theme/ThemeContext';
import { HeaderBackButton } from '@/src/components/navigation/HeaderBackButton';
import {
  optimisticallyApplyReview,
  seedReviewInCache,
  syncPropertyStatsFromReviews,
} from '@/src/utils/propertyCache';
import type { CategoryScores, LandlordType, Property } from '@/src/types';
import { REVIEW_CATEGORIES } from '@/src/types';

const categorySchema = z.object({
  overall: z.number(),
  responsiveness: z.number(),
  maintenance: z.number(),
  safety: z.number(),
  value: z.number(),
  leaseFairness: z.number(),
});

const reviewSchema = z
  .object({
    moveIn: z.string().min(4, 'Enter move-in date (YYYY-MM)'),
    moveOut: z.string().optional(),
    isCurrent: z.boolean(),
    landlordName: z.string().min(2, 'Landlord name is required'),
    landlordType: z.enum(['individual', 'company', 'property_manager']),
    body: z.string().min(MIN_REVIEW_LENGTH, `Review must be at least ${MIN_REVIEW_LENGTH} characters`),
    tags: z.array(z.string()),
    categories: categorySchema,
  })
  .superRefine((data, ctx) => {
    for (const key of REVIEW_CATEGORIES) {
      const score = data.categories[key];
      if (score < 1 || score > 5) {
        ctx.addIssue({
          code: 'custom',
          message: `Please rate: ${CATEGORY_LABELS[key]}`,
          path: ['categories', key],
        });
      }
    }
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

function firstErrorMessage(errors: FieldErrors<ReviewFormValues>): string {
  const walk = (err: unknown): string | undefined => {
    if (!err || typeof err !== 'object') return undefined;
    if ('message' in err && typeof (err as { message?: string }).message === 'string') {
      return (err as { message: string }).message;
    }
    for (const value of Object.values(err as Record<string, unknown>)) {
      const nested = walk(value);
      if (nested) return nested;
    }
    return undefined;
  };
  return walk(errors) ?? 'Please complete all required fields.';
}

export default function NewReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    propertyId: initialPropertyId,
    placeId: initialPlaceId,
    prefilledAddress,
  } = useLocalSearchParams<{
    propertyId?: string;
    placeId?: string;
    prefilledAddress?: string;
  }>();

  const [addressQuery, setAddressQuery] = useState(prefilledAddress ?? '');
  const [pendingPlace, setPendingPlace] = useState<{
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const { suggestions } = useAddressSearch(addressQuery, property?.formattedAddress);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
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
        setPendingPlace(null);
      }
    });
  }, [initialPropertyId]);

  useEffect(() => {
    if (initialPropertyId || !initialPlaceId) return;
    getPlaceDetails(initialPlaceId).then((details) => {
      if (!details) return;
      setPendingPlace({
        placeId: initialPlaceId,
        formattedAddress: details.formattedAddress,
        latitude: details.latitude,
        longitude: details.longitude,
      });
      if (!prefilledAddress) setAddressQuery(details.formattedAddress);
    });
  }, [initialPlaceId, initialPropertyId, prefilledAddress]);

  async function selectPlace(placeId: string, description: string) {
    setAddressQuery(description);
    const details = await getPlaceDetails(placeId);
    if (!details) {
      Alert.alert('Error', 'Could not load address details.');
      return;
    }

    const existing = await findPropertyByPlaceId(placeId);
    if (existing) {
      setProperty(existing);
      setPendingPlace(null);
      return;
    }

    setProperty(null);
    setPendingPlace({
      placeId,
      formattedAddress: details.formattedAddress,
      latitude: details.latitude,
      longitude: details.longitude,
    });
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

  const onValidSubmit = async (values: ReviewFormValues) => {
    let activeProperty = property;
    if (!activeProperty && pendingPlace) {
      activeProperty = await upsertProperty({
        placeId: pendingPlace.placeId,
        formattedAddress: pendingPlace.formattedAddress,
        latitude: pendingPlace.latitude,
        longitude: pendingPlace.longitude,
      });
      setProperty(activeProperty);
      setPendingPlace(null);
    }

    if (!activeProperty) {
      Alert.alert('Property required', 'Select an address from the suggestions list.');
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to submit a review.');
      router.push('/(auth)/login');
      return;
    }

    const hasReview = await userHasReviewForProperty(user.uid, activeProperty.id);
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

      const reviewOverall = values.categories.overall;

      optimisticallyApplyReview(queryClient, activeProperty, reviewOverall);

      const pending = await createReview({
        propertyId: activeProperty.id,
        landlordId: landlord.id,
        moveIn: values.moveIn,
        moveOut: values.isCurrent ? undefined : values.moveOut,
        isCurrent: values.isCurrent,
        categories: values.categories as CategoryScores,
        body: values.body,
        tags: selectedTags,
      });

      const review = await waitForReviewModeration(pending.id);

      seedReviewInCache(queryClient, activeProperty.id, review);
      await syncPropertyStatsFromReviews(queryClient, activeProperty.id);

      await queryClient.invalidateQueries({ queryKey: ['my-reviews'] });

      const propertyId = activeProperty.id;
      Alert.alert('Review published', 'Thank you for helping other renters!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canDismiss()) {
              router.dismiss();
            }
            router.push(`/property/${propertyId}`);
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Could not submit', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<ReviewFormValues>) => {
    Alert.alert('Incomplete review', firstErrorMessage(formErrors));
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Write a review</Text>

        <Text style={[styles.label, { color: theme.colors.text }]}>Property address</Text>
        <TextInput
          style={inputStyle}
          placeholder="Start typing, then pick a suggestion"
          placeholderTextColor={theme.colors.textSecondary}
          value={addressQuery}
          onChangeText={(t) => {
            setAddressQuery(t);
            setProperty(null);
            setPendingPlace(null);
          }}
        />
        {suggestions.length > 0 ? (
          <View style={[styles.suggestions, { borderColor: theme.colors.border }]}>
            {suggestions.map((s) => (
              <Pressable
                key={s.placeId}
                style={[styles.suggestion, { borderBottomColor: theme.colors.border }]}
                onPress={() => selectPlace(s.placeId, s.description)}
              >
                <Text style={{ color: theme.colors.text }}>{s.description}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {property || pendingPlace ? (
          <Text style={[styles.selected, { color: theme.colors.primary }]}>
            Selected: {(property ?? pendingPlace)!.formattedAddress}
          </Text>
        ) : (
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            Tap a suggested address to continue.
          </Text>
        )}

        <Text style={[styles.label, { color: theme.colors.text }]}>Landlord / management</Text>
        <Controller
          control={control}
          name="landlordName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={inputStyle}
              placeholder="Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.landlordName ? (
          <Text style={[styles.error, { color: theme.colors.danger }]}>{errors.landlordName.message}</Text>
        ) : null}

        <View style={styles.typeRow}>
          {(['individual', 'company', 'property_manager'] as LandlordType[]).map((t) => (
            <Controller
              key={t}
              control={control}
              name="landlordType"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  style={[
                    styles.typeChip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: value === t ? theme.colors.primary : theme.colors.surfaceMuted,
                    },
                  ]}
                  onPress={() => onChange(t)}
                >
                  <Text
                    style={{
                      color: value === t ? theme.colors.textOnPrimary : theme.colors.text,
                      fontSize: 12,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t.replace('_', ' ')}
                  </Text>
                </Pressable>
              )}
            />
          ))}
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Tenure</Text>
        <Controller
          control={control}
          name="moveIn"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={inputStyle}
              placeholder="Move-in (YYYY-MM)"
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <View style={styles.switchRow}>
          <Text style={{ color: theme.colors.text }}>Currently living here</Text>
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
              <TextInput
                style={inputStyle}
                placeholder="Move-out (YYYY-MM)"
                placeholderTextColor={theme.colors.textSecondary}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        ) : null}

        <Text style={[styles.section, { color: theme.colors.text }]}>Category ratings</Text>
        {errors.categories ? (
          <Text style={[styles.error, { color: theme.colors.danger }]}>
            Please rate every category (1–5 stars).
          </Text>
        ) : null}
        {REVIEW_CATEGORIES.map((key) => (
          <StarRating
            key={key}
            label={CATEGORY_LABELS[key]}
            value={categories[key]}
            onChange={(v) =>
              setValue(`categories.${key}`, v, { shouldValidate: true, shouldDirty: true })
            }
          />
        ))}

        <Text style={[styles.label, { color: theme.colors.text }]}>Written review</Text>
        <Controller
          control={control}
          name="body"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[...inputStyle, styles.textArea]}
              placeholder={`Share your experience (min ${MIN_REVIEW_LENGTH} characters)`}
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={onChange}
              multiline
            />
          )}
        />
        {errors.body ? (
          <Text style={[styles.error, { color: theme.colors.danger }]}>{errors.body.message}</Text>
        ) : null}

        <Text style={[styles.label, { color: theme.colors.text }]}>Tags (optional)</Text>
        <View style={styles.tags}>
          {SUGGESTED_TAGS.map((tag) => (
            <Pressable
              key={tag}
              style={[
                styles.tagChip,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: selectedTags.includes(tag)
                    ? theme.colors.primary
                    : theme.colors.surfaceMuted,
                },
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={{
                  color: selectedTags.includes(tag) ? theme.colors.textOnPrimary : theme.colors.text,
                  fontSize: 12,
                }}
              >
                #{tag}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          label={submitting ? 'Submitting…' : 'Submit review'}
          onPress={handleSubmit(onValidSubmit, onInvalidSubmit)}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 4 },
  hint: { fontSize: 13 },
  error: { fontSize: 13, marginTop: -4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  suggestions: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  suggestion: { padding: 12, borderBottomWidth: 1 },
  selected: { fontSize: 13, fontWeight: '600' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
});
