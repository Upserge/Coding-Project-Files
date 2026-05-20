import { ScrollView, StyleSheet, Text } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.updated}>Last updated: May 2026</Text>

      <Text style={styles.heading}>1. User-generated content</Text>
      <Text style={styles.body}>
        RentScore hosts reviews written by renters. Reviews reflect individual opinions and
        experiences, not statements of fact by RentScore. We do not verify every claim but reserve
        the right to moderate, remove, or reject content that violates these terms.
      </Text>

      <Text style={styles.heading}>2. Acceptable use</Text>
      <Text style={styles.body}>
        You may not post false, defamatory, harassing, or discriminatory content. Tags and reviews
        must not reference protected characteristics (race, religion, national origin, disability,
        familial status, gender, etc.) or encourage housing discrimination.
      </Text>

      <Text style={styles.heading}>3. One review per property</Text>
      <Text style={styles.body}>
        Each account may submit one review per property for a given tenancy. Attempts to manipulate
        ratings through multiple accounts or incentivized reviews are prohibited.
      </Text>

      <Text style={styles.heading}>4. Landlord disputes</Text>
      <Text style={styles.body}>
        Landlords who believe a review is false or defamatory may contact support@rentscore.app.
        We will review reports in good faith but are not obligated to remove lawful opinion content.
      </Text>

      <Text style={styles.heading}>5. Disclaimer</Text>
      <Text style={styles.body}>
        THE SERVICE IS PROVIDED “AS IS.” USE RENTSCORE AT YOUR OWN RISK WHEN MAKING RENTAL DECISIONS.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800' },
  updated: { color: '#6b7280', marginBottom: 8 },
  heading: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  body: { fontSize: 14, lineHeight: 22, color: '#374151' },
});
