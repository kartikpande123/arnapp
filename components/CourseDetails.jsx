import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfigCourse';
import CourseApplicationForm from './CourseApplicationForm';
import CourseHeader from './CourseHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CourseDetails = ({ navigation, route }) => {
  // Get courseId from navigation params - provide default empty object
  const { courseId = null } = route?.params || {};
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Add ref for ScrollView
  const scrollViewRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCourseDetails = async () => {
      if (!courseId) {
        if (isMounted) {
          setError('No course ID provided');
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Try to get from cache first
        const cachedCourse = await AsyncStorage.getItem(`course_${courseId}`);
        if (cachedCourse && isMounted) {
          setCourse(JSON.parse(cachedCourse));
          setLoading(false);
        }

        // Always fetch fresh data
        const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
        
        if (!isMounted) return;

        if (response.data) {
          setCourse(response.data);
          // Cache the course data
          await AsyncStorage.setItem(`course_${courseId}`, JSON.stringify(response.data));
          setError(null);
        } else {
          setError('Course not found');
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        if (isMounted) {
          setError('Failed to fetch course details. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCourseDetails();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Scroll to top when form is shown
  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      }, 100);
    }
  }, [showForm]);

  const formattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time24) => {
    if (!time24) return 'N/A';
    const [hours, minutes] = time24.split(':');
    let period = 'AM';
    let hours12 = parseInt(hours, 10);
    
    if (hours12 >= 12) {
      period = 'PM';
      if (hours12 > 12) {
        hours12 -= 12;
      }
    }
    if (hours12 === 0) {
      hours12 = 12;
    }
    
    return `${hours12}:${minutes} ${period}`;
  };

  const handleApplyClick = () => {
    setShowForm(true);
  };

  const handleBackPress = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      navigation.goBack();
    }
  };

  const handleDownloadPDF = async () => {
    if (course?.pdfLink) {
      try {
        const supported = await Linking.canOpenURL(course.pdfLink);
        if (supported) {
          await Linking.openURL(course.pdfLink);
        } else {
          Alert.alert('Error', 'Cannot open PDF link. Make sure you have a PDF viewer installed.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open PDF');
        console.error('Error opening PDF:', error);
      }
    } else {
      Alert.alert('Information', 'No PDF available for this course.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
        <ActivityIndicator size="large" color="#1a3b5d" />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
        <CourseHeader navigation={navigation} />
        <View style={styles.errorContent}>
          <Icon name="alert-circle" size={60} color="#dc3545" />
          <Text style={styles.errorText}>{error || 'Course not found'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Go Back to Courses</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
      
      <CourseHeader navigation={navigation} />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={handleBackPress}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color="#1a3b5d" />
            <Text style={styles.backButtonTextNav}>
              {showForm ? 'Back to Course Details' : 'Back to Courses'}
            </Text>
          </TouchableOpacity>

          {showForm ? (
            <CourseApplicationForm course={course} navigation={navigation} />
          ) : (
            <View style={styles.courseCard}>
              {/* Course Image */}
              <View style={styles.imageContainer}>
                {course.imageUrl ? (
                  <Image
                    source={{ uri: course.imageUrl }}
                    style={styles.courseImage}
                    resizeMode="cover"
                    onError={() => console.log('Failed to load course image')}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="book-open-variant" size={60} color="#718096" />
                    <Text style={styles.noImageText}>Course Image</Text>
                  </View>
                )}
              </View>

              {/* Course Content */}
              <View style={styles.cardContent}>
                {/* Course Title */}
                <Text style={styles.courseTitle}>{course.title || 'Untitled Course'}</Text>

                {/* Course Details Grid */}
                <View style={styles.detailsGrid}>
                  {/* Row 1 */}
                  <View style={styles.detailRow}>
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <Icon name="calendar" size={24} color="#1a3b5d" />
                        <Text style={styles.infoCardTitle}>Start Date</Text>
                      </View>
                      <Text style={styles.infoCardValue}>{formattedDate(course.startDate)}</Text>
                    </View>

                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <Icon name="clock-outline" size={24} color="#1a3b5d" />
                        <Text style={styles.infoCardTitle}>Timing</Text>
                      </View>
                      <Text style={styles.infoCardValue}>
                        {formatTime(course.startTime)} - {formatTime(course.endTime)}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View style={styles.detailRow}>
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <Icon name="calendar-alert" size={24} color="#1a3b5d" />
                        <Text style={styles.infoCardTitle}>Last Date to Apply</Text>
                      </View>
                      <Text style={styles.infoCardValue}>{formattedDate(course.lastDateToApply)}</Text>
                    </View>

                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <Icon name="currency-inr" size={24} color="#1a3b5d" />
                        <Text style={styles.infoCardTitle}>Course Fee</Text>
                      </View>
                      <Text style={styles.infoCardValue}>₹{course.fees || '0'}</Text>
                    </View>
                  </View>
                </View>

                {/* Course Description */}
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>Course Details</Text>
                  <Text style={styles.descriptionText}>
                    {course.details || 'No additional details available for this course.'}
                  </Text>
                </View>

                {/* PDF Download Section */}
                <View style={styles.pdfContainer}>
                  <Text style={styles.pdfTitle}>Course Materials</Text>
                  <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={handleDownloadPDF}
                    activeOpacity={0.8}
                  >
                    <Icon name="file-pdf-box" size={20} color="#1a3b5d" />
                    <Text style={styles.pdfButtonText}>Download Course Details (PDF)</Text>
                  </TouchableOpacity>
                </View>

                {/* Important Note */}
                <View style={styles.alertContainer}>
                  <Icon name="alert-circle-outline" size={24} color="#856404" />
                  <View style={styles.alertTextContainer}>
                    <Text style={styles.alertBold}>Important Note:</Text>
                    <Text style={styles.alertText}>
                      Application form will be rejected if fee is not paid before the last date.
                      Please ensure timely payment to secure your enrollment.
                    </Text>
                  </View>
                </View>

                {/* Apply Button */}
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApplyClick}
                  activeOpacity={0.8}
                >
                  <Icon name="send" size={20} color="#fff" style={styles.applyIcon} />
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1a3b5d',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  backButtonTextNav: {
    fontSize: 16,
    color: '#1a3b5d',
    marginLeft: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardContent: {
    padding: 20,
  },
  courseTitle: {
    fontSize: isTablet ? 28 : 24,
    color: '#1a202c',
    fontWeight: '700',
    marginBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#1a3b5d',
    paddingBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  detailsGrid: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: isTablet ? 'row' : 'column',
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: isTablet ? 8 : 0,
    marginVertical: isTablet ? 0 : 8,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#1a3b5d',
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  infoCardValue: {
    fontSize: isTablet ? 18 : 16,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: isTablet ? 20 : 18,
    color: '#1a3b5d',
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  descriptionText: {
    fontSize: isTablet ? 16 : 14,
    color: '#4a5568',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pdfContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  pdfTitle: {
    fontSize: isTablet ? 20 : 18,
    color: '#1a3b5d',
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a3b5d',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  pdfButtonText: {
    fontSize: isTablet ? 16 : 14,
    color: '#1a3b5d',
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  alertContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  alertTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  alertBold: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  alertText: {
    fontSize: isTablet ? 15 : 13,
    color: '#856404',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: '#1a3b5d',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a3b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyIcon: {
    marginRight: 10,
  },
  applyButtonText: {
    fontSize: isTablet ? 20 : 18,
    color: '#fff',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  backButton: {
    backgroundColor: '#1a3b5d',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default CourseDetails;