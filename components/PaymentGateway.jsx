import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import RNPrint from 'react-native-print';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const PaymentGateway = ({ route, navigation }) => {
  const { formData: initialFormData } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [hallTicketGenerated, setHallTicketGenerated] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  // Super User States
  const [showSuperUserCheck, setShowSuperUserCheck] = useState(false);
  const [superUserId, setSuperUserId] = useState('');
  const [superUserValidating, setSuperUserValidating] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [superUserDetails, setSuperUserDetails] = useState(null);

  // Normalize form data - match web implementation
  const formData = initialFormData || {};
  formData.examDate = Array.isArray(formData.examDate) ? formData.examDate[0] : formData.examDate;

  // Check if exam is free
  const isFreeExam = !formData.examPrice || parseInt(formData.examPrice) === 0;

  useEffect(() => {
    if (paymentCompleted && !hallTicketGenerated && !loading) {
      const timer = setTimeout(() => {
        handleCreateHallticket();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [paymentCompleted, hallTicketGenerated, loading]);

  if (!formData.exam) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#dc2626" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color="#dc2626" />
          <Text style={styles.errorText}>Invalid form data. Please go back and try again.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Helper function to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  // Helper function to get logo base64 or URI
  const getBase64Logo = () => {
  // This is your correct Firebase Storage public URL
  return 'https://firebasestorage.googleapis.com/v0/b/exam-web-749cd.firebasestorage.app/o/logo%2FLOGO.jpg?alt=media&token=700951a7-726f-4f2c-8b88-3cf9edf9d82f';
};

  // Policy Content
  const cancellationPolicy = `Cancellation Policy for ARN Private Exam Conduct

1. Eligibility for Cancellation
• Exam registration cancellations are allowed only if requested within a specified timeframe, typically 2 days before the scheduled exam date.
• Cancellation requests after the specified timeframe will not be entertained, except in extraordinary circumstances at our sole discretion.

2. Process for Cancellation
• Users must submit a written request for cancellation via email or the designated cancellation form available on our website.
• Cancellation requests must include the user's name, registration ID, and reason for cancellation.

3. Refund Policy
• Full refunds: If the cancellation request is made within 2 days after registration or before the cancellation deadline.
• Partial refunds: If allowed, these will deduct processing fees (e.g., payment gateway charges or administrative costs).
• No refunds: For cancellation requests made after the specified deadline or for users who fail to appear for the exam.

4. Contact for Cancellation Requests
• Users can contact us at +91 6360785195 for queries or to initiate a cancellation request.`;

  const termsAndConditions = `Terms and Conditions

1. Acceptance of Terms
• By accessing or using our services, you agree to abide by these Terms and Conditions.

2. Exam Conduct Guidelines
• Users must adhere to all instructions provided during the exam.
• Cheating, plagiarism, or any other form of malpractice is strictly prohibited.

3. Technical Issues During Examination
• In the event of any technical issues, system errors, or code-related problems during the examination, the affected results will not be considered valid.
• Candidates affected by technical issues will receive a full refund of their examination fees.
• Refunds will be processed within 7-10 business days.

4. Fees and Payments
• Exam fees must be paid in full before registration is considered complete.

5. Intellectual Property
• All content is the intellectual property of ARN Private Exam Conduct.

Privacy Policy

1. Information We Collect
• Personal Information: Name, email address, phone number, payment details, etc.
• Exam Data: Performance, answers, and scores.

2. How We Use Your Information
• To register and authenticate users.
• To conduct and manage online exams.
• To communicate updates, results, and notifications.

3. Data Security
• We employ industry-standard security measures to protect your data.`;

  // Generate Hall Ticket HTML with exact same styling as web version
// Updated generateHallTicketHTML function - Replace the existing function with this

const generateHallTicketHTML = (candidate) => {
  const logoUri = getBase64Logo();
  
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
          .ticket-container {
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
            position: relative;
          }
          .reg-id-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #3b82f6;
            text-align: center;
          }
          .reg-id-label {
            font-size: 10px;
            color: #1e40af;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 3px;
          }
          .reg-id-value {
            font-size: 18px;
            color: #1e3a8a;
            font-weight: 800;
            letter-spacing: 2px;
          }
          .candidate-photo {
            position: absolute;
            top: 90px;
            right: 30px;
            width: 100px;
            height: 120px;
            border: 3px solid #3b82f6;
            border-radius: 8px;
            object-fit: cover;
            background: #f8fafc;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
            margin-right: 120px;
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
          .exam-section {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 12px 15px;
            border-radius: 8px;
            margin: 15px 0;
            color: white;
          }
          .exam-title {
            font-size: 10px;
            opacity: 0.9;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .exam-name {
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 10px;
          }
          .exam-details {
            display: flex;
            justify-content: space-between;
            gap: 10px;
          }
          .exam-detail-item {
            flex: 1;
          }
          .exam-detail-label {
            font-size: 9px;
            opacity: 0.8;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          .exam-detail-value {
            font-size: 12px;
            font-weight: 700;
          }
          .section-title { 
            font-weight: 700;
            font-size: 13px;
            color: #1f2937;
            margin: 12px 0 8px;
            padding-bottom: 5px;
            border-bottom: 2px solid #3b82f6;
          }
          .instructions {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 10px;
          }
          .instructions ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .instructions li {
            padding: 4px 0;
            padding-left: 18px;
            position: relative;
            color: #78350f;
            font-size: 9px;
            line-height: 1.4;
            border-bottom: 1px solid #fde68a;
          }
          .instructions li:last-child {
            border-bottom: none;
          }
          .instructions li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
            font-size: 12px;
          }
          .sub-instruction {
            padding-left: 12px;
            margin-top: 3px;
            font-size: 8px;
            line-height: 1.3;
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
            .ticket-container {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="header">
            <div class="logo-container">
              ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" onerror="this.style.display='none'" />` : '<div style="width:60px;height:60px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;">🎓</div>'}
            </div>
            <h1>ARN STUDY ACADEMY</h1>
            <h2>Hall Ticket (Live Exam)</h2>
          </div>
          
          <div class="content">
            <div class="reg-id-box">
              <div class="reg-id-label">Registration ID</div>
              <div class="reg-id-value">${candidate.registrationNumber}</div>
            </div>

            ${candidate.photoUrl ? `<img src="${candidate.photoUrl}" alt="Candidate Photo" class="candidate-photo" />` : ''}

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Candidate Name</div>
                <div class="info-value">${candidate.candidateName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">${candidate.dob}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">${candidate.gender}</div>
              </div>
              <div class="info-item">
                <div class="info-label">District</div>
                <div class="info-value">${candidate.district}</div>
              </div>
              <div class="info-item">
                <div class="info-label">State</div>
                <div class="info-value">${candidate.state}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone Number</div>
                <div class="info-value">${candidate.phone}</div>
              </div>
            </div>

            <div class="exam-section">
              <div class="exam-title">Examination Details</div>
              <div class="exam-name">${candidate.exam}</div>
              <div class="exam-details">
                <div class="exam-detail-item">
                  <div class="exam-detail-label">📅 Date</div>
                  <div class="exam-detail-value">${candidate.examDate}</div>
                </div>
                <div class="exam-detail-item">
                  <div class="exam-detail-label">⏰ START TIME</div>
                  <div class="exam-detail-value">${formatTime(candidate.examStartTime)}</div>
                </div>
                <div class="exam-detail-item">
                  <div class="exam-detail-label">⏰ END TIME</div>
                  <div class="exam-detail-value">${formatTime(candidate.examEndTime)}</div>
                </div>
              </div>
            </div>

            <h3 class="section-title">⚠️ Important Instructions</h3>
            <div class="instructions">
              <ul>
                <li>Registration must be completed at least 15 minutes prior to the exam.</li>
                <li>Participants must stay logged in and avoid leaving the platform until the exam begins.</li>
                <li>Registration ID and Hall Ticket are mandatory for the exam.</li>
                <li>Ensure a stable internet connection throughout the exam, with at least 300 MB of data available.</li>
                <li>Once the exam starts, entry will not be granted.</li>
                <li>The Registration ID is valid only for the selected exams.</li>
                <li>Only attempted answers will be considered after the exam ends.</li>
                <li>Result Status Rules:
                  <div class="sub-instruction"><strong>Attempted:</strong> Displayed if the user completes and submits all questions in the exam.</div>
                  <div class="sub-instruction"><strong>Network Error:</strong> Displayed if any of the following occurs: Interruption from a mobile call, Exiting and reentering the exam tab, Insufficient or exhausted mobile data, Searching for questions on external platforms, Turning off the web camera during the session.</div>
                  <div class="sub-instruction"><strong>Not Attended:</strong> Displayed if the user does not attempt the exam at all.</div>
                </li>
              </ul>
            </div>

            <div class="footer">
              <div class="footer-text">
                <strong>This is a system-generated hall ticket.</strong><br>
                For any queries, contact: arnprivateexamconduct@gmail.com
              </div>
              <div class="barcode">${candidate.registrationNumber}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

  // Prepare registration data - match web implementation
  const prepareRegistrationData = () => {
    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === 'photo') {
        if (formData[key]) {
          formDataToSend.append('photo', {
            uri: formData[key].uri,
            type: formData[key].type || 'image/jpeg',
            name: formData[key].fileName || 'photo.jpg',
          });
        }
      } else if (key === 'examDate') {
        const examDate = Array.isArray(formData.examDate) ? formData.examDate[0] : formData.examDate;
        formDataToSend.append('examDate', examDate);
      } else if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Add payment details based on registration type
    if (isSuperUser) {
      formDataToSend.append('paymentId', 'SUPER_USER');
      formDataToSend.append('orderId', `SUPER_${superUserDetails.userId}_${Date.now()}`);
      formDataToSend.append('paymentAmount', '0');
      formDataToSend.append('paymentDate', new Date().toISOString());
      formDataToSend.append('superUserId', superUserDetails.userId);
      formDataToSend.append('superUserPhone', superUserDetails.phoneNo);
    } else if (paymentDetails) {
      formDataToSend.append('paymentId', paymentDetails.paymentId);
      formDataToSend.append('orderId', paymentDetails.orderId);
      formDataToSend.append('paymentAmount', paymentDetails.amount);
      formDataToSend.append('paymentDate', paymentDetails.date);
    } else if (isFreeExam) {
      formDataToSend.append('paymentId', 'FREE_EXAM');
      formDataToSend.append('orderId', `FREE_${Date.now()}`);
      formDataToSend.append('paymentAmount', '0');
      formDataToSend.append('paymentDate', new Date().toISOString());
    }

    return formDataToSend;
  };

  // Super User Modal Component
  const SuperUserModal = () => {
    const [localSuperUserId, setLocalSuperUserId] = useState(superUserId);
    const [localError, setLocalError] = useState('');

    const handleVerify = async () => {
      if (!localSuperUserId.trim()) {
        setLocalError('Please enter user ID');
        return;
      }

      setSuperUserValidating(true);
      setLocalError('');

      try {
        const response = await axios.get(`${API_BASE_URL}/api/super-user-all`);
        
        if (response.data.success && response.data.purchasers) {
          const user = response.data.purchasers.find(
            purchaser => purchaser.userId === localSuperUserId.trim()
          );

          if (!user) {
            setLocalError('User ID not found in super user list');
            setSuperUserValidating(false);
            return;
          }

          if (!user.hasActiveSubscription) {
            setLocalError('Your super user subscription has expired');
            setSuperUserValidating(false);
            return;
          }

          const expiryDate = new Date(user.latestExpiry);
          const currentDate = new Date();

          if (expiryDate < currentDate) {
            setLocalError('Your super user subscription has expired');
            setSuperUserValidating(false);
            return;
          }

          setSuperUserId(localSuperUserId);
          setIsSuperUser(true);
          setSuperUserDetails({
            userId: user.userId,
            name: user.userDetails.name,
            phoneNo: user.userDetails.phoneNo,
            expiryDate: user.latestExpiry
          });
          setShowSuperUserCheck(false);
          
          Alert.alert(
            'Super User Verified!',
            `Name: ${user.userDetails.name}\nValid Until: ${expiryDate.toLocaleDateString()}`,
            [{ text: 'OK' }]
          );
        } else {
          setLocalError('Failed to fetch super user data');
        }
      } catch (error) {
        console.error('Super user validation error:', error);
        setLocalError('Failed to validate super user. Please try again.');
      } finally {
        setSuperUserValidating(false);
      }
    };

    return (
      <Modal
        visible={showSuperUserCheck}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Super User Verification</Text>
              <TouchableOpacity onPress={() => setShowSuperUserCheck(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {localError ? (
                <View style={styles.errorAlert}>
                  <Icon name="warning" size={20} color="#dc2626" />
                  <Text style={styles.errorAlertText}>{localError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enter Your User ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={localSuperUserId}
                  onChangeText={(text) => {
                    setLocalSuperUserId(text);
                    setLocalError('');
                  }}
                  placeholder="Enter your super user ID"
                  placeholderTextColor="#9ca3af"
                  editable={!superUserValidating}
                />
                <Text style={styles.inputHelp}>
                  Enter the user ID associated with your super user account
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowSuperUserCheck(false)}
                disabled={superUserValidating}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, (!localSuperUserId.trim() || superUserValidating) && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={!localSuperUserId.trim() || superUserValidating}
              >
                {superUserValidating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify Super User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Policy Modal Component
  const PolicyModal = () => {
    const [activeTab, setActiveTab] = useState('cancellation');

    return (
      <Modal
        visible={showPolicyModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: height * 0.8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Policies and Terms</Text>
              <TouchableOpacity onPress={() => setShowPolicyModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'cancellation' && styles.activeTab]}
                onPress={() => setActiveTab('cancellation')}
              >
                <Text style={[styles.tabText, activeTab === 'cancellation' && styles.activeTabText]}>
                  Cancellation Policy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
                onPress={() => setActiveTab('terms')}
              >
                <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
                  Terms & Privacy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.policyContent}>
              <Text style={styles.policyText}>
                {activeTab === 'cancellation' ? cancellationPolicy : termsAndConditions}
              </Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.policyFooter}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setPolicyAccepted(!policyAccepted)}
              >
                <View style={[styles.checkbox, policyAccepted && styles.checkboxChecked]}>
                  {policyAccepted && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I have read and agree to all policies and terms
                </Text>
              </TouchableOpacity>

              <View style={styles.policyButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowPolicyModal(false)}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, !policyAccepted && styles.buttonDisabled]}
                  onPress={() => {
                    setShowPolicyModal(false);
                    if (isSuperUser || isFreeExam) {
                      handleFreeRegistration();
                    } else {
                      handlePayment();
                    }
                  }}
                  disabled={!policyAccepted}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSuperUser || isFreeExam ? 'Complete Registration' : 'Proceed to Payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Payment Functions
  const handleFreeRegistration = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      const paymentData = isSuperUser ? {
        paymentId: 'SUPER_USER',
        orderId: `SUPER_${superUserDetails.userId}_${Date.now()}`,
        amount: '0',
        date: new Date().toISOString()
      } : {
        paymentId: 'FREE_EXAM',
        orderId: `FREE_${Date.now()}`,
        amount: '0',
        date: new Date().toISOString()
      };

      setPaymentDetails(paymentData);
      setPaymentCompleted(true);
      setPaymentProcessing(false);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to complete registration');
      setPaymentProcessing(false);
    }
  };

  const createOrder = async () => {
    try {
      const orderData = {
        amount: parseInt(formData.examPrice),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          examId: formData.exam,
          candidateName: formData.candidateName,
          email: formData.email || 'NA',
          phone: formData.phone
        }
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/create-order`, orderData);

      if (!data.success || !data.order || !data.order.id) {
        throw new Error(data.error || 'Invalid order response');
      }

      return data.order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw new Error(error.response?.data?.error || 'Failed to create payment order');
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/verify-payment`,
        {
          orderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature
        }
      );

      if (!data.success) {
        throw new Error(data.error || 'Payment verification failed');
      }

      setPaymentDetails({
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        amount: formData.examPrice,
        date: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Payment verification failed. Please contact support.');
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      const order = await createOrder();

      const options = {
        description: `Exam Registration for ${formData.exam}`,
        image: require('../Images/LOGO.jpg'),
        currency: 'INR',
        key: "rzp_live_bvTvgAdltDUW4O",
        amount: parseInt(formData.examPrice) * 100,
        name: "ARN Study Academy",
        order_id: order.id,
        prefill: {
          email: formData.email || '',
          contact: formData.phone,
          name: formData.candidateName
        },
        theme: { color: '#3399cc' }
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          try {
            setError(null);
            await verifyPayment(data);
            setPaymentCompleted(true);
          } catch (error) {
            setError(error.message);
            setPaymentProcessing(false);
          }
        })
        .catch((error) => {
          setError(`Payment failed: ${error.description}`);
          setPaymentProcessing(false);
        });

    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error.message || 'Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  const initiatePaymentProcess = () => {
    // Reset policy acceptance state when opening modal
    setPolicyAccepted(false);
    setShowPolicyModal(true);
  };

  // Generate Invoice HTML - Match web implementation exactly
  const generateInvoiceHTML = () => {
    if (!paymentDetails) return '';
    
    const logoUri = getBase64Logo();
    
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
              font-family: 'Helvetica', Arial, sans-serif;
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 20mm;
            }
            .header-banner {
              background: #0052a5;
              height: 15mm;
              margin: -20mm -20mm 0 -20mm;
            }
            .logo-section {
              display: flex;
              align-items: flex-start;
              margin-top: 20px;
              margin-bottom: 20px;
            }
            .logo {
              width: 40mm;
              height: 40mm;
              object-fit: contain;
            }
            .company-info {
              margin-left: 20px;
              flex: 1;
            }
            .company-name {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 10pt;
              line-height: 1.6;
              color: #333;
            }
            .invoice-title-section {
              background: #f5f5f5;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin: 20px auto;
              width: 80mm;
            }
            .invoice-title {
              font-size: 22pt;
              font-weight: bold;
              color: #0052a5;
            }
            .divider {
              height: 1px;
              background: #0052a5;
              margin: 15px 0;
            }
            .info-section {
              margin: 15px 0;
              display: flex;
              justify-content: space-between;
            }
            .info-left, .info-right {
              flex: 1;
            }
            .info-label {
              font-weight: bold;
              font-size: 11pt;
              margin-bottom: 3px;
            }
            .info-value {
              font-size: 11pt;
              margin-bottom: 8px;
            }
            .note-section {
              background: #e6f0ff;
              border-radius: 6px;
              padding: 10px 15px;
              margin: 15px 0;
            }
            .note-text {
              font-size: 12pt;
              font-weight: bold;
              font-style: italic;
              color: #0052a5;
            }
            .table-header {
              background: #0052a5;
              color: white;
              padding: 10px;
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 11pt;
            }
            .table-content {
              padding: 15px 10px;
              border-bottom: 1px solid #f0f0f0;
            }
            .description-text {
              font-size: 11pt;
              margin-bottom: 7px;
            }
            .total-section {
              background: #0052a5;
              color: white;
              padding: 15px;
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-radius: 5px;
            }
            .total-label {
              font-weight: bold;
              font-size: 11pt;
            }
            .total-amount {
              font-size: 12pt;
              font-weight: bold;
            }
            .footer-divider {
              height: 1px;
              background: #000;
              margin: 20px 0;
            }
            .footer-text {
              text-align: center;
              font-size: 10pt;
              font-style: italic;
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="header-banner"></div>
          
          <div class="logo-section">
            ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" onerror="this.style.display='none'" />` : ''}
            <div class="company-info">
              <div class="company-name">Karnataka Ayan Wholesale Supply Enterprises</div>
              <div class="company-details">
                Karnataka India 580011<br/>
                Phone: +91 6360785195<br/>
                Email: Jubedakbar@gmail.com<br/>
                GSTIN: 29BXYPN0096F1ZS
              </div>
            </div>
          </div>

          <div class="invoice-title-section">
            <div class="invoice-title">INVOICE</div>
          </div>

          <div class="divider"></div>

          <div class="info-section">
            <div class="info-left">
              <div class="info-label">Invoice Number:</div>
              <div class="info-value">INV-${paymentDetails.paymentId.substring(0, 8)}</div>
              
              <div class="info-label">Payment ID:</div>
              <div class="info-value">${paymentDetails.paymentId}</div>
              
              <div class="info-label">Order ID:</div>
              <div class="info-value">${paymentDetails.orderId}</div>
            </div>
            
            <div class="info-right">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date().toLocaleDateString('en-IN')}</div>
              
              <div class="info-label">Bill To:</div>
              <div class="info-value">
                ${formData.candidateName || 'N/A'}<br/>
                ${formData.email || 'N/A'}<br/>
                ${formData.phone || 'N/A'}<br/>
                ${formData.district || 'N/A'}, ${formData.state || 'N/A'}<br/>
                ${formData.pincode || 'N/A'}
              </div>
            </div>
          </div>

          <div class="note-section">
            <div class="note-text">Note: The amount shown below is inclusive of 18% GST.</div>
          </div>

          <div class="table-header">
            <div>Description</div>
            <div>Amount (INR)</div>
          </div>

          <div class="table-content">
            <div class="description-text">
              <strong>Exam Registration:</strong> ${formData.exam}
            </div>
            <div class="description-text">
              <strong>Exam Date:</strong> ${formData.examDate}
            </div>
            <div class="description-text">
              <strong>Time:</strong> ${formData.examStartTime} to ${formData.examEndTime}
            </div>
            <div style="text-align: right; font-weight: bold; margin-top: 10px;">
              ₹ ${formData.examPrice}
            </div>
          </div>

          <div class="total-section">
            <div class="total-label">Total Amount:</div>
            <div class="total-amount">INR ${formData.examPrice}</div>
          </div>

          <div class="footer-divider"></div>

          <div class="footer-text">
            Thank you for your payment. This is a computer-generated invoice.<br/>
            For any queries, please contact +91 6360785195<br/>
            You can reach us through the Help section as well.
          </div>
        </body>
      </html>
    `;
  };

  // Generate Invoice - Match web implementation
  const handleGenerateInvoice = async () => {
    try {
      if (!paymentDetails) {
        setError('Payment details not found.');
        return;
      }

      if (isFreeExam || isSuperUser) {
        Alert.alert('Info', 'No invoice is generated for free registrations.');
        return;
      }

      const html = generateInvoiceHTML();
      await RNPrint.print({ html });
      
      setInvoiceGenerated(true);
      Alert.alert('Success', 'Invoice has been generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice. Please try again.');
    }
  };

  // PDF Generation Functions - Match web implementation
  const handleCreateHallticket = async () => {
    if (hallTicketGenerated) {
      Alert.alert('Info', 'Hall ticket has already been generated.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = prepareRegistrationData();

      console.log('Sending registration request...');

      const registrationResponse = await axios.post(
        `${API_BASE_URL}/api/register`,
        formDataToSend,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 
        }
      );

      console.log('Registration response:', registrationResponse.data);

      if (!registrationResponse.data.success) {
        throw new Error(registrationResponse.data.error || 'Registration failed');
      }

      // Fetch latest candidate data - match web implementation
      const response = await axios.get(`${API_BASE_URL}/api/latest-candidate`);
      const candidate = response.data.candidate;

      if (!candidate) {
        throw new Error('Failed to fetch candidate details');
      }

      console.log('Candidate details received:', candidate);

      setRegistrationNumber(candidate.registrationNumber);

      // Generate and print hall ticket with new styling
      const html = generateHallTicketHTML(candidate);
      await RNPrint.print({ html });
      
      setHallTicketGenerated(true);
      Alert.alert('Success', 'Hall ticket has been generated successfully!');
    } catch (error) {
      console.error('Error generating hall ticket:', error);
      
      // Detailed error handling - match web implementation
      let errorMessage = 'Failed to create hall ticket';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data.error || 'Invalid registration data';
            break;
          case 409:
            errorMessage = 'You have already registered for this exam.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.message || 'Failed to create hall ticket';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Check your internet connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSuperUserCheck = () => {
    setError(null);
    setShowSuperUserCheck(true);
  };

  const handleBackToHome = () => {
    navigation.navigate('Dashboard');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSuperUser ? 'Super User Registration' : isFreeExam ? 'Free Exam Registration' : 'Payment Gateway'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBanner}>
            <Icon name="error" size={20} color="#fff" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {isSuperUser && (
          <View style={styles.superUserBanner}>
            <Icon name="verified-user" size={24} color="#fff" />
            <View style={styles.superUserContent}>
              <Text style={styles.superUserTitle}>✓ Super User Verified</Text>
              <Text style={styles.superUserText}>
                User ID: {superUserDetails.userId}{'\n'}
                Name: {superUserDetails.name}{'\n'}
                Phone: {superUserDetails.phoneNo}{'\n'}
                Valid Until: {new Date(superUserDetails.expiryDate).toLocaleDateString()}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Payment Bypass Activated</Text>
              </View>
            </View>
          </View>
        )}

        {/* Help Banner */}
        <View style={styles.helpBanner}>
          <Icon name="help" size={20} color="#92400e" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Contact: +91 6360785195{'\n'}
              • Keep payment screenshot ready{'\n'}
              • Visit help section for support
            </Text>
          </View>
        </View>

        {/* Exam Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Exam {isSuperUser || isFreeExam ? 'Registration' : 'Payment'} Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exam:</Text>
            <Text style={styles.detailValue}>{formData.exam}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exam Date:</Text>
            <Text style={styles.detailValue}>{formData.examDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exam Time:</Text>
            <Text style={styles.detailValue}>{formData.examStartTime} to {formData.examEndTime}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Candidate Name:</Text>
            <Text style={styles.detailValue}>{formData.candidateName}</Text>
          </View>

          {isSuperUser ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.superUserBadge}>SUPER USER - NO PAYMENT REQUIRED</Text>
            </View>
          ) : isFreeExam ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.freeExamBadge}>FREE EXAM</Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.amountValue}>₹{formData.examPrice}</Text>
            </View>
          )}
        </View>

        {registrationNumber && (
          <View style={styles.registrationBanner}>
            <Icon name="info" size={24} color="#1e40af" />
            <View style={styles.registrationContent}>
              <Text style={styles.registrationTitle}>Important! Save Your Registration Number</Text>
              <Text style={styles.registrationNumber}>{registrationNumber}</Text>
              <Text style={styles.registrationNote}>
                Please keep this number safe. You will need it to access your exam.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!paymentCompleted ? (
            <View>
              {!isFreeExam && !isSuperUser && (
                <TouchableOpacity
                  style={styles.superUserButton}
                  onPress={handleOpenSuperUserCheck}
                  disabled={paymentProcessing || loading}
                >
                  <Icon name="star" size={20} color="#fff" />
                  <Text style={styles.superUserButtonText}>Are you a Super User? Click here</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryActionButton, paymentProcessing && styles.buttonDisabled]}
                onPress={initiatePaymentProcess}
                disabled={paymentProcessing || loading}
              >
                {paymentProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon name={isSuperUser || isFreeExam ? "how-to-reg" : "payment"} size={20} color="#fff" />
                )}
                <Text style={styles.primaryActionButtonText}>
                  {paymentProcessing ? 'Processing...' : 
                   isSuperUser || isFreeExam ? 'Complete Registration' : 'Proceed to Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.successBanner}>
                <Icon name="check-circle" size={24} color="#059669" />
                <Text style={styles.successText}>
                  {isSuperUser ? 'Super User registration completed!' : 
                   isFreeExam ? 'Registration completed!' : 
                   'Payment completed!'}
                </Text>
              </View>

              {!hallTicketGenerated ? (
                <View style={styles.generatingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.generatingText}>Generating your hall ticket automatically...</Text>
                </View>
              ) : (
                <View style={styles.successBanner}>
                  <Icon name="download-done" size={24} color="#3b82f6" />
                  <Text style={styles.successText}>Hall Ticket Generated Successfully!</Text>
                </View>
              )}

              {/* Only show invoice button for paid exams */}
              {!isFreeExam && !isSuperUser && hallTicketGenerated && (
                <View style={styles.downloadButtons}>
                  <TouchableOpacity
                    style={[styles.downloadButton, styles.invoiceButton]}
                    onPress={handleGenerateInvoice}
                    disabled={loading || !paymentDetails}
                  >
                    <Icon name="receipt" size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>
                      {invoiceGenerated ? 'Download Invoice Again' : 'Download Invoice'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!isFreeExam && !isSuperUser && !invoiceGenerated && (
                <View style={styles.warningBanner}>
                  <Icon name="warning" size={20} color="#92400e" />
                  <Text style={styles.warningText}>
                    Important: If you don't download your invoice now, you won't be able to access it in the future.
                  </Text>
                </View>
              )}

              {/* Show Back to Home button after both hall ticket and invoice are generated */}
              {(hallTicketGenerated && (isFreeExam || isSuperUser || invoiceGenerated)) && (
                <View style={styles.homeButtonContainer}>
                  <TouchableOpacity
                    style={styles.homeButton}
                    onPress={handleBackToHome}
                  >
                    <Icon name="home" size={20} color="#fff" />
                    <Text style={styles.homeButtonText}>Back to Home</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <PolicyModal />
      <SuperUserModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1a3b5d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1a3b5d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  superUserBanner: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  superUserContent: {
    flex: 1,
    marginLeft: 12,
  },
  superUserTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  superUserText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  helpBanner: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  helpText: {
    color: '#92400e',
    fontSize: 14,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  amountValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  badgeContainer: {
    marginTop: 8,
  },
  superUserBadge: {
    backgroundColor: '#059669',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  freeExamBadge: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registrationBanner: {
    backgroundColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  registrationContent: {
    flex: 1,
    marginLeft: 12,
  },
  registrationTitle: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  registrationNumber: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  registrationNote: {
    color: '#6b7280',
    fontSize: 14,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  superUserButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  superUserButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryActionButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  primaryActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successBanner: {
    backgroundColor: '#d1fae5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  generatingContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  generatingText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  downloadButtons: {
    gap: 12,
  },
  downloadButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  invoiceButton: {
    backgroundColor: '#059669',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  homeButtonContainer: {
    marginTop: 16,
  },
  homeButton: {
    backgroundColor: '#1a3b5d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorAlertText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Policy Modal Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  policyContent: {
    flex: 1,
    padding: 16,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  policyFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  policyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  homeButtonContainer: {
  marginTop: 16,
  marginBottom: 30, // Extra padding to account for mobile navigation bar
},
homeButton: {
  backgroundColor: '#1a3b5d',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  borderRadius: 8,
},
homeButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 8,
},
});

export default PaymentGateway;