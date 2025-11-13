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

const TermsAndConditions = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:arnprivateexamconduct@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:6360785195');
  };

  const renderTermItem = (number, title, content) => (
    <View style={styles.termItem} key={number}>
      <View style={styles.termHeader}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <Text style={styles.termTitle}>{title}</Text>
      </View>
      <Text style={styles.termContent}>{content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="document-text-outline" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Terms Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>General Terms</Text>
          </View>

          {renderTermItem(
            '1',
            'Acceptance of Terms',
            'By accessing or using our website, you agree to abide by these Terms and Conditions. If you do not agree to these terms, you may not use the services provided by ARN Private Exam Conduct.'
          )}

          {renderTermItem(
            '2',
            'Eligibility',
            'Users must be at least 18 years old or have parental/guardian consent to register and participate in exams. Accurate and truthful information must be provided during registration.'
          )}

          {renderTermItem(
            '3',
            'User Account Responsibilities',
            'Users are responsible for maintaining the confidentiality of their account credentials. Unauthorized access to or use of your account must be reported to us immediately.'
          )}

          {renderTermItem(
            '4',
            'Exam Conduct Guidelines',
            'Users must adhere to all instructions provided during the exam. Cheating, plagiarism, or any other form of malpractice is strictly prohibited and will result in disqualification.'
          )}

          {renderTermItem(
            '5',
            'Technical Issues During Examination',
            'In the event of technical issues or errors during the examination, including but not limited to system failures, connectivity problems, or platform malfunctions, the affected examination results will be deemed invalid and will not be considered for evaluation. In such cases, candidates will receive a full refund of their examination fees. The refund will be processed within 7-10 business days through the original payment method.'
          )}

          {renderTermItem(
            '6',
            'Fees and Payments',
            'Exam fees must be paid in full before registration is considered complete. Fees are non-refundable unless stated otherwise.'
          )}

          {renderTermItem(
            '7',
            'Website Usage Restrictions',
            'Users may not use the website for any illegal or unauthorized purpose. Users must not attempt to harm, disrupt, or exploit the website\'s security or functionality.'
          )}

          {renderTermItem(
            '8',
            'Intellectual Property',
            'All content on the website, including text, images, logos, and software, is the intellectual property of ARN Private Exam Conduct. Unauthorized reproduction or distribution of any content is prohibited.'
          )}

          {renderTermItem(
            '9',
            'Limitation of Liability',
            'ARN Private Exam Conduct is not liable for any technical issues, loss of data, or other interruptions during the exam.'
          )}

          {renderTermItem(
            '10',
            'Termination of Services',
            'We reserve the right to suspend or terminate user accounts for violations of these terms.'
          )}

          {renderTermItem(
            '11',
            'Amendments',
            'We may update these terms periodically. Users will be notified of significant changes, and continued use of the website signifies acceptance of the updated terms.'
          )}
        </View>

        {/* Delivery Terms Section */}
        <View style={[styles.card, styles.deliveryCard]}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="cube-outline" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Delivery Terms</Text>
          </View>

          {renderTermItem(
            '1',
            'Delivery Timelines',
            'Standard delivery time is 5 to 7 business days after your order is confirmed. Delivery timelines may vary during holidays, peak seasons, or due to unforeseen circumstances.'
          )}

          {renderTermItem(
            '2',
            'Shipping Charges',
            'Delivery charges, if any, will be calculated and displayed at checkout. Free shipping is applicable for orders above 500rs unless otherwise specified.'
          )}

          {renderTermItem(
            '3',
            'Order Tracking',
            'You will receive a tracking number via email/SMS once your order has been shipped. Use the tracking number on our help or through the courier service\'s platform to track your delivery.'
          )}

          {renderTermItem(
            '4',
            'Failed Delivery',
            'If the delivery attempt fails due to incorrect address, unavailability of the recipient, or refusal to accept the order, re-delivery charges may apply. Orders unclaimed for 10 days will be canceled, and refunds (if any) will be subject to our refund policy.'
          )}

          {renderTermItem(
            '5',
            'Delivery Acceptance',
            'Please inspect the package upon delivery and notify us of any issues, such as damaged or missing items, within 24 hours of receipt.'
          )}

          {renderTermItem(
            '6',
            'Delays and Force Majeure',
            'We are not responsible for delivery delays caused by circumstances beyond our control, such as natural disasters, strikes, or transportation disruptions.'
          )}

          {renderTermItem(
            '7',
            'Returns and Exchanges',
            'For returns or exchanges, contact us on your Help Page with your Registration ID. Products must be returned in their original condition and packaging to qualify for a return or exchange.'
          )}

          <View style={styles.termItem}>
            <View style={styles.termHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>8</Text>
              </View>
              <Text style={styles.termTitle}>Contact Us</Text>
            </View>
            <Text style={styles.termContent}>
              For questions or concerns regarding your delivery, please contact our customer support team:
            </Text>
            
            <View style={styles.contactContainer}>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handleEmailPress}
                activeOpacity={0.7}
              >
                <Icon name="mail" size={20} color="#4CAF50" />
                <Text style={styles.contactText}>arnprivateexamconduct@gmail.com</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handlePhonePress}
                activeOpacity={0.7}
              >
                <Icon name="call" size={20} color="#4CAF50" />
                <Text style={styles.contactText}>6360785195</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Icon name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.footerText}>
            These terms are subject to change without prior notice. Please check this page periodically for updates.
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
    backgroundColor: '#4CAF50',
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
  },
  deliveryCard: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  termItem: {
    marginBottom: 24,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  numberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  termTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24,
  },
  termContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
    paddingLeft: 48,
    textAlign: 'justify',
  },
  contactContainer: {
    marginTop: 16,
    paddingLeft: 48,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f4',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
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

export default TermsAndConditions;