import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CancellationPolicy = () => {
  const handlePhonePress = () => {
    Linking.openURL('tel:6360785195');
  };

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
      <StatusBar barStyle="light-content" backgroundColor="#FF5733" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="close-circle-outline" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Cancellation Policy</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Cancellation Policy Section */}
        <View style={styles.card}>
          <View style={styles.introContainer}>
            <Icon name="alert-circle" size={24} color="#FF5733" />
            <Text style={styles.introText}>
              Please read our cancellation policy carefully before registering for any exam.
            </Text>
          </View>

          {renderPolicyItem(
            '1',
            'Eligibility for Cancellation',
            'Exam registration cancellations are allowed only if requested within a specified timeframe, typically 2 days before the scheduled exam date.\n\nCancellation requests after the specified timeframe will not be entertained, except in extraordinary circumstances at our sole discretion.'
          )}

          {renderPolicyItem(
            '2',
            'Process for Cancellation',
            'Users must submit a written request for cancellation via email or the designated cancellation form available on our website.\n\nCancellation requests must include the user\'s name, registration ID, and reason for cancellation.'
          )}

          {renderPolicyItem(
            '3',
            'Refund Policy',
            'Full refunds: If the cancellation request is made within 2 days after registration or before the cancellation deadline.\n\nPartial refunds: If allowed, these will deduct processing fees (e.g., payment gateway charges or administrative costs).\n\nNo refunds: For cancellation requests made after the specified deadline or for users who fail to appear for the exam.'
          )}

          {renderPolicyItem(
            '4',
            'Non-Refundable Fees',
            'Certain fees, such as administrative charges or late registration fees, are non-refundable under all circumstances.'
          )}

          {renderPolicyItem(
            '5',
            'Exam Rescheduling',
            'Instead of cancellation, users may request to reschedule their exam to a later date if the option is available.\n\nRescheduling requests may incur an additional fee.'
          )}

          {renderPolicyItem(
            '6',
            'No-Show Policy',
            'Users who do not appear for the exam without prior notice or approval will forfeit the entire registration fee.'
          )}

          {renderPolicyItem(
            '7',
            'Cancellation Due to Technical Issues',
            'If the exam is canceled or postponed by ARN Private Exam Conduct due to technical or operational issues, users will be given the option to:\n\n• Reschedule the exam at no extra cost, or\n• Receive a full refund of the registration fee.'
          )}

          {renderPolicyItem(
            '8',
            'Extraordinary Circumstances',
            'In cases of emergencies such as natural disasters, severe illness (with medical proof), or other unforeseen events, cancellation or rescheduling may be allowed on a case-by-case basis.'
          )}

          {renderPolicyItem(
            '9',
            'Notification of Changes',
            'ARN Private Exam Conduct reserves the right to modify this cancellation policy at any time. Changes will be communicated through our website or email.'
          )}

          <View style={styles.policyItem}>
            <View style={styles.policyHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>10</Text>
              </View>
              <Text style={styles.policyTitle}>Contact for Cancellation Requests</Text>
            </View>
            <Text style={styles.policyContent}>
              Users can contact us for queries or to initiate a cancellation request:
            </Text>
            
            <View style={styles.contactContainer}>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handlePhonePress}
                activeOpacity={0.7}
              >
                <Icon name="call" size={20} color="#FF5733" />
                <Text style={styles.contactText}>+91 6360785195</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Icon name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.footerText}>
            This cancellation policy is subject to change. Please review this page regularly for updates.
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
    backgroundColor: '#FF5733',
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
    borderTopColor: '#FF5733',
  },
  introContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffede8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5733',
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
    backgroundColor: '#FF5733',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#FF5733',
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
  contactContainer: {
    marginTop: 16,
    paddingLeft: 48,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffede8',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5733',
  },
  contactText: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
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

export default CancellationPolicy;