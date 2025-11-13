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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import RNPrint from 'react-native-print';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const PracticeTestPurchase = ({ route, navigation }) => {
  // Get selected exam from navigation params
  const { selectedExam: initialSelectedExam } = route.params || {};

  // State management
  const [stage, setStage] = useState('studentId');
  const [studentId, setStudentId] = useState('');
  const [existingStudentDetails, setExistingStudentDetails] = useState(null);
  const [selectedExam, setSelectedExam] = useState(initialSelectedExam);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [isEditingExistingData, setIsEditingExistingData] = useState(false);
  const [showExamDetailsModal, setShowExamDetailsModal] = useState(false);
  const [purchasedStudentDetails, setPurchasedStudentDetails] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Form data for new registration
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phoneNo: '',
    email: '',
    district: '',
    state: '',
  });

  // Check if exam was passed
  useEffect(() => {
    if (!selectedExam) {
      Alert.alert('Error', 'No exam selected. Please select an exam first.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [selectedExam, navigation]);

  // Helper function to get logo base64 or URI
  const getBase64Logo = () => {
    try {
      const logoSource = Image.resolveAssetSource(
        require('../Images/LOGO.jpg'),
      );
      return logoSource ? logoSource.uri : '';
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  };

  // Format date for display
  const formatDate = date => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate expiration date
  const calculateExpirationDate = (purchaseDate, durationString) => {
    const duration = parseInt(durationString.split(' ')[0]);
    const expirationDate = new Date(purchaseDate);
    expirationDate.setDate(expirationDate.getDate() + duration);
    return expirationDate;
  };

  // Generate Student Details PDF HTML
  const generateStudentDetailsPDF = (studentDetails, purchaseDate) => {
    const logoUri = getBase64Logo();
    const durationDays = selectedExam.duration.split(' ')[0];
    const expiry = new Date(purchaseDate);
    expiry.setDate(expiry.getDate() + parseInt(durationDays));

    return `
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 0; }
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              background: white;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #0a2342 0%, #2563eb 100%);
              padding: 20px 30px;
              text-align: center;
              color: white;
            }
            .logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
              background: white;
              border-radius: 50%;
              padding: 5px;
              margin: 0 auto 10px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .student-id-box {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 12px 15px;
              margin: 20px 30px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              text-align: center;
            }
            .student-id-label {
              font-size: 10px;
              color: #1e40af;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 3px;
            }
            .student-id-value {
              font-size: 18px;
              color: #1e3a8a;
              font-weight: 800;
              letter-spacing: 2px;
            }
            .content { padding: 20px 30px; }
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
            .exam-detail-item { flex: 1; }
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
            .expiry-highlight {
              color: #fff;
              font-weight: bold;
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
            .instructions li:last-child { border-bottom: none; }
            .instructions li:before {
              content: '✓';
              position: absolute;
              left: 0;
              color: #f59e0b;
              font-weight: bold;
              font-size: 12px;
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
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" />` : ''}
            <h1>ARN EXAM PRIVATE CONDUCT</h1>
          </div>
          
          <div class="student-id-box">
            <div class="student-id-label">Student ID</div>
            <div class="student-id-value">${studentDetails.studentId}</div>
          </div>

          <div class="content">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${studentDetails.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Age</div>
                <div class="info-value">${studentDetails.age}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">${studentDetails.gender}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Contact</div>
                <div class="info-value">${studentDetails.phoneNo}</div>
              </div>
            </div>

            <div class="exam-section">
              <div class="exam-title">Exam Details</div>
              <div class="exam-name">${selectedExam.title}</div>
              <div class="exam-details">
                <div class="exam-detail-item">
                  <div class="exam-detail-label">Duration</div>
                  <div class="exam-detail-value">${selectedExam.duration}</div>
                </div>
                <div class="exam-detail-item">
                  <div class="exam-detail-label">Purchase Date</div>
                  <div class="exam-detail-value">${formatDate(
                    purchaseDate,
                  )}</div>
                </div>
              </div>
              <div style="margin-top: 10px;">
                <div class="exam-detail-label">Expires On</div>
                <div class="exam-detail-value expiry-highlight">${formatDate(
                  expiry,
                )}</div>
              </div>
            </div>

            <h3 class="section-title">⚠️ Important Notes</h3>
            <div class="instructions">
              <ul>
                <li>Once an exam is purchased, it is non-refundable under any circumstances.</li>
                <li>With your Student ID, you may purchase any exam without completing additional forms.</li>
                <li>Access to the exam will be automatically revoked after the expiration date.</li>
                <li>All practice exams require submission of answers for all questions.</li>
                <li>For technical support or inquiries, please contact our Help Center.</li>
                <li>Ensure a stable internet connection during the exam purchase process.</li>
                <li>ARN is not responsible for access issues due to connectivity problems on your end.</li>
              </ul>
            </div>

            <div class="footer">
              <div class="footer-text">
                <strong>This is a system-generated document.</strong><br>
                © 2025/26 ARN EXAM PRIVATE CONDUCT. All rights reserved.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Generate Invoice PDF HTML
  const generateInvoicePDF = () => {
    if (!purchasedStudentDetails || !selectedExam) {
      Alert.alert(
        'Error',
        'Purchase details not found. Cannot generate invoice.',
      );
      return;
    }

    const logoUri = getBase64Logo();
    const paymentId =
      selectedExam.fees === 0
        ? `FREE-${Date.now()}`
        : paymentDetails?.paymentId || `INV-${Date.now()}`;
    const orderId =
      selectedExam.fees === 0
        ? `FREE-ORDER-${Date.now()}`
        : paymentDetails?.orderId || '';
    const isFree = selectedExam.fees === 0;

    const html = `
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 0; }
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
            .info-left, .info-right { flex: 1; }
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
            ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" />` : ''}
            <div class="company-info">
              <div class="company-name">ARN EXAM PRIVATE CONDUCT</div>
              <div class="company-details">
                Karnataka India 580011<br/>
                Phone: +91 6360785195<br/>
                Email: support@arn.com<br/>
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
              <div class="info-value">INV-${paymentId.substring(0, 8)}</div>
              
              <div class="info-label">Payment ID:</div>
              <div class="info-value">${paymentId}</div>
              
              <div class="info-label">Order ID:</div>
              <div class="info-value">${orderId}</div>
            </div>
            
            <div class="info-right">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date().toLocaleDateString(
                'en-IN',
              )}</div>
              
              <div class="info-label">Bill To:</div>
              <div class="info-value">
                ${purchasedStudentDetails.name || 'N/A'}<br/>
                ${purchasedStudentDetails.email || 'N/A'}<br/>
                ${purchasedStudentDetails.phoneNo || 'N/A'}<br/>
                ${purchasedStudentDetails.district || 'N/A'}, ${
      purchasedStudentDetails.state || 'N/A'
    }
              </div>
            </div>
          </div>

          ${
            !isFree
              ? '<div class="note-section"><div class="note-text">Note: The amount shown below is inclusive of 18% GST.</div></div>'
              : ''
          }

          <div class="table-header">
            <div>Description</div>
            <div>Amount (INR)</div>
          </div>

          <div class="table-content">
            <div class="description-text">
              <strong>Exam:</strong> ${selectedExam.title}
            </div>
            <div class="description-text">
              <strong>Access Duration:</strong> ${selectedExam.duration}
            </div>
            <div class="description-text">
              <strong>Expiry Date:</strong> ${formatDate(expirationDate)}
            </div>
            <div style="text-align: right; font-weight: bold; margin-top: 10px;">
              ${isFree ? 'FREE' : `₹ ${selectedExam.fees}`}
            </div>
          </div>

          <div class="total-section">
            <div class="total-label">Total Amount:</div>
            <div class="total-amount">${
              isFree ? 'FREE' : `INR ${selectedExam.fees}`
            }</div>
          </div>

          <div class="footer-divider"></div>

          <div class="footer-text">
            Thank you for your purchase. This is a computer-generated invoice.<br/>
            For any queries, please contact ARN support team.<br/>
            You can reach us through the Help section as well.
          </div>
        </body>
      </html>
    `;

    return html;
  };

  // Handle PDF Downloads
  const handleDownloadStudentPDF = async (studentDetails, purchaseDate) => {
    try {
      const html = generateStudentDetailsPDF(studentDetails, purchaseDate);
      await RNPrint.print({ html });
      Alert.alert('Success', 'Student details PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating student PDF:', error);
      Alert.alert('Error', 'Failed to generate student details PDF');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const html = generateInvoicePDF();
      if (html) {
        await RNPrint.print({ html });
        Alert.alert('Success', 'Invoice downloaded successfully!');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  // Fix for phone number autofill issue
  const handlePhoneNumberChange = (value) => {
    // Clear age field if it was autofilled with phone number data
    if (formData.age === value) {
      setFormData(prev => ({
        ...prev,
        age: ''
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      phoneNo: value
    }));
  };

  // Verify Student ID
  const handleStudentIdVerification = async () => {
    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter a student ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/verify-student/${studentId}`,
      );

      if (response.data.exists) {
        setExistingStudentDetails(response.data.studentDetails);
        setFormData({
          name: response.data.studentDetails.name || '',
          age: response.data.studentDetails.age || '',
          gender: response.data.studentDetails.gender || '',
          phoneNo: response.data.studentDetails.phoneNo || '',
          email: response.data.studentDetails.email || '',
          district: response.data.studentDetails.district || '',
          state: response.data.studentDetails.state || '',
        });

        setIsEditingExistingData(true);
        setStage('newRegistration');
        setIsNewStudent(false);
      } else {
        Alert.alert(
          'Not Found',
          'Student ID not found. Please register as a new student.',
        );
      }
    } catch (err) {
      console.error('Student verification error:', err);
      Alert.alert('Error', 'Error verifying student ID. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value,
    }));
  };

  // Proceed with existing data
  const handleProceedWithExistingData = () => {
    setStage('examDetails');
  };

  // Handle exam purchase
  const handleExamPurchase = async () => {
    setIsLoading(true);
    try {
      let studentDetails = existingStudentDetails;
      let currentPurchaseDate = new Date().toISOString();

      // Register new student if needed
      if (isNewStudent) {
        const registrationData = {
          ...formData,
          studentId: `STD-${Date.now()}`,
        };

        const registrationResponse = await axios.post(
          `${API_BASE_URL}/api/register-student`,
          registrationData,
        );

        if (!registrationResponse.data.success) {
          Alert.alert('Error', 'Registration failed. Please try again.');
          setIsLoading(false);
          return;
        }

        studentDetails = {
          ...registrationData,
          studentId: registrationResponse.data.studentId,
        };
      } else if (isEditingExistingData) {
        const updateResponse = await axios.put(
          `${API_BASE_URL}/api/update-student/${existingStudentDetails.studentId}`,
          formData,
        );

        if (!updateResponse.data.success) {
          Alert.alert('Error', 'Failed to update student information.');
          setIsLoading(false);
          return;
        }

        studentDetails = {
          ...formData,
          studentId: existingStudentDetails.studentId,
        };
      }

      // Calculate expiration date
      const durationDays = parseInt(selectedExam.duration.split(' ')[0]);
      const expiryDate = new Date(currentPurchaseDate);
      expiryDate.setDate(expiryDate.getDate() + durationDays);
      setExpirationDate(expiryDate);

      // Handle free exam
      if (selectedExam.fees === 0) {
        const purchaseResponse = await axios.post(
          `${API_BASE_URL}/api/save-exam-purchase`,
          {
            studentId: studentDetails.studentId,
            examDetails: {
              ...selectedExam,
              expirationDate: expiryDate.toISOString(),
            },
            paymentDetails: { amount: 0, status: 'free' },
            purchaseDate: currentPurchaseDate,
          },
        );

        setPurchasedStudentDetails(studentDetails);
        setShowExamDetailsModal(true);
        setIsPurchased(true);
        setIsLoading(false);

        setTimeout(() => {
          handleDownloadStudentPDF(studentDetails, currentPurchaseDate);
          setShowExamDetailsModal(false);
        }, 2000);

        return;
      }

      // Initiate Razorpay payment
      const orderResponse = await axios.post(
        `${API_BASE_URL}/api/create-order`,
        {
          amount: selectedExam.fees,
          studentId: studentDetails.studentId,
        },
      );

      const { order } = orderResponse.data;

      const options = {
        description: `${selectedExam.title} Exam Purchase`,
        image: require('../Images/LOGO.jpg'),
        currency: order.currency,
        key: 'rzp_live_bvTvgAdltDUW4O',
        amount: order.amount,
        name: 'ARN Exam Private Conduct',
        order_id: order.id,
        prefill: {
          email: studentDetails.email || '',
          contact: studentDetails.phoneNo,
          name: studentDetails.name,
        },
        theme: { color: '#0a2342' },
      };

      RazorpayCheckout.open(options)
        .then(async data => {
          try {
            const paymentVerifyResponse = await axios.post(
              `${API_BASE_URL}/api/verify-payment`,
              {
                orderId: order.id,
                paymentId: data.razorpay_payment_id,
                signature: data.razorpay_signature,
                studentId: studentDetails.studentId,
                examId: selectedExam.id,
              },
            );

            if (paymentVerifyResponse.data.success) {
              setPaymentDetails(paymentVerifyResponse.data.payment);

              await axios.post(`${API_BASE_URL}/api/save-exam-purchase`, {
                studentId: studentDetails.studentId,
                examDetails: {
                  ...selectedExam,
                  expirationDate: expiryDate.toISOString(),
                },
                paymentDetails: paymentVerifyResponse.data.payment,
                purchaseDate: currentPurchaseDate,
              });

              setPurchasedStudentDetails(studentDetails);
              setShowExamDetailsModal(true);
              setIsPurchased(true);

              setTimeout(() => {
                handleDownloadStudentPDF(studentDetails, currentPurchaseDate);
                setShowExamDetailsModal(false);
              }, 2000);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            Alert.alert(
              'Error',
              'Payment verification failed. Please try again.',
            );
          } finally {
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error('Payment error:', error);
          Alert.alert('Error', 'Payment failed. Please try again.');
          setIsLoading(false);
        });
    } catch (error) {
      console.error('Exam purchase error:', error);
      Alert.alert('Error', 'Failed to purchase exam. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle back to home
  const handleBackToHome = () => {
    navigation.navigate('Dashboard');
  };

  // Render content based on stage
  const renderContent = () => {
    switch (stage) {
      case 'studentId':
        return (
          <View style={styles.stageContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>
                  Practice Test Registration
                </Text>
              </View>
              <View style={styles.cardBody}>
                {error ? (
                  <View style={styles.errorAlert}>
                    <Icon name="error" size={20} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Student ID</Text>
                  <TextInput
                    style={styles.textInput}
                    value={studentId}
                    onChangeText={setStudentId}
                    placeholder="Enter your student ID"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.inputHelp}>
                    Enter your ID to auto-fill your details
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleStudentIdVerification}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="verified-user" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>
                        Verify Student ID
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setStage('newRegistration');
                    setIsNewStudent(true);
                    setIsEditingExistingData(false);
                  }}
                >
                  <Icon name="person-add" size={20} color="#3b82f6" />
                  <Text style={styles.secondaryButtonText}>
                    Register as New Student
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'newRegistration':
        return (
          <KeyboardAvoidingView 
            style={styles.stageContainer} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <ScrollView 
              style={styles.scrollableContainer}
              contentContainerStyle={[styles.scrollableContent, { paddingBottom: 113 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>
                    {isEditingExistingData
                      ? 'Update Student Information'
                      : 'New Student Registration'}
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  {isEditingExistingData && (
                    <View style={styles.infoAlert}>
                      <Icon name="info" size={20} color="#3b82f6" />
                      <View style={styles.infoAlertContent}>
                        <Text style={styles.infoAlertTitle}>
                          You are editing existing student data.
                        </Text>
                        <Text style={styles.infoAlertText}>
                          Student ID: {existingStudentDetails.studentId}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.name}
                      onChangeText={value => handleFormChange('name', value)}
                      placeholder="Enter full name"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Age *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.age}
                        onChangeText={value => handleFormChange('age', value)}
                        placeholder="Age"
                        keyboardType="numeric"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Gender *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.gender}
                        onChangeText={value => handleFormChange('gender', value)}
                        placeholder="E.g Male, Female, Other"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.phoneNo}
                      onChangeText={handlePhoneNumberChange}
                      placeholder="Enter 10-digit phone number"
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.email}
                      onChangeText={value => handleFormChange('email', value)}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.inputLabel}>District *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.district}
                        onChangeText={value =>
                          handleFormChange('district', value)
                        }
                        placeholder="Enter district"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>State *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.state}
                        onChangeText={value => handleFormChange('state', value)}
                        placeholder="E.g Karnataka"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (!formData.name ||
                        !formData.age ||
                        !formData.gender ||
                        !formData.phoneNo ||
                        !formData.district ||
                        !formData.state) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={() => setStage('examDetails')}
                    disabled={
                      !formData.name ||
                      !formData.age ||
                      !formData.gender ||
                      !formData.phoneNo ||
                      !formData.district ||
                      !formData.state
                    }
                  >
                    <Icon name="arrow-forward" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      Proceed to Exam Details
                    </Text>
                  </TouchableOpacity>

                  {isEditingExistingData && (
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={handleProceedWithExistingData}
                    >
                      <Text style={styles.outlineButtonText}>
                        Continue with Original Data
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'examDetails':
        return (
          <View style={styles.stageContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>
                  Exam Purchase Confirmation
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.sectionTitle}>Exam Details</Text>

                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Exam:</Text>
                    <Text style={styles.detailValue}>{selectedExam.title}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExam.category}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={[styles.detailValue, styles.priceText]}>
                      {selectedExam.fees === 0
                        ? 'FREE'
                        : `₹${selectedExam.fees}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Validity:</Text>
                    <Text style={styles.detailValue}>
                      {selectedExam.duration}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student Name:</Text>
                    <Text style={styles.detailValue}>
                      {isNewStudent
                        ? formData.name
                        : isEditingExistingData
                        ? formData.name
                        : existingStudentDetails.name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student ID:</Text>
                    <Text style={styles.detailValue}>
                      {isNewStudent
                        ? 'Will be generated'
                        : existingStudentDetails.studentId}
                    </Text>
                  </View>
                </View>

                {!isPurchased ? (
                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      isLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleExamPurchase}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Icon name="shopping-cart" size={20} color="#fff" />
                        <Text style={styles.purchaseButtonText}>
                          Confirm Purchase
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View>
                    {selectedExam.fees !== 0 && (
                      <View style={styles.warningBox}>
                        <Icon name="warning" size={20} color="#92400e" />
                        <Text style={styles.warningText}>
                          Important: If you don't download your invoice now, you
                          won't be able to access it in the future.
                        </Text>
                      </View>
                    )}

                    {selectedExam.fees !== 0 && (
                      <TouchableOpacity
                        style={styles.invoiceButton}
                        onPress={handleDownloadInvoice}
                      >
                        <Icon name="receipt" size={20} color="#fff" />
                        <Text style={styles.invoiceButtonText}>
                          Download Invoice
                        </Text>
                      </TouchableOpacity>
                    )}

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
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!selectedExam) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Icon name="error" size={60} color="#dc2626" />
          <Text style={styles.errorMessage}>No exam selected</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Purchase</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>

      {/* Exam Details Modal */}
      <Modal
        visible={showExamDetailsModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="check-circle" size={50} color="#10b981" />
              <Text style={styles.modalTitle}>Purchase Successful!</Text>
            </View>
            <View style={styles.modalBody}>
              {purchasedStudentDetails && (
                <View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Exam:</Text>
                    <Text style={styles.modalValue}>{selectedExam.title}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Student Name:</Text>
                    <Text style={styles.modalValue}>
                      {purchasedStudentDetails.name}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Student ID:</Text>
                    <Text style={styles.modalValue}>
                      {purchasedStudentDetails.studentId}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Valid Until:</Text>
                    <Text style={styles.modalValue}>
                      {expirationDate && formatDate(expirationDate)}
                    </Text>
                  </View>
                  <View style={styles.downloadingBox}>
                    <ActivityIndicator color="#3b82f6" size="small" />
                    <Text style={styles.downloadingText}>
                      Your exam details PDF is being downloaded...
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    paddingTop:50,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
  },
  stageContainer: {
    flex: 1,
  },
  scrollableContainer: {
    flex: 1,
  },
  scrollableContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#1a3b5d',
    padding: 16,
  },
  cardHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardBody: {
    padding: 20,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#374151',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    color: '#6b7280',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoAlert: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoAlertContent: {
    flex: 1,
    marginLeft: 8,
  },
  infoAlertTitle: {
    color: '#1e40af',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  infoAlertText: {
    color: '#374151',
    fontSize: 12,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  priceText: {
    color: '#059669',
    fontWeight: '700',
  },
  purchaseButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  warningText: {
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  invoiceButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  invoiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  homeButton: {
    backgroundColor: '#1a3b5d',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorMessage: {
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#059669',
    marginTop: 12,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  downloadingBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  downloadingText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default PracticeTestPurchase;