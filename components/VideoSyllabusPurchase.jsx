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

const { width, height } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const VideoSyllabusPurchase = ({ route, navigation }) => {
  const { selectedSyllabus: initialSelectedSyllabus } = route.params || {};

  // State management
  const [stage, setStage] = useState('studentId');
  const [studentId, setStudentId] = useState('');
  const [existingStudentDetails, setExistingStudentDetails] = useState(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState(
    initialSelectedSyllabus,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [isEditingExistingData, setIsEditingExistingData] = useState(false);
  const [showSyllabusDetailsModal, setShowSyllabusDetailsModal] =
    useState(false);
  const [purchasedStudentDetails, setPurchasedStudentDetails] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [accessExpiration, setAccessExpiration] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phoneNo: '',
    email: '',
    district: '',
    state: '',
  });

  const indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  useEffect(() => {
    if (!selectedSyllabus) {
      Alert.alert(
        'Error',
        'No syllabus selected. Please select a syllabus first.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  }, [selectedSyllabus, navigation]);

  const getBase64Logo = () => {
    // This is your correct Firebase Storage public URL
    return 'https://firebasestorage.googleapis.com/v0/b/exam-web-749cd.firebasestorage.app/o/logo%2FLOGO.jpg?alt=media&token=700951a7-726f-4f2c-8b88-3cf9edf9d82f';
  };

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
  // Validation functions - only email and phone
  const validateEmail = email => {
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    return true; // Email is optional, so empty is valid
  };

  const validatePhoneNumber = phone => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const errors = {};

    // Only validate email and phone
    if (formData.email.trim() && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNo.trim() && !validatePhoneNumber(formData.phoneNo)) {
      errors.phoneNo = 'Phone number must be 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate Student Details PDF HTML
  const generateStudentDetailsPDF = (studentDetails, purchaseDate) => {
    const logoUri = getBase64Logo();
    const durationDays = selectedSyllabus.duration.split(' ')[0];
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
            .syllabus-section {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              padding: 12px 15px;
              border-radius: 8px;
              margin: 15px 0;
              color: white;
            }
            .syllabus-title {
              font-size: 10px;
              opacity: 0.9;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .syllabus-name {
              font-size: 16px;
              font-weight: 800;
              margin-bottom: 10px;
            }
            .syllabus-details {
              display: flex;
              justify-content: space-between;
              gap: 10px;
            }
            .syllabus-detail-item { flex: 1; }
            .syllabus-detail-label {
              font-size: 9px;
              opacity: 0.8;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            .syllabus-detail-value {
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
            <h1>ARN VIDEO SYLLABUS PURCHASE</h1>
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

            <div class="syllabus-section">
              <div class="syllabus-title">Video Syllabus Details</div>
              <div class="syllabus-name">${selectedSyllabus.title}</div>
              <div class="syllabus-details">
                <div class="syllabus-detail-item">
                  <div class="syllabus-detail-label">Category</div>
                  <div class="syllabus-detail-value">${
                    selectedSyllabus.category
                  }</div>
                </div>
                <div class="syllabus-detail-item">
                  <div class="syllabus-detail-label">Duration</div>
                  <div class="syllabus-detail-value">${
                    selectedSyllabus.duration
                  }</div>
                </div>
                <div class="syllabus-detail-item">
                  <div class="syllabus-detail-label">Purchase Date</div>
                  <div class="syllabus-detail-value">${formatDate(
                    purchaseDate,
                  )}</div>
                </div>
              </div>
              <div style="margin-top: 10px;">
                <div class="syllabus-detail-label">Access Expires On</div>
                <div class="syllabus-detail-value expiry-highlight">${formatDate(
                  expiry,
                )}</div>
              </div>
            </div>

            <h3 class="section-title">⚠️ Important Notes</h3>
            <div class="instructions">
              <ul>
                <li>Once a video syllabus is purchased, it is non-refundable under any circumstances.</li>
                <li>With your Student ID, you may purchase any syllabus without completing additional forms.</li>
                <li>Access to the video content will be automatically revoked after the expiration date.</li>
                <li>Your Student ID is a 6-digit number. Please keep it for future purchases.</li>
                <li>For technical support or inquiries, please contact our Help Center.</li>
                <li>ARN is not responsible for access issues due to connectivity problems on your end.</li>
              </ul>
            </div>

            <div class="footer">
              <div class="footer-text">
                <strong>This is a system-generated document.</strong><br>
                © 2025/26 ARN VIDEO SYLLABUS. All rights reserved.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Generate Invoice PDF HTML
  const generateInvoicePDF = () => {
    if (!purchasedStudentDetails || !selectedSyllabus) {
      Alert.alert(
        'Error',
        'Purchase details not found. Cannot generate invoice.',
      );
      return;
    }

    const logoUri = getBase64Logo();
    const isFree = selectedSyllabus.fees === 0 || selectedSyllabus.fees === '0';
    const invoicePaymentId = isFree
      ? `FREE-${Date.now()}`
      : paymentId || `INV-${Date.now()}`;
    const invoiceOrderId = isFree ? `FREE-ORDER-${Date.now()}` : orderId || '';

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
              <div class="company-name">ARN Video Syllabus Distribution</div>
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
              <div class="info-value">INV-${invoicePaymentId.substring(
                0,
                8,
              )}</div>
              
              <div class="info-label">Payment ID:</div>
              <div class="info-value">${invoicePaymentId}</div>
              
              <div class="info-label">Order ID:</div>
              <div class="info-value">${invoiceOrderId}</div>
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
              <strong>Video Syllabus:</strong> ${selectedSyllabus.title}
            </div>
            <div class="description-text">
              <strong>Access Duration:</strong> ${selectedSyllabus.duration}
            </div>
            <div class="description-text">
              <strong>Access Until:</strong> ${formatDate(accessExpiration)}
            </div>
            <div style="text-align: right; font-weight: bold; margin-top: 10px;">
              ${isFree ? 'FREE' : `₹ ${selectedSyllabus.fees}`}
            </div>
          </div>

          <div class="total-section">
            <div class="total-label">Total Amount:</div>
            <div class="total-amount">${
              isFree ? 'FREE' : `INR ${selectedSyllabus.fees}`
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

  const handlePhoneNumberChange = value => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');

    // Clear errors for phone number when user types
    if (formErrors.phoneNo) {
      setFormErrors(prev => ({ ...prev, phoneNo: '' }));
    }

    setFormData(prev => ({
      ...prev,
      phoneNo: numericValue.slice(0, 10), // Limit to 10 digits
    }));
  };

  const handleEmailChange = value => {
    // Clear errors for email when user types
    if (formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }

    setFormData(prev => ({
      ...prev,
      email: value,
    }));
  };

  // Verify Student ID
  const handleStudentIdVerification = async () => {
    if (!/^\d{6}$/.test(studentId)) {
      Alert.alert('Error', 'Student ID must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/video-verify-student/${studentId}`,
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

        const purchasesResponse = await axios.get(
          `${API_BASE_URL}/api/video-student-purchases/${studentId}`,
        );

        if (
          purchasesResponse.data.success &&
          purchasesResponse.data.purchases
        ) {
          const hasPurchasedThisSyllabus =
            purchasesResponse.data.purchases.some(
              purchase => purchase.syllabusId === selectedSyllabus.id,
            );

          if (hasPurchasedThisSyllabus) {
            Alert.alert(
              'Already Purchased',
              'You have already purchased this syllabus. You can access it from your dashboard.',
            );
          }
        }

        setIsEditingExistingData(true);
        setStage('newRegistration');
        setIsNewStudent(false);
        Alert.alert(
          'Success',
          'Student ID verified! You can update your details if needed.',
        );
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

  const handleFormChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value,
    }));
  };

  const registerOrUpdateStudentAfterPayment = async () => {
    try {
      let newStudentId = existingStudentDetails?.studentId;

      if (isNewStudent) {
        const studentData = { ...formData };
        const response = await axios.post(
          `${API_BASE_URL}/api/video-register-student`,
          studentData,
        );

        if (response.data.success) {
          newStudentId = response.data.studentId;
          setExistingStudentDetails({ ...formData, studentId: newStudentId });
        } else {
          throw new Error('Failed to register student');
        }
      } else if (isEditingExistingData) {
        const response = await axios.put(
          `${API_BASE_URL}/api/video-update-student/${existingStudentDetails.studentId}`,
          formData,
        );

        if (!response.data.success) {
          throw new Error('Failed to update student details');
        }
      }

      return newStudentId;
    } catch (error) {
      console.error('Error in student registration/update:', error);
      throw error;
    }
  };

  const handleUpdateStudentDetails = async () => {
    if (!existingStudentDetails || !existingStudentDetails.studentId) {
      Alert.alert('Error', 'Student ID is missing. Cannot update details.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/video-update-student/${existingStudentDetails.studentId}`,
        formData,
      );

      if (response.data.success) {
        setExistingStudentDetails({ ...response.data.studentDetails });
        Alert.alert('Success', 'Student details updated successfully!');
        setStage('syllabusDetails');
      } else {
        throw new Error(
          response.data.error || 'Failed to update student details',
        );
      }
    } catch (error) {
      console.error('Error updating student details:', error);
      Alert.alert('Error', `Update failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedWithExistingData = () => {
    setStage('syllabusDetails');
  };

  const handleProceedToSyllabusDetails = () => {
    if (validateForm()) {
      if (isEditingExistingData) {
        handleUpdateStudentDetails();
      } else {
        setStage('syllabusDetails');
      }
    }
  };

  const createOrder = async () => {
    try {
      const price = selectedSyllabus?.fees;
      if (
        price === 0 ||
        price === '0' ||
        price === undefined ||
        price === null ||
        price === ''
      ) {
        throw new Error('Cannot create payment order for free syllabus');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/create-video-order`,
        {
          amount: price,
          notes: {
            syllabusId: selectedSyllabus?.id || '',
            syllabusTitle: selectedSyllabus?.title || '',
            studentId: isNewStudent
              ? 'new_student'
              : existingStudentDetails?.studentId || '',
          },
        },
      );

      if (response.data.success) {
        return response.data.order;
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPayment = async paymentData => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/verify-video-payment`,
        {
          orderId: paymentData.razorpay_order_id,
          paymentId: paymentData.razorpay_payment_id,
          signature: paymentData.razorpay_signature,
          syllabusId: selectedSyllabus?.id || '',
          filePath: selectedSyllabus?.filePath || '',
          userId: isNewStudent
            ? 'new_student'
            : existingStudentDetails?.studentId || '',
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const savePurchaseDetails = async (paymentVerified, studentId) => {
    try {
      const currentDate = new Date();
      setPurchaseDate(currentDate);

      const durationDays = selectedSyllabus
        ? parseInt(selectedSyllabus.duration?.split(' ')[0] || 30)
        : 30;
      const accessEndDate = new Date(currentDate);
      accessEndDate.setDate(accessEndDate.getDate() + durationDays);
      setAccessExpiration(accessEndDate);

      const response = await axios.post(
        `${API_BASE_URL}/api/video-save-syllabus-purchase`,
        {
          studentId: studentId,
          syllabusDetails: {
            id: selectedSyllabus?.id || '',
            title: selectedSyllabus?.title || '',
            category: selectedSyllabus?.category || '',
            fees: selectedSyllabus?.fees || 0,
            duration: selectedSyllabus?.duration || '30 Days',
            description: selectedSyllabus?.description || '',
            filePath:
              selectedSyllabus?.filePath ||
              `syllabi/${selectedSyllabus?.id}.pdf` ||
              '',
            fileUrl: selectedSyllabus?.fileUrl || '',
          },
          paymentDetails: {
            status: 'completed',
            amount: selectedSyllabus?.fees || 0,
            paymentId: paymentId,
            orderId: orderId,
          },
          purchaseDate: currentDate.toISOString(),
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error saving purchase details:', error);
      throw error;
    }
  };

  const processSuccessfulPayment = async (paymentResponse, order) => {
    setIsLoading(true);

    try {
      setPaymentId(paymentResponse.razorpay_payment_id);
      setOrderId(order.id);

      const paymentVerified = await verifyPayment(paymentResponse);

      if (!paymentVerified.success) {
        throw new Error('Payment verification failed');
      }

      const studentId = await registerOrUpdateStudentAfterPayment();

      if (!studentId) {
        throw new Error('Failed to get student ID');
      }

      const purchaseSaved = await savePurchaseDetails(
        paymentVerified,
        studentId,
      );

      if (!purchaseSaved.success) {
        throw new Error('Failed to save purchase details');
      }

      const studentDetails = {
        ...formData,
        studentId: studentId,
      };

      setPurchasedStudentDetails(studentDetails);
      setIsPurchased(true);
      setShowSyllabusDetailsModal(true);

      setTimeout(() => {
        handleDownloadStudentPDF(studentDetails, new Date());
        setShowSyllabusDetailsModal(false);
      }, 2000);

      return true;
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert(
        'Error',
        `Payment processing error: ${error.message}. Please contact support.`,
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async order => {
    const options = {
      description: `${selectedSyllabus?.title || 'Syllabus'} Purchase`,
      image: require('../Images/LOGO.jpg'),
      currency: order.currency,
      key: 'rzp_live_bvTvgAdltDUW4O',
      amount: order.amount,
      name: 'ARN Video Syllabus',
      order_id: order.id,
      prefill: {
        email: formData.email || '',
        contact: formData.phoneNo,
        name: formData.name,
      },
      theme: { color: '#1a3b5d' },
    };

    RazorpayCheckout.open(options)
      .then(async data => {
        await processSuccessfulPayment(data, order);
      })
      .catch(error => {
        console.error('Payment error:', error);
        Alert.alert('Error', 'Payment cancelled or failed');
        setIsLoading(false);
      });
  };

  const handleSyllabusPurchase = async () => {
    setIsLoading(true);
    setError('');

    try {
      const syllabusPrice = selectedSyllabus?.fees;
      const isFree =
        syllabusPrice === 0 ||
        syllabusPrice === '0' ||
        syllabusPrice === undefined ||
        syllabusPrice === null ||
        syllabusPrice === '';

      if (isFree) {
        const freeOrderId = `FREE-ORDER-${Date.now()}`;
        const freePaymentId = `FREE-${Date.now()}`;

        setOrderId(freeOrderId);
        setPaymentId(freePaymentId);

        const studentId = await registerOrUpdateStudentAfterPayment();

        if (!studentId) {
          throw new Error('Failed to get student ID');
        }

        const currentDate = new Date();
        setPurchaseDate(currentDate);

        const durationDays = selectedSyllabus?.duration
          ? parseInt(selectedSyllabus.duration.split(' ')[0])
          : 30;
        const expiryDate = new Date(currentDate);
        expiryDate.setDate(expiryDate.getDate() + durationDays);
        setAccessExpiration(expiryDate);

        const purchaseData = {
          studentId: studentId,
          syllabusDetails: {
            id: selectedSyllabus?.id || '',
            title: selectedSyllabus?.title || '',
            category: selectedSyllabus?.category || '',
            fees: 0,
            duration: selectedSyllabus?.duration || '30 Days',
            description: selectedSyllabus?.description || '',
            filePath:
              selectedSyllabus?.filePath ||
              `syllabi/${selectedSyllabus?.id}.pdf` ||
              '',
            fileUrl: selectedSyllabus?.fileUrl || '',
          },
          paymentDetails: {
            status: 'completed',
            amount: 0,
            paymentId: freePaymentId,
            orderId: freeOrderId,
          },
          purchaseDate: currentDate.toISOString(),
        };

        const purchaseResponse = await axios.post(
          `${API_BASE_URL}/api/video-save-syllabus-purchase`,
          purchaseData,
        );

        if (!purchaseResponse.data || !purchaseResponse.data.success) {
          throw new Error(
            purchaseResponse.data?.message || 'Failed to save purchase details',
          );
        }

        const studentDetails = {
          ...formData,
          studentId: studentId,
        };

        setPurchasedStudentDetails(studentDetails);
        setIsPurchased(true);
        setShowSyllabusDetailsModal(true);

        setTimeout(() => {
          handleDownloadStudentPDF(studentDetails, currentDate);
          setShowSyllabusDetailsModal(false);
        }, 2000);

        Alert.alert('Success', 'Free video syllabus added to your account!');
      } else {
        const order = await createOrder();
        setOrderId(order.id);
        await handleRazorpayPayment(order);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      Alert.alert('Error', `Failed to process purchase: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigation.navigate('Dashboard');
  };

  const renderContent = () => {
    switch (stage) {
      case 'studentId':
        return (
          <View style={styles.stageContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>
                  Video Syllabus Registration
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
                    onChangeText={value => {
                      const numericValue = value.replace(/\D/g, '');
                      if (numericValue.length <= 6) {
                        setStudentId(numericValue);
                      }
                    }}
                    placeholder="Enter your 6-digit student ID"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <Text style={styles.inputHelp}>
                    Enter your 6-digit ID to quickly proceed with your purchase
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
                    setFormData({
                      name: '',
                      age: '',
                      gender: '',
                      phoneNo: '',
                      email: '',
                      district: '',
                      state: '',
                    });
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
              contentContainerStyle={[
                styles.scrollableContent,
                { paddingBottom: 113 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() =>
                showGenderDropdown && setShowGenderDropdown(false)
              }
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

                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.inputLabel}>Gender *</Text>
                      <View style={styles.genderSelectorContainer}>
                        <TouchableOpacity
                          style={[
                            styles.genderSelector,
                            !formData.gender && styles.genderPlaceholder,
                          ]}
                          onPress={() =>
                            setShowGenderDropdown(!showGenderDropdown)
                          }
                        >
                          <Text
                            style={[
                              styles.genderText,
                              !formData.gender && styles.genderPlaceholderText,
                            ]}
                          >
                            {formData.gender || 'Select Gender'}
                          </Text>
                          <Icon
                            name={
                              showGenderDropdown
                                ? 'arrow-drop-up'
                                : 'arrow-drop-down'
                            }
                            size={24}
                            color="#1a3b5d"
                          />
                        </TouchableOpacity>

                        {showGenderDropdown && (
                          <View style={styles.dropdownContainer}>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                handleFormChange('gender', 'Male');
                                setShowGenderDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownText}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                handleFormChange('gender', 'Female');
                                setShowGenderDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownText}>Female</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                handleFormChange('gender', 'Other');
                                setShowGenderDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownText}>Other</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        formErrors.phoneNo && styles.inputError,
                      ]}
                      value={formData.phoneNo}
                      onChangeText={handlePhoneNumberChange}
                      placeholder="Enter 10-digit phone number"
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholderTextColor="#9ca3af"
                    />
                    {formErrors.phoneNo ? (
                      <Text style={styles.errorMessageText}>
                        {formErrors.phoneNo}
                      </Text>
                    ) : (
                      <Text style={styles.inputHelp}>
                        Enter 10-digit number without country code
                      </Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email (Optional)</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        formErrors.email && styles.inputError,
                      ]}
                      value={formData.email}
                      onChangeText={handleEmailChange}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                    />
                    {formErrors.email ? (
                      <Text style={styles.errorMessageText}>
                        {formErrors.email}
                      </Text>
                    ) : (
                      <Text style={styles.inputHelp}>
                        Leave blank if you don't have an email
                      </Text>
                    )}
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

                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
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
                        !formData.state ||
                        formErrors.email ||
                        formErrors.phoneNo) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleProceedToSyllabusDetails}
                    disabled={
                      !formData.name ||
                      !formData.age ||
                      !formData.gender ||
                      !formData.phoneNo ||
                      !formData.district ||
                      !formData.state ||
                      !!formErrors.email ||
                      !!formErrors.phoneNo
                    }
                  >
                    <Icon name="arrow-forward" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      Proceed to Syllabus Details
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
                     <View style={{ height: 100 }} />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'syllabusDetails':
        return (
          <View style={styles.stageContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>
                  Video Syllabus Purchase Confirmation
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.sectionTitle}>Syllabus Details</Text>

                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Title:</Text>
                    <Text style={styles.detailValue}>
                      {selectedSyllabus?.title || 'Sample Syllabus'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>
                      {selectedSyllabus?.category || 'General'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={[styles.detailValue, styles.priceText]}>
                      {selectedSyllabus?.fees === 0 ||
                      selectedSyllabus?.fees === '0'
                        ? 'FREE'
                        : `₹${selectedSyllabus?.fees || '0'}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Validity:</Text>
                    <Text style={styles.detailValue}>
                      {selectedSyllabus?.duration || '30 Days'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student Name:</Text>
                    <Text style={styles.detailValue}>
                      {isNewStudent
                        ? formData.name
                        : isEditingExistingData
                        ? formData.name
                        : existingStudentDetails?.name || ''}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student ID:</Text>
                    <Text style={styles.detailValue}>
                      {isNewStudent
                        ? 'Will be generated'
                        : existingStudentDetails?.studentId || ''}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Description:</Text>
                  </View>
                  <Text style={styles.descriptionText}>
                    {selectedSyllabus?.description ||
                      'Comprehensive video syllabus for exam preparation.'}
                  </Text>
                </View>

                {!isPurchased ? (
                  <TouchableOpacity
                    style={[
                      styles.purchaseButton,
                      isLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleSyllabusPurchase}
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
                    {selectedSyllabus?.fees !== 0 &&
                      selectedSyllabus?.fees !== '0' && (
                        <View style={styles.warningBox}>
                          <Icon name="warning" size={20} color="#92400e" />
                          <Text style={styles.warningText}>
                            Important: If you don't download your invoice now,
                            you won't be able to access it in the future.
                          </Text>
                        </View>
                      )}

                    {selectedSyllabus?.fees !== 0 &&
                      selectedSyllabus?.fees !== '0' && (
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
                      <Text style={styles.homeButtonText}>
                        Back to Dashboard
                      </Text>
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

  if (!selectedSyllabus) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Icon name="error" size={60} color="#dc2626" />
          <Text style={styles.errorMessage}>No syllabus selected</Text>
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Syllabus Purchase</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      <Modal
        visible={showSyllabusDetailsModal}
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
                    <Text style={styles.modalLabel}>Syllabus:</Text>
                    <Text style={styles.modalValue}>
                      {selectedSyllabus?.title}
                    </Text>
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
                    <Text style={styles.modalLabel}>Payment ID:</Text>
                    <Text style={styles.modalValue}>{paymentId}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Valid Until:</Text>
                    <Text style={styles.modalValue}>
                      {accessExpiration && formatDate(accessExpiration)}
                    </Text>
                  </View>
                  <View style={styles.downloadingBox}>
                    <ActivityIndicator color="#3b82f6" size="small" />
                    <Text style={styles.downloadingText}>
                      Your purchase receipt is being downloaded...
                    </Text>
                  </View>
                  <View style={styles.successBox}>
                    <Icon name="check" size={16} color="#059669" />
                    <Text style={styles.successText}>
                      You can now access this video syllabus in your dashboard.
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
    paddingTop: 50,
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
  descriptionText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    marginTop: 4,
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
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
  successBox: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  successText: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  scrollableContainer: {
    flex: 1,
  },
  scrollableContent: {
    flexGrow: 1,
  },
  // Gender Dropdown Styles
  genderSelectorContainer: {
    position: 'relative',
  },
  genderSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  genderText: {
    fontSize: 16,
    color: '#374151',
  },
  genderPlaceholder: {
    // Style when no gender is selected
  },
  genderPlaceholderText: {
    color: '#9ca3af',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginTop: 2,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  errorMessageText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default VideoSyllabusPurchase;
