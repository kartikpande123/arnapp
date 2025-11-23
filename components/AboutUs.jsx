import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const AboutUs = ({ navigation }) => {
  const handlePhonePress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleLocationPress = () => {
    const address = 'Dharwad, Karnataka 580011';
    Linking.openURL(`geo:0,0?q=${encodeURIComponent(address)}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroGradient}>
            <Text style={styles.heroTitle}>
              Karnataka Ayan Wholesale{'\n'}Supply Enterprises presents
            </Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroSubtitle}>ARN Private Exam Conduct</Text>
            <Text style={styles.heroDescription}>
              Empowering Students Through Quality Test Preparation
            </Text>
          </View>
        </View>

        {/* Company Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Our Company</Text>
          <Text style={styles.cardText}>
            Founded in 2024, ARN Private Exam Conduct is a specialized educational
            service provider focused on preparing students for competitive examinations.
            We conduct comprehensive model exams that simulate real competitive
            examination environments, helping students gain valuable experience across
            all types of competitive tests.
          </Text>
        </View>

        {/* Mission & Vision */}
        <View style={styles.row}>
          <View style={styles.halfCard}>
            <View style={styles.iconContainer}>
              <Icon name="target" size={32} color="#007bff" />
            </View>
            <Text style={styles.halfCardTitle}>Our Mission</Text>
            <Text style={styles.halfCardText}>
              To provide students with authentic examination experiences through
              high-quality model tests, enabling them to build confidence and excel in
              their competitive exam journey.
            </Text>
          </View>

          <View style={styles.halfCard}>
            <View style={styles.iconContainer}>
              <Icon name="eye" size={32} color="#007bff" />
            </View>
            <Text style={styles.halfCardTitle}>Our Vision</Text>
            <Text style={styles.halfCardText}>
              To become the leading competitive exam preparation platform in Karnataka,
              recognized for our innovative approach and commitment to student success.
            </Text>
          </View>
        </View>

        {/* Company Values */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Values</Text>
          <View style={styles.valuesContainer}>
            <View style={styles.valueItem}>
              <Icon name="award" size={28} color="#007bff" />
              <Text style={styles.valueTitle}>Excellence</Text>
              <Text style={styles.valueText}>
                Delivering premium quality exam preparation services
              </Text>
            </View>

            <View style={styles.valueItem}>
              <Icon name="users" size={28} color="#007bff" />
              <Text style={styles.valueTitle}>Student-Centric</Text>
              <Text style={styles.valueText}>
                Focusing on individual student growth and success
              </Text>
            </View>

            <View style={styles.valueItem}>
              <Icon name="clock" size={28} color="#007bff" />
              <Text style={styles.valueTitle}>Reliability</Text>
              <Text style={styles.valueText}>
                Consistent and dependable examination partner
              </Text>
            </View>
          </View>
        </View>

        {/* Team Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Team</Text>
          <Text style={styles.cardText}>
            Our dedicated team consists of experienced educators and examination experts
            who are committed to providing the best preparation experience for
            competitive exams. With their extensive knowledge and expertise, they ensure
            that students receive quality guidance and support throughout their
            preparation journey.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={handleLocationPress}
            activeOpacity={0.7}>
            <View style={styles.contactIconContainer}>
              <Icon name="map-pin" size={24} color="#007bff" />
            </View>
            <Text style={styles.contactText}>
              Dharwad, District Dharwad,{'\n'}Karnataka - 580011
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handlePhonePress('+916360785195')}
            activeOpacity={0.7}>
            <View style={styles.contactIconContainer}>
              <Icon name="phone" size={24} color="#007bff" />
            </View>
            <View>
              <Text style={styles.contactText}>+91 6360785195</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleEmailPress('arnprivateexamconduct@gmail.com')}
            activeOpacity={0.7}>
            <View style={styles.contactIconContainer}>
              <Icon name="mail" size={24} color="#007bff" />
            </View>
            <Text style={styles.contactText}>
              arnprivateexamconduct@gmail.com
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025/2026 Karnataka Ayan Wholesale Supply Enterprises.
          </Text>
          <Text style={styles.footerText}>All Rights Reserved.</Text>

          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={() => navigation.navigate('TermsAndConditions')}>
              <Text style={styles.footerLink}>Terms and Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>|</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>|</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CancellationPolicy')}>
              <Text style={styles.footerLink}>Cancellation Policy</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  heroSection: {
    backgroundColor: '#1a3b5d',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroGradient: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 30,
    marginTop:15
  },
  heroDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#4a9eff',
    marginVertical: 15,
    borderRadius: 2,
  },
  heroSubtitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4a9eff',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 16,
    color: '#b8d4f1',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 15,
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 12,
  },
  halfCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  halfCardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  valuesContainer: {
    gap: 20,
  },
  valueItem: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  valueTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 15,
  },
  contactText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerLink: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  footerSeparator: {
    fontSize: 12,
    color: '#6c757d',
    marginHorizontal: 4,
  },
});

export default AboutUs;