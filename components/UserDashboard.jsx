import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  RefreshControl,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetworkChecker from './NetworkChecker'; // Import NetworkChecker

const { width } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const Dashboard = ({ navigation }) => {
  const [exam, setExam] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [temporarilyHidden, setTemporarilyHidden] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isExamExpired, setIsExamExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstVisit();
    fetchInitialData();
    
    // Set up interval to periodically check for exam updates
    const interval = setInterval(() => {
      fetchExams();
    }, 30000); // Check every 30 seconds

    // Set up app state listener for background/foreground changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkExamTime = () => {
      if (!exam) return;

      const now = new Date();
      const [endTime, period] = exam.endTime.split(' ');
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let adjustedEndHours = endHours;
      if (period === 'PM' && endHours !== 12) {
        adjustedEndHours += 12;
      } else if (period === 'AM' && endHours === 12) {
        adjustedEndHours = 0;
      }

      const examEndTime = new Date();
      examEndTime.setHours(adjustedEndHours, endMinutes, 0, 0);

      if (now > examEndTime) {
        setIsExamExpired(true);
      } else {
        setIsExamExpired(false);
      }
    };

    checkExamTime();
    const interval = setInterval(checkExamTime, 60000);

    return () => clearInterval(interval);
  }, [exam]);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      // Refresh data when app comes to foreground
      fetchExams();
      fetchNotifications();
    }
  };

  const checkFirstVisit = async () => {
    try {
      const hasVisited = await AsyncStorage.getItem('hasVisited');
      if (!hasVisited) {
        setShowPopup(true);
        await AsyncStorage.setItem('hasVisited', 'true');
        Toast.show({
          type: 'success',
          text1: 'Welcome! 👋',
          text2: 'Welcome to ARN Exam Conduct Portal',
          position: 'top',
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchNotifications(), fetchExams()]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exams/json`);
      const data = await response.json();
      
      if (data.success) {
        const today = new Date().toISOString().split('T')[0];
        const todayExam = data.data.find((exam) => exam.date === today);
        setExam(todayExam || null);
        
        // Store exam data locally for offline access
        if (todayExam) {
          await AsyncStorage.setItem('currentExam', JSON.stringify(todayExam));
        } else {
          // Clear stored exam if no exam today
          await AsyncStorage.removeItem('currentExam');
        }
      } else {
        console.error('Error fetching exams:', data.error);
        // Try to load from local storage if API fails
        await loadStoredExam();
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      // Try to load from local storage if API fails
      await loadStoredExam();
    }
  };

  const loadStoredExam = async () => {
    try {
      const storedExam = await AsyncStorage.getItem('currentExam');
      if (storedExam) {
        setExam(JSON.parse(storedExam));
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Using cached exam data',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } catch (storageError) {
      console.error('Error loading stored exam:', storageError);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Failed to fetch notifications',
        position: 'bottom',
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchNotifications(), fetchExams()]);
      Toast.show({
        type: 'success',
        text1: 'Refreshed',
        text2: 'Data updated successfully',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Could not update data',
        position: 'bottom',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationClick = () => {
    setTemporarilyHidden(true);
    navigation.navigate('Notifications');
  };

  const goToExamEntry = () => {
    if (isExamExpired) {
      Alert.alert(
        'Exam Ended',
        'This exam has ended. You cannot start it anymore.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    if (!exam) {
      Alert.alert(
        'No Exam',
        'There is no exam scheduled for today.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    navigation.navigate('ExamEntry');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayCount = unreadCount > 3 ? '3+' : unreadCount.toString();
  const shouldShowBadge = !temporarilyHidden && unreadCount > 0;

  return (
    <NetworkChecker>
      <View style={styles.container}>
        {/* Enhanced Header with Gradient */}
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../Images/LOGO.jpg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>ARN Pvt Exam Conduct</Text>
                <Text style={styles.headerSubtitle}>Excellence in Education</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#1a3b5d']}
              tintColor="#1a3b5d"
            />
          }
        >
          {/* Enhanced Dashboard Header */}
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Exam Dashboard</Text>
            <Text style={styles.dashboardSubtitle}>Your learning journey starts here</Text>
            
            <TouchableOpacity
              style={styles.tutorialLink}
              onPress={() => navigation.navigate('TutorialDashboard')}
              activeOpacity={0.8}
            >
              <View style={styles.tutorialContent}>
                <Icon name="play-circle" size={22} color="#fff" />
                <View style={styles.tutorialTextContainer}>
                  <Text style={styles.tutorialTextBold}>New to the app?</Text>
                  <Text style={styles.tutorialText}>Watch our quick tutorial</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Enhanced Navigation Cards with better spacing */}
          <View style={styles.navCardsContainer}>
            <NavCard
              iconName="medal"
              text="Rewards"
              color="#4e73df"
              onPress={() => navigation.navigate('Rewards')}
            />
            <NavCard
              iconName="calendar"
              text="Upcoming Exams"
              color="#1cc88a"
              onPress={() => navigation.navigate('UpcomingExams')}
            />
            <NavCard
              iconName="bell"
              text="Notifications"
              color="#f6a623"
              badge={shouldShowBadge ? displayCount : null}
              onPress={handleNotificationClick}
            />
            <NavCard
              iconName="book-open-variant"
              text="Exam Q/A"
              color="#e74a3b"
              onPress={() => navigation.navigate('ExamKeyAnswer')}
            />
            <NavCard
              iconName="information"
              text="About Us"
              color="#36b9cc"
              onPress={() => navigation.navigate('AboutUs')}
            />
            <NavCard
              iconName="help-circle"
              text="Help & Support"
              color="#858796"
              onPress={() => navigation.navigate('Help')}
            />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Enhanced Today's Exam Card */}
            {exam ? (
              <View style={styles.examCardWrapper}>
                <View style={styles.examCard}>
                  <View style={[styles.examHeader, isExamExpired && styles.examHeaderExpired]}>
                    <View style={styles.examHeaderLeft}>
                      <Icon name="clock-check-outline" size={24} color="#fff" style={styles.examHeaderIcon} />
                      <View>
                        <Text style={styles.examHeaderLabel}>Today's Exam</Text>
                        <Text style={styles.examHeaderTitle}>
                          {exam.examDetails?.name || "Today's Exam"}
                        </Text>
                      </View>
                    </View>
                    {isExamExpired && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>ENDED</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.examBody}>
                    <View style={styles.examInfoGrid}>
                      <View style={styles.examInfoCard}>
                        <Icon name="calendar" size={24} color="#4e73df" />
                        <View style={styles.examInfoText}>
                          <Text style={styles.examInfoLabel}>Date</Text>
                          <Text style={styles.examInfoValue}>{exam.date}</Text>
                        </View>
                      </View>
                      <View style={styles.examInfoCard}>
                        <Icon name="clock-outline" size={24} color="#1cc88a" />
                        <View style={styles.examInfoText}>
                          <Text style={styles.examInfoLabel}>Time</Text>
                          <Text style={styles.examInfoValue}>{exam.startTime} - {exam.endTime}</Text>
                        </View>
                      </View>
                      <View style={styles.examInfoCard}>
                        <Icon name="star" size={24} color="#f6a623" />
                        <View style={styles.examInfoText}>
                          <Text style={styles.examInfoLabel}>Total Marks</Text>
                          <Text style={styles.examInfoValue}>{exam.marks}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.startExamBtn, isExamExpired && styles.startExamBtnDisabled]}
                      onPress={goToExamEntry}
                      disabled={isExamExpired}
                      activeOpacity={0.8}
                    >
                      <Icon name={isExamExpired ? "close-circle" : "play-circle"} size={20} color="#fff" style={styles.startExamIcon} />
                      <Text style={styles.startExamBtnText}>
                        {isExamExpired ? 'Exam is Over Today' : 'Start Exam Now'}
                      </Text>
                      {!isExamExpired && <Icon name="arrow-right" size={20} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noExamCard}>
                <View style={styles.noExamIconContainer}>
                  <Icon name="calendar-remove" size={56} color="#1a3b5d" />
                </View>
                <Text style={styles.noExamTitle}>No Exams Today</Text>
                <Text style={styles.noExamText}>Check your upcoming exams schedule</Text>
                <TouchableOpacity 
                  style={styles.noExamBtn}
                  onPress={() => navigation.navigate('UpcomingExams')}
                >
                  <Text style={styles.noExamBtnText}>View Schedule</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Enhanced Resource Cards */}
            <ResourceCard
              iconName="text-box-check"
              title="Practice Tests"
              description="Access premium practice tests to prepare for your exams with real exam-like questions and detailed solutions."
              buttonText="Explore Tests"
              buttonColor="#5a67d8"
              iconColor="#5a67d8"
              onPress={() => navigation.navigate('PracticeTestDashboard')}
            />

            <ResourceCard
              iconName="bookmark-multiple"
              title="Study Materials"
              description="Comprehensive study guides, notes, and reference materials curated by experts to help you ace your exams."
              buttonText="Explore Materials"
              buttonColor="#1cc88a"
              iconColor="#1cc88a"
              onPress={() => navigation.navigate('PdfSyllabusDashboard')}
            />

            <ResourceCard
              iconName="play-circle"
              title="Video Syllabus"
              description="Watch comprehensive video lectures and tutorials from expert instructors covering the complete syllabus."
              buttonText="Watch Videos"
              buttonColor="#f6a623"
              iconColor="#f6a623"
              onPress={() => navigation.navigate('VideoSyllabusDashboard')}
            />

            {/* Enhanced Premium Card */}
            <View style={styles.premiumCardWrapper}>
              <View style={styles.premiumCard}>
                <View style={styles.premiumBadge}>
                  <Icon name="crown" size={16} color="#fff" />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
                
                <View style={styles.premiumHeader}>
                  <Icon name="crown" size={32} color="#d4af37" />
                  <Text style={styles.premiumTitle}>Super User Premium</Text>
                </View>
                
                <Text style={styles.premiumSubtitle}>Unlock all features and maximize your learning potential</Text>
                
                <View style={styles.premiumFeaturesList}>
                  <PremiumFeature icon="check-circle" text="Unlimited practice tests access" />
                  <PremiumFeature icon="check-circle" text="All video materials included" />
                  <PremiumFeature icon="check-circle" text="Priority support & assistance" />
                  <PremiumFeature icon="check-circle" text="Ad-free learning experience" />
                </View>
                
                <TouchableOpacity
                  style={styles.premiumBtn}
                  onPress={() => navigation.navigate('SuperUserDashboard')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.premiumBtnText}>Upgrade to Premium</Text>
                  <Icon name="arrow-right" size={18} color="#2d3748" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Enhanced Action Buttons */}
          <View style={styles.actionButtonsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <ActionButton 
                text="Results" 
                iconName="chart-line"
                color="#4e73df"
                onPress={() => navigation.navigate('ExamResults')} 
              />
              <ActionButton 
                text="Syllabus" 
                iconName="download"
                color="#1cc88a"
                onPress={() => navigation.navigate('UserSyllabus')} 
              />
              <ActionButton 
                text="Hall Ticket" 
                iconName="ticket"
                color="#f6a623"
                onPress={() => navigation.navigate('DownloadHallTicket')} 
              />
              <ActionButton 
                text="Exam Form" 
                iconName="file-document"
                color="#e74a3b"
                onPress={() => navigation.navigate('ExamForm')} 
              />
              <ActionButton 
                text="Key Answers" 
                iconName="key"
                color="#36b9cc"
                onPress={() => navigation.navigate('CheckAnswers')} 
              />
              <ActionButton 
                text="Winners" 
                iconName="trophy"
                color="#d4af37"
                onPress={() => navigation.navigate('FindWinner')} 
              />
            </View>
          </View>

          {/* Enhanced Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2025/2026 Karnataka Ayan Wholesale Supply Enterprises
            </Text>
            <Text style={styles.footerSubtext}>All Rights Reserved</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
                <Text style={styles.footerLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CancellationPolicy')}>
                <Text style={styles.footerLink}>Cancellation Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Toast />
      </View>
    </NetworkChecker>
  );
};

// Enhanced Reusable Components
const NavCard = ({ iconName, text, badge, color, onPress }) => (
  <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.navCardIconContainer, { backgroundColor: `${color}15` }]}>
      <Icon name={iconName} size={26} color={color} />
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.navCardText}>{text}</Text>
  </TouchableOpacity>
);

const ResourceCard = ({ iconName, title, description, buttonText, buttonColor, iconColor, onPress }) => (
  <View style={styles.resourceCard}>
    <View style={[styles.resourceIconContainer, { backgroundColor: `${iconColor}15` }]}>
      <Icon name={iconName} size={28} color={iconColor} />
    </View>
    <Text style={styles.resourceTitle}>{title}</Text>
    <Text style={styles.resourceDescription}>{description}</Text>
    <TouchableOpacity
      style={[styles.resourceBtn, { backgroundColor: buttonColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.resourceBtnText}>{buttonText}</Text>
      <Icon name="arrow-right" size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

const ActionButton = ({ text, iconName, color, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionBtnIconContainer, { backgroundColor: color }]}>
      <Icon name={iconName} size={18} color="#fff" />
    </View>
    <Text style={styles.actionBtnText}>{text}</Text>
  </TouchableOpacity>
);

const PremiumFeature = ({ icon, text }) => (
  <View style={styles.premiumFeature}>
    <Icon name={icon} size={18} color="#d4af37" />
    <Text style={styles.premiumFeatureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerGradient: {
    backgroundColor: '#1a3b5d',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginTop:10
  },
  logoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  headerTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  dashboardHeader: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  dashboardTitle: {
    color: '#1a3b5d',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dashboardSubtitle: {
    color: '#6c757d',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '400',
  },
  tutorialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  tutorialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tutorialTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  tutorialTextBold: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tutorialText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  navCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    gap: 12,
  },
  navCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  navCardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  navCardText: {
    fontSize: 11,
    color: '#2d3748',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  examCardWrapper: {
    marginBottom: 20,
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  examHeader: {
    backgroundColor: '#1a3b5d',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examHeaderExpired: {
    backgroundColor: '#6c757d',
  },
  examHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examHeaderIcon: {
    marginRight: 12,
  },
  examHeaderLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  examHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  examBody: {
    padding: 20,
  },
  examInfoGrid: {
    marginBottom: 20,
  },
  examInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  examInfoText: {
    marginLeft: 14,
    flex: 1,
  },
  examInfoLabel: {
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  examInfoValue: {
    color: '#2d3748',
    fontWeight: '700',
    fontSize: 15,
  },
  startExamBtn: {
    backgroundColor: '#1a3b5d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1a3b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  startExamBtnDisabled: {
    backgroundColor: '#dc3545',
  },
  startExamIcon: {
    marginRight: 8,
  },
  startExamBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  noExamCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  noExamIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noExamTitle: {
    color: '#2d3748',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  noExamText: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  noExamBtn: {
    backgroundColor: '#1a3b5d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  noExamBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  resourceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resourceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 10,
  },
  resourceDescription: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 22,
  },
  resourceBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  resourceBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 8,
  },
  premiumCardWrapper: {
    marginBottom: 20,
  },
  premiumCard: {
    backgroundColor: '#fffef8',
    borderRadius: 16,
    padding: 24,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#d4af37',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#d4af37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
    zIndex: 10,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d3748',
    marginLeft: 12,
  },
  premiumSubtitle: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  premiumFeaturesList: {
    marginBottom: 24,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumFeatureText: {
    color: '#2d3748',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  premiumBtn: {
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  premiumBtnText: {
    color: '#2d3748',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e8ecf1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionBtnText: {
    color: '#2d3748',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
    marginBottom: 15,
  },
  footerText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '500',
  },
  footerSubtext: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    color: '#1a3b5d',
    fontSize: 12,
    fontWeight: '600',
  },
  footerSeparator: {
    color: '#6c757d',
    marginHorizontal: 8,
  },
});

export default Dashboard;