import { ScrollView, StyleSheet, Text } from 'react-native';

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: May 2026</Text>

      <Text style={styles.heading}>Information we collect</Text>
      <Text style={styles.body}>
        We collect account information (email, display name), reviews you submit, location when you
        grant permission (to show nearby properties), and usage data to improve the app.
      </Text>

      <Text style={styles.heading}>How we use data</Text>
      <Text style={styles.body}>
        Data is used to display reviews, compute aggregate ratings, prevent abuse, and operate
        Firebase-hosted infrastructure. We do not sell personal information.
      </Text>

      <Text style={styles.heading}>Location</Text>
      <Text style={styles.body}>
        Location is used only while the app is in use (unless you enable background location in a
        future version). You can deny location permission and still search by address manually.
      </Text>

      <Text style={styles.heading}>Verification uploads</Text>
      <Text style={styles.body}>
        If you choose to upload tenancy verification documents in a future release, files are stored
        in Firebase Storage with access restricted to your account and moderation staff.
      </Text>

      <Text style={styles.heading}>Contact</Text>
      <Text style={styles.body}>privacy@rentscore.app</Text>
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
