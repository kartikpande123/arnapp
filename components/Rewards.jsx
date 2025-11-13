import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const Rewards = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const handleGetStarted = () => {
    // Navigate to Dashboard
    navigation.navigate('Dashboard');
    console.log('Navigating to Dashboard...');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const prizeData = {
    first: {
      worth: 1000,
      icon: 'trophy',
      gradient: ['#FFD700', '#FFA500', '#FF8C00'],
      items: [
        { name: 'Comport', mrp: 57 },
        { name: 'Harpic', mrp: 105 },
        { name: 'Phynail', mrp: 75 },
        { name: 'Lizol', mrp: 140 },
        { name: 'Soap wheel (10pcs)', mrp: 100 },
        { name: 'Raw rice (1kg)', mrp: 75 },
        { name: 'Santoor soap (2pcs)', mrp: 70 },
        { name: 'Sugar (2kg)', mrp: 84 },
        { name: 'Ghee', mrp: 140 },
        { name: 'Ice cream', mrp: 49 },
        { name: 'Besan (0.5kg)', mrp: 65 },
        { name: 'Paneer', mrp: 40 },
      ],
      cashOption: '₹1000',
    },
    second: {
      worth: 750,
      icon: 'medal',
      gradient: ['#E8E8E8', '#C0C0C0', '#A8A8A8'],
      items: [
        { name: 'Comport', mrp: 57 },
        { name: 'Harpic', mrp: 105 },
        { name: 'Phynail', mrp: 75 },
        { name: 'Lizol', mrp: 140 },
        { name: 'Soap (10pcs)', mrp: 100 },
        { name: 'Paneer', mrp: 40 },
        { name: 'Ice cream', mrp: 49 },
        { name: 'Ghee', mrp: 140 },
        { name: 'Idli rava', mrp: 44 },
      ],
      cashOption: '₹750',
    },
    third: {
      worth: 500,
      icon: 'gift',
      gradient: ['#CD7F32', '#B8792F', '#A0692A'],
      items: [
        { name: 'Comport', mrp: 57 },
        { name: 'Harpic', mrp: 105 },
        { name: 'Phynail', mrp: 65 },
        { name: 'Paneer', mrp: 40 },
        { name: 'Ice cream', mrp: 49 },
        { name: 'Ghee', mrp: 140 },
        { name: 'Idli rava', mrp: 44 },
      ],
      cashOption: '₹500',
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0D47A1" barStyle="light-content" />
      
      {/* Animated Hero Header */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <LinearGradient
          colors={['#0D47A1', '#1565C0', '#1976D2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <View style={styles.heroPattern}>
            <Icon name="star-four-points" size={40} color="rgba(255,255,255,0.1)" style={styles.patternIcon1} />
            <Icon name="star-four-points" size={60} color="rgba(255,255,255,0.08)" style={styles.patternIcon2} />
            <Icon name="star-four-points" size={35} color="rgba(255,255,255,0.12)" style={styles.patternIcon3} />
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.companyName}>Karnataka Ayan</Text>
            <Text style={styles.companyTagline}>Wholesale Supply Enterprises</Text>
            
            <View style={styles.partnershipBadge}>
              <Icon name="handshake" size={16} color="#FFC107" />
              <Text style={styles.partnershipText}>In partnership with ARN Pvt Exam Conduct</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Floating Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Icon name="trophy-variant" size={24} color="#FFC107" />
            <Text style={styles.statNumber}>₹2,250</Text>
            <Text style={styles.statLabel}>Total Prizes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Icon name="account-group" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>Top 3</Text>
            <Text style={styles.statLabel}>Winners</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Icon name="gift" size={24} color="#FF6F00" />
            <Text style={styles.statNumber}>12+</Text>
            <Text style={styles.statLabel}>Items/Cash</Text>
          </View>
        </View>

        {/* Special Offer Banner */}
        <Animated.View style={[styles.animatedCard, { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <LinearGradient
            colors={['#D32F2F', '#E53935', '#EF5350']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.specialOfferBanner}
          >
            <View style={styles.offerBadgeContainer}>
              <View style={styles.offerBadge}>
                <Icon name="flash" size={24} color="#FFC107" />
                <Text style={styles.offerBadgeText}>EXCLUSIVE</Text>
              </View>
            </View>
            
            <View style={styles.offerContent}>
              <View style={styles.offerHeader}>
                <Icon name="star" size={28} color="#FFC107" />
                <Text style={styles.offerTitle}>FREE ACCESS!</Text>
                <Icon name="star" size={28} color="#FFC107" />
              </View>
              
              <Text style={styles.offerDescription}>
                Get complete access to all Practice Tests & Syllabus at absolutely no cost this month!
              </Text>
              
              <View style={styles.offerFeatures}>
                <View style={styles.featureRow}>
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Professional Test Series</Text>
                </View>
                <View style={styles.featureRow}>
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Complete Study Materials</Text>
                </View>
                <View style={styles.featureRow}>
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Expert Curated Content</Text>
                </View>
              </View>

              <View style={styles.timerContainer}>
                <Icon name="timer-sand" size={20} color="#fff" />
                <Text style={styles.timerText}>Limited Time - This Month Only!</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Contact Card */}
        <View style={styles.contactCard}>
          <LinearGradient
            colors={['#FFF8E1', '#FFECB3', '#FFE082']}
            style={styles.contactGradient}
          >
            <View style={styles.contactIconWrapper}>
              <Icon name="phone-in-talk" size={32} color="#F57C00" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Need Assistance?</Text>
              <TouchableOpacity>
                <Text style={styles.contactNumber}>+91 6360785195</Text>
              </TouchableOpacity>
              <Text style={styles.contactAvailability}>Available 24/7 • Expert Support</Text>
            </View>
          </LinearGradient>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <View style={styles.sectionHeader}>
            <Icon name="information" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>About the Program</Text>
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              <Text style={styles.aboutBold}>Karnataka Ayan Wholesale Supply Enterprises</Text> proudly presents 
              competitive examinations through our specialized division{' '}
              <Text style={styles.aboutBold}>ARN Pvt Exam Conduct</Text>.{'\n\n'}
              Our mission is to nurture bright futures while rewarding excellence with premium grocery, 
              dairy products, and cash prizes for top performers!
            </Text>
          </View>
        </View>

        {/* Prize Cards Section */}
        <View style={styles.prizesSection}>
          <View style={styles.sectionHeader}>
            <Icon name="trophy-award" size={24} color="#FFC107" />
            <Text style={styles.sectionTitle}>Prize Packages</Text>
          </View>

          {Object.entries(prizeData).map(([place, data], index) => (
            <View key={place} style={styles.prizeCardWrapper}>
              <LinearGradient
                colors={data.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.prizeCardHeader}
              >
                <View style={styles.prizeRank}>
                  <View style={styles.prizeIconBg}>
                    <Icon name={data.icon} size={40} color="#fff" />
                  </View>
                  <View style={styles.prizeDetails}>
                    <Text style={styles.prizePosition}>
                      {index === 0 ? '🥇 First Prize' : index === 1 ? '🥈 Second Prize' : '🥉 Third Prize'}
                    </Text>
                    <Text style={styles.prizeValue}>Total Worth: ₹{data.worth}</Text>
                  </View>
                </View>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#TOP {index + 1}</Text>
                </View>
              </LinearGradient>

              <View style={styles.prizeCardBody}>
                {/* Items Grid */}
                <View style={styles.itemsSection}>
                  <View style={styles.itemsHeaderRow}>
                    <Icon name="package-variant" size={20} color="#1976D2" />
                    <Text style={styles.itemsTitle}>Premium Items Included</Text>
                  </View>
                  
                  <View style={styles.itemsGrid}>
                    {data.items.map((item, i) => (
                      <View key={i} style={styles.itemCard}>
                        <View style={styles.itemCardContent}>
                          <View style={styles.itemIconCircle}>
                            <Icon name="shopping" size={16} color="#1976D2" />
                          </View>
                          <Text style={styles.itemCardName} numberOfLines={2}>{item.name}</Text>
                        </View>
                        <View style={styles.itemCardPrice}>
                          <Text style={styles.itemCardPriceText}>₹{item.mrp}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Cash Alternative */}
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9']}
                  style={styles.cashAlternative}
                >
                  <View style={styles.cashIcon}>
                    <Icon name="cash-multiple" size={28} color="#2E7D32" />
                  </View>
                  <View style={styles.cashDetails}>
                    <Text style={styles.cashLabel}>Cash Alternative Available</Text>
                    <Text style={styles.cashValue}>{data.cashOption}</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom CTA */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['#1565C0', '#1976D2', '#1E88E5']}
            style={styles.ctaCard}
          >
            <Icon name="rocket-launch" size={48} color="#FFC107" />
            <Text style={styles.ctaTitle}>Ready to Win?</Text>
            <Text style={styles.ctaDescription}>
              Start your journey to success with our free practice tests and comprehensive study materials
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
              <Text style={styles.ctaButtonText}>Get Started Now</Text>
              <Icon name="arrow-right" size={20} color="#1565C0" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  heroHeader: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternIcon1: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  patternIcon2: {
    position: 'absolute',
    bottom: 30,
    left: -10,
  },
  patternIcon3: {
    position: 'absolute',
    top: 60,
    left: 30,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 6,
  },
  companyTagline: {
    fontSize: 14,
    color: '#E3F2FD',
    marginBottom: 16,
  },
  partnershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  partnershipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  animatedCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  specialOfferBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  offerBadgeContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  offerBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  offerContent: {
    padding: 20,
    paddingTop: 0,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  offerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  offerDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  offerFeatures: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  contactIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 4,
  },
  contactAvailability: {
    fontSize: 11,
    color: '#666',
  },
  aboutSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aboutText: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 24,
  },
  aboutBold: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  prizesSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  prizeCardWrapper: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  prizeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  prizeRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  prizeIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeDetails: {
    flex: 1,
  },
  prizePosition: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  prizeValue: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
  },
  rankBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  prizeCardBody: {
    padding: 20,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemCard: {
    width: (width - 72) / 2,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCardName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  itemCardPrice: {
    backgroundColor: '#1976D2',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemCardPriceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  cashAlternative: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cashIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashDetails: {
    flex: 1,
  },
  cashLabel: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 4,
    fontWeight: '600',
  },
  cashValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  ctaSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  ctaDescription: {
    fontSize: 15,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
  },
});

export default Rewards;