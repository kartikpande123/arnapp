import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Linking, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const APP_NAME = 'ARN Student Portal';
const COMPANY_NAME = 'KARNATAKA AYAN WHOLESALE SUPPLY ENTERPRICES';
const DEVELOPER_NAME = 'AKBARSAB NADAF';
const CONTACT_EMAIL = 'jubedakbar@gmail.com';
const POLICY_URL = 'https://arnprivateexamconduct.in/privacypolicy';

const PrivacyPolicy = () => {
  const renderPolicyItem = (number, title, content) => (
    <View style={styles.policyItem} key={number}>
      <View style={styles.policyHeader}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <Text style={styles.policyTitle}>{title}</Text>
      </View>
      <Text style={styles.policyContent}>{content}</Text>
    </View>
  );

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007BFF" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="shield-checkmark-outline" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.introContainer}>
            <Icon name="lock-closed" size={24} color="#007BFF" />
            <Text style={styles.introText}>
              {APP_NAME} is owned and operated by {COMPANY_NAME} ({DEVELOPER_NAME}). Your privacy
              is important to us. This Privacy Policy explains how we collect,
              use, and protect your personal information in compliance with
              Google Play policies.
            </Text>
          </View>

          {renderPolicyItem(
            '1',
            'Information We Collect',
            '• Personal Information: Name, email address, phone number, and payment details.\n• Exam Data: Performance, answers, and scores.\n• Technical Information: Device information, IP address, and app usage data.',
          )}

          {renderPolicyItem(
            '2',
            'How We Use Your Information',
            '• To register and authenticate users.\n• To conduct and manage online exams.\n• To communicate updates, results, and notifications.\n• To improve app performance and security.',
          )}

          {renderPolicyItem(
            '3',
            'Data Sharing',
            'We do not sell or share your personal information with third parties except:\n• When required by law\n• With your consent\n• With trusted payment or analytics providers required for app functionality.',
          )}

          {renderPolicyItem(
            '4',
            'Google Play Services & Third-Party Services',
            'This app may use Google Play Services, Firebase, and secure payment gateways. These services may collect limited technical data as per their own privacy policies.',
          )}

          {renderPolicyItem(
            '5',
            'Data Security',
            'We implement industry-standard security measures to protect your information. However, no system can guarantee complete security.',
          )}

          {renderPolicyItem(
            '6',
            'User Rights',
            'Users may request:\n• Access to their personal data\n• Correction of inaccurate data\n• Deletion of their data (subject to legal requirements)\n\nContact us at: ' +
              CONTACT_EMAIL,
          )}

          {renderPolicyItem(
            '7',
            'Children’s Privacy',
            'This app is not directed to children under 13. We do not knowingly collect personal data from children.',
          )}

          {renderPolicyItem(
            '8',
            'Data Retention',
            'We retain user data only as long as necessary for operational, legal, and exam-related purposes.',
          )}

          {renderPolicyItem(
            '9',
            'Changes to this Privacy Policy',
            'We may update this policy periodically. Users will be notified of major changes through the app or website.',
          )}

          {renderPolicyItem(
            '10',
            'Contact & Developer Information',
            `Company: ${COMPANY_NAME}\nDeveloper: ${DEVELOPER_NAME}\nEmail: ${CONTACT_EMAIL}`,
          )}
        </View>

        <View style={styles.policyLinkContainer}>
          <Text style={styles.policyLinkText}>Privacy Policy URL (Website) </Text>
          <TouchableOpacity onPress={() => handleLinkPress(POLICY_URL)}>
            <Text style={styles.policyLink}>{POLICY_URL}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Icon name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.footerText}>Last updated: February 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: {
    backgroundColor: '#007BFF',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 3,
    borderTopColor: '#007BFF',
  },
  introContainer: {
    flexDirection: 'row',
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  introText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#2c3e50' },
  policyItem: { marginBottom: 22 },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: { color: '#fff', fontWeight: '700' },
  policyTitle: { fontSize: 17, fontWeight: '700', color: '#2c3e50', flex: 1 },
  policyContent: {
    fontSize: 14.5,
    lineHeight: 23,
    color: '#555',
    paddingLeft: 44,
  },
  policyLinkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  policyLinkText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  policyLink: {
    fontSize: 14,
    color: '#007BFF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  footerNote: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  footerText: { fontSize: 13.5, color: '#666', flex: 1 },
});

export default PrivacyPolicy;