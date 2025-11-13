import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007BFF" />
      
      {/* Header */}
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
        {/* Main Privacy Policy Section */}
        <View style={styles.card}>
          <View style={styles.introContainer}>
            <Icon name="lock-closed" size={24} color="#007BFF" />
            <Text style={styles.introText}>
              Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
            </Text>
          </View>

          {renderPolicyItem(
            '1',
            'Information We Collect',
            'Personal Information: Name, email address, phone number, payment details, etc.\n\nExam Data: Performance, answers, and scores.\n\nTechnical Information: IP address, browser type, and cookies for website functionality.'
          )}

          {renderPolicyItem(
            '2',
            'How We Use Your Information',
            'To register and authenticate users.\n\nTo conduct and manage online exams.\n\nTo communicate updates, results, and notifications.'
          )}

          {renderPolicyItem(
            '3',
            'Data Sharing',
            'We do not share your personal information with third parties, except as required by law or with your consent.'
          )}

          {renderPolicyItem(
            '4',
            'Data Security',
            'We employ industry-standard security measures to protect your data. While we strive to safeguard your information, no system is completely secure.'
          )}

          {renderPolicyItem(
            '5',
            'User Rights',
            'Access: Users can request access to their personal data.\n\nRectification: Users can update or correct their data.\n\nDeletion: Users may request the deletion of their data, subject to legal and operational requirements.'
          )}

          {renderPolicyItem(
            '6',
            'Third-Party Services',
            'We may use third-party payment gateways or analytics tools. These services have their own privacy policies.'
          )}

          {renderPolicyItem(
            '7',
            'Retention of Data',
            'User data is retained as long as necessary for operational, legal, or regulatory purposes.'
          )}

          {renderPolicyItem(
            '8',
            'Changes to the Privacy Policy',
            'We may update this policy periodically. Users will be notified of significant changes.'
          )}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Icon name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.footerText}>
            This privacy policy was last updated on November 2024. We reserve the right to modify this policy at any time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#007BFF',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 3,
    borderTopColor: '#007BFF',
  },
  introContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  introText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#2c3e50',
    fontWeight: '500',
  },
  policyItem: {
    marginBottom: 24,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  numberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24,
  },
  policyContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
    paddingLeft: 48,
    textAlign: 'justify',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
});

export default PrivacyPolicy;