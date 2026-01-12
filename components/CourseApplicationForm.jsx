import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNPrint from 'react-native-print';
import API_BASE_URL from './ApiConfigCourse';
import styles from "./CourseApplicationFormStyles"

const CourseApplicationForm = ({ course, navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    age: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [showDashboardButton, setShowDashboardButton] = useState(false);
  const scrollViewRef = useRef(null);

  // Scroll to top when component mounts
  useEffect(() => {
    // Use setTimeout to ensure scroll happens after render
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  const generateApplicationId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    let period = 'AM';
    let hours12 = parseInt(hours);
    
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

  // Get logo base64 or URI - same as PaymentGateway
  const getBase64Logo = () => {
    return 'https://firebasestorage.googleapis.com/v0/b/exam-web-749cd.firebasestorage.app/o/logo%2FLOGO.jpg?alt=media&token=700951a7-726f-4f2c-8b88-3cf9edf9d82f';
  };

  // Generate Course Details PDF HTML - exact same styling as PaymentGateway
  const generateCourseDetailsPDF = (appId) => {
    const logoUri = getBase64Logo();
    const idToUse = appId || applicationId;
    
    return `
      <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
            }
            .document-container {
              width: 100%;
              height: 100%;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #1a3b5d 0%, #3b82f6 100%);
              color: white;
              padding: 20px 30px;
              text-align: center;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 10px;
            }
            .logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
              background: white;
              border-radius: 50%;
              padding: 5px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 3px;
              letter-spacing: 1px;
            }
            h2 {
              font-size: 14px;
              font-weight: 400;
              opacity: 0.95;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .content {
              padding: 20px 30px;
            }
            .app-id-box {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 12px 15px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #3b82f6;
              text-align: center;
            }
            .app-id-label {
              font-size: 10px;
              color: #1e40af;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 3px;
            }
            .app-id-value {
              font-size: 18px;
              color: #1e3a8a;
              font-weight: 800;
              letter-spacing: 2px;
            }
            .section-title {
              font-weight: 700;
              font-size: 13px;
              color: #1f2937;
              margin: 12px 0 8px;
              padding-bottom: 5px;
              border-bottom: 2px solid #3b82f6;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 15px;
            }
            .info-item {
              background: #f8fafc;
              padding: 8px 12px;
              border-radius: 6px;
              border-left: 3px solid #3b82f6;
            }
            .info-label {
              font-size: 9px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              font-weight: 600;
              margin-bottom: 3px;
            }
            .info-value {
              font-size: 12px;
              color: #1f2937;
              font-weight: 600;
            }
            .course-section {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              padding: 12px 15px;
              border-radius: 8px;
              margin: 15px 0;
              color: white;
            }
            .course-title {
              font-size: 10px;
              opacity: 0.9;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .course-name {
              font-size: 16px;
              font-weight: 800;
              margin-bottom: 10px;
            }
            .course-details {
              display: flex;
              justify-content: space-between;
              gap: 10px;
            }
            .course-detail-item {
              flex: 1;
            }
            .course-detail-label {
              font-size: 9px;
              opacity: 0.8;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            .course-detail-value {
              font-size: 12px;
              font-weight: 700;
            }
            .footer {
              text-align: center;
              padding: 12px 20px;
              background: #f8fafc;
              border-top: 2px dashed #e5e7eb;
              margin-top: 12px;
            }
            .footer-text {
              color: #6b7280;
              font-size: 9px;
              line-height: 1.4;
            }
            .barcode {
              margin-top: 8px;
              padding: 5px 10px;
              background: white;
              border-radius: 5px;
              display: inline-block;
              font-family: 'Courier New', monospace;
              font-size: 13px;
              font-weight: bold;
              letter-spacing: 2px;
              color: #1f2937;
              border: 2px dashed #3b82f6;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .document-container {
                page-break-after: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <div class="header">
              <div class="logo-container">
                ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" onerror="this.style.display='none'" />` : '<div style="width:60px;height:60px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;">🎓</div>'}
              </div>
              <h1>ARN STUDY ACADEMY</h1>
              <h2>Course Application Details</h2>
            </div>
            
            <div class="content">
              <div class="app-id-box">
                <div class="app-id-label">Application ID</div>
                <div class="app-id-value">${idToUse}</div>
              </div>

              <h3 class="section-title">📋 Applicant Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Full Name</div>
                  <div class="info-value">${formData.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Age</div>
                  <div class="info-value">${formData.age}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone Number</div>
                  <div class="info-value">${formData.phone}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${formData.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">City</div>
                  <div class="info-value">${formData.city}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">State</div>
                  <div class="info-value">${formData.state}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Pincode</div>
                  <div class="info-value">${formData.pincode}</div>
                </div>
              </div>

              <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #3b82f6; margin-bottom: 15px;">
                <div class="info-label">Address</div>
                <div class="info-value">${formData.address}</div>
              </div>

              <div class="course-section">
                <div class="course-title">Course Details</div>
                <div class="course-name">${course.title}</div>
                <div class="course-details">
                  <div class="course-detail-item">
                    <div class="course-detail-label">💰 Course Fee</div>
                    <div class="course-detail-value">₹${course.fees}</div>
                  </div>
                  <div class="course-detail-item">
                    <div class="course-detail-label">📅 Start Date</div>
                    <div class="course-detail-value">${formatDate(course.startDate)}</div>
                  </div>
                  <div class="course-detail-item">
                    <div class="course-detail-label">⏰ Timing</div>
                    <div class="course-detail-value">${formatTime(course.startTime)} - ${formatTime(course.endTime)}</div>
                  </div>
                </div>
              </div>

              <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 10px; margin: 15px 0;">
                <div style="font-size: 10px; color: #78350f; font-weight: bold; margin-bottom: 5px;">⚠️ IMPORTANT NOTES</div>
                <div style="font-size: 9px; color: #78350f; line-height: 1.4;">
                  <ul style="margin: 0; padding-left: 15px;">
                    <li style="margin-bottom: 4px;">Application form will be rejected if fee is not paid before the last date: ${formatDate(course.lastDateToApply)}.</li>
                    <li style="margin-bottom: 4px;">If fees is not paid before the last date, your application will be rejected.</li>
                    <li style="margin-bottom: 4px;">Please hold on; we will contact you within 2 days for fee payment and other details.</li>
                    <li style="margin-bottom: 4px;">After fee payment, check the application status for further information.</li>
                    <li style="margin-bottom: 4px;">For any further assistance, reach out to us from the help section on the home page.</li>
                  </ul>
                </div>
              </div>

              <div class="footer">
                <div class="footer-text">
                  <strong>This is a system-generated application document.</strong><br>
                  For any queries, contact: arnprivateexamconduct@gmail.com<br>
                  Application Date: ${formatDate(new Date())}
                </div>
                <div class="barcode">${idToUse}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Handle PDF Download
  const handleDownloadPDF = async (appId) => {
    try {
      const idToUse = appId || applicationId;
      if (!idToUse) {
        Alert.alert('Error', 'Application ID not found.');
        return;
      }

      const html = generateCourseDetailsPDF(idToUse);
      await RNPrint.print({ html });
      
      Alert.alert('Success', 'Application details PDF has been generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      scrollToTop();
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      scrollToTop();
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Invalid phone number. Must be 10 digits');
      scrollToTop();
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      scrollToTop();
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      scrollToTop();
      return false;
    }
    if (!formData.state.trim()) {
      setError('State is required');
      scrollToTop();
      return false;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      setError('Invalid pincode. Must be 6 digits');
      scrollToTop();
      return false;
    }
    if (!formData.age) {
      setError('Age is required');
      scrollToTop();
      return false;
    }
    const age = parseInt(formData.age);
    if (isNaN(age) || age <= 0 || age > 120) {
      setError('Please enter a valid age (1-120)');
      scrollToTop();
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setShowNotification(false);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const newApplicationId = generateApplicationId();
      setApplicationId(newApplicationId);
      
      const applicationData = {
        applicationId: newApplicationId,
        courseId: course.id,
        courseName: course.title,
        courseFees: course.fees,
        ...formData,
        applicationDate: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (data.success) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
        
        // Show success alert
        Alert.alert(
          'Application Submitted!',
          `Your application ID is: ${newApplicationId}. Our team will reach you soon!`,
          [{ text: 'OK' }]
        );
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          age: ''
        });
        
        scrollToTop();
        
        // Automatically download PDF after successful submission
        setTimeout(() => {
          handleDownloadPDF(newApplicationId);
        }, 1000);
        
        // Show the dashboard button
        setShowDashboardButton(true);
        
      } else {
        setError('Failed to submit application. Please try again.');
        scrollToTop();
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      scrollToTop();
      console.error('Error submitting application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNavigateToDashboard = () => {
    // Navigate to Dashboard screen
    if (navigation) {
      navigation.navigate('Dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 300 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name="clipboard-text" size={28} color="#fff" style={styles.headerIcon} />
          <Text style={styles.headerText}>Course Application Form</Text>
        </View>

        <View style={styles.cardBody}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#721c24" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Course Details Section */}
          <View style={styles.courseDetailsContainer}>
            <View style={styles.sectionTitleContainer}>
              <Icon name="book-open-variant" size={20} color="#1a3b5d" />
              <Text style={styles.sectionTitle}>Course Details</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Course Name:</Text>
                <Text style={styles.detailValue}>{course.title}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Course Fee:</Text>
                <Text style={styles.detailValue}>₹{course.fees}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>{formatDate(course.startDate)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Date to Apply:</Text>
                <Text style={styles.detailValue}>{formatDate(course.lastDateToApply)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Timing:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(course.startTime)} - {formatTime(course.endTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="account" size={18} color="#1a3b5d" />
                <Text style={styles.label}>Full Name *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="email" size={18} color="#1a3b5d" />
                <Text style={styles.label}>Email (Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="phone" size={18} color="#1a3b5d" />
                <Text style={styles.label}>Phone Number *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Age */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="account-clock" size={18} color="#1a3b5d" />
                <Text style={styles.label}>Age *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                placeholderTextColor="#999"
                value={formData.age}
                onChangeText={(value) => handleChange('age', value)}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* Address */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="map-marker" size={18} color="#1a3b5d" />
                <Text style={styles.label}>Address *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your address"
                placeholderTextColor="#999"
                value={formData.address}
                onChangeText={(value) => handleChange('address', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* City */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="city" size={18} color="#1a3b5d" />
                <Text style={styles.label}>City *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your city"
                placeholderTextColor="#999"
                value={formData.city}
                onChangeText={(value) => handleChange('city', value)}
              />
            </View>

            {/* State */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="map" size={18} color="#1a3b5d" />
                <Text style={styles.label}>State *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your state"
                placeholderTextColor="#999"
                value={formData.state}
                onChangeText={(value) => handleChange('state', value)}
              />
            </View>

            {/* Pincode */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Icon name="mailbox" size={18} color="#1a3b5d" />
                <Text style={styles.label}>Pincode *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your pincode"
                placeholderTextColor="#999"
                value={formData.pincode}
                onChangeText={(value) => handleChange('pincode', value)}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <Icon name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Continue to Dashboard Button (shown after successful submission) */}
            {showDashboardButton && (
              <TouchableOpacity
                style={[styles.dashboardButton, styles.submitButton]}
                onPress={handleNavigateToDashboard}
                activeOpacity={0.8}
              >
                <View style={styles.submitButtonContent}>
                  <Icon name="home" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Continue to Dashboard</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={showNotification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotification(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationTitleContainer}>
                <Icon name="check-circle" size={24} color="#fff" />
                <Text style={styles.notificationTitle}>Application Submitted!</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotification(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.notificationBody}>
              Application submitted successfully! Your application ID is: {applicationId}. Our team will reach you soon!
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Add this style to your CourseApplicationFormStyles.js file:
// dashboardButton: {
//   marginTop: 10,
// }

export default CourseApplicationForm;