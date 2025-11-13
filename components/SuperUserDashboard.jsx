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
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import RNPrint from 'react-native-print';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const SuperUserDashboard = ({ navigation }) => {
  // State management
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // User registration states
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [userId, setUserId] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phoneNo: '',
    email: '',
    district: '',
    state: '',
  });

  // Success modal states
  const [purchasedUserDetails, setPurchasedUserDetails] = useState(null);
  const [purchaseExpiry, setPurchaseExpiry] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getBase64Logo = () => {
    try {
      const logoSource = Image.resolveAssetSource(require('../Images/LOGO.jpg'));
      return logoSource ? logoSource.uri : '';
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Fetch subscription plans
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin-super-user`);

      if (res.data.success) {
        setSubscriptions(res.data.data);
        setError('');
      } else {
        setError(res.data.message || 'Failed to load subscriptions');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching subscriptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  // Handle purchase button click
  const handlePurchaseClick = (sub) => {
    setSelectedSubscription(sub);
    setShowRegistrationModal(true);
    setUserId('');
    setIsExistingUser(false);
    setUserFormData({
      name: '',
      age: '',
      gender: '',
      phoneNo: '',
      email: '',
      district: '',
      state: '',
    });
  };

  // Check if user ID exists
  const handleUserIdCheck = async () => {
    if (!/^\d{6}$/.test(userId)) {
      Alert.alert('Error', 'User ID must be exactly 6 digits.');
      return;
    }

    setIsCheckingUser(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/super-user-verify/${userId}`);

      if (response.data.exists) {
        const userDetails = response.data.userDetails;
        setUserFormData({
          name: userDetails.name,
          age: userDetails.age,
          gender: userDetails.gender,
          phoneNo: userDetails.phoneNo,
          email: userDetails.email || '',
          district: userDetails.district,
          state: userDetails.state,
        });
        setIsExistingUser(true);
        Alert.alert('Success', 'User ID verified successfully!');
      } else {
        Alert.alert('Not Found', 'User ID not found. Please fill in the registration form.');
        setIsExistingUser(false);
      }
    } catch (error) {
      console.error('Error verifying user ID:', error);
      Alert.alert('Error', 'Error verifying user ID. Please try again.');
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate Student Details PDF HTML
  const generateUserPDF = (userDetails, subscription, expiryDate) => {
    const logoUri = getBase64Logo();
    const currentDate = new Date();

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
              background: linear-gradient(135deg, #0a2342 0%, #2c3e50 100%);
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
            .company-info {
              font-size: 10px;
              opacity: 0.9;
              margin-top: 5px;
            }
            .user-id-box {
              background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
              padding: 15px;
              margin: 20px 30px;
              border-radius: 8px;
              border-left: 4px solid #0a2342;
              text-align: center;
            }
            .user-id-label {
              font-size: 12px;
              color: #0a2342;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .user-id-value {
              font-size: 20px;
              color: #0a2342;
              font-weight: 800;
              letter-spacing: 3px;
            }
            .content { padding: 20px 30px; }
            .section-title {
              font-weight: 700;
              font-size: 14px;
              color: #0a2342;
              margin: 15px 0 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #0a2342;
              text-transform: uppercase;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .info-item {
              background: #f8fafc;
              padding: 10px 12px;
              border-radius: 6px;
              border-left: 3px solid #667eea;
            }
            .info-label {
              font-size: 10px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 12px;
              color: #1f2937;
              font-weight: 600;
            }
            .subscription-section {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              color: white;
            }
            .subscription-title {
              font-size: 11px;
              opacity: 0.9;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subscription-name {
              font-size: 16px;
              font-weight: 800;
              margin-bottom: 12px;
            }
            .subscription-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 10px;
            }
            .subscription-detail-item {
              background: rgba(255, 255, 255, 0.15);
              padding: 8px;
              border-radius: 4px;
            }
            .subscription-detail-label {
              font-size: 9px;
              opacity: 0.8;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            .subscription-detail-value {
              font-size: 12px;
              font-weight: 700;
            }
            .expiry-box {
              background: rgba(220, 38, 38, 0.2);
              border: 2px solid #dc2626;
              padding: 10px;
              border-radius: 6px;
              margin-top: 10px;
            }
            .expiry-label {
              font-size: 10px;
              opacity: 0.9;
              margin-bottom: 3px;
            }
            .expiry-value {
              font-size: 13px;
              font-weight: 800;
              color: #fef2f2;
            }
            .instructions {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 12px;
              margin: 15px 0;
            }
            .instructions ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .instructions li {
              padding: 5px 0;
              padding-left: 20px;
              position: relative;
              color: #78350f;
              font-size: 9px;
              line-height: 1.5;
              border-bottom: 1px solid #fde68a;
            }
            .instructions li:last-child { border-bottom: none; }
            .instructions li:before {
              content: '•';
              position: absolute;
              left: 0;
              color: #f59e0b;
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              padding: 15px 20px;
              background: #0a2342;
              color: white;
              margin-top: 20px;
            }
            .footer-text {
              font-size: 9px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" />` : ''}
            <h1>ARN PVT SUPER USER</h1>
            <div class="company-info">
              Karnataka India 580011<br/>
              Phone: +91 6360785195 | Email: jubedakbar@gmail.com
            </div>
          </div>
          
          <div class="user-id-box">
            <div class="user-id-label">User ID</div>
            <div class="user-id-value">${userDetails.userId}</div>
          </div>

          <div class="content">
            <h3 class="section-title">User Details</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${userDetails.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Age</div>
                <div class="info-value">${userDetails.age}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">${userDetails.gender}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Contact</div>
                <div class="info-value">${userDetails.phoneNo}</div>
              </div>
              ${userDetails.email ? `
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${userDetails.email}</div>
                </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${userDetails.district}, ${userDetails.state}</div>
              </div>
            </div>

            <h3 class="section-title">Subscription Details</h3>
            <div class="subscription-section">
              <div class="subscription-title">Super User Plan</div>
              <div class="subscription-name">${subscription.month}-Month Subscription</div>
              <div class="subscription-details">
                <div class="subscription-detail-item">
                  <div class="subscription-detail-label">Plan Month</div>
                  <div class="subscription-detail-value">${subscription.month} Month${subscription.month > 1 ? 's' : ''}</div>
                </div>
                <div class="subscription-detail-item">
                  <div class="subscription-detail-label">Amount Paid</div>
                  <div class="subscription-detail-value">₹${subscription.finalPrice}</div>
                </div>
                <div class="subscription-detail-item">
                  <div class="subscription-detail-label">Discount</div>
                  <div class="subscription-detail-value">${subscription.discountPercent}% OFF</div>
                </div>
                <div class="subscription-detail-item">
                  <div class="subscription-detail-label">Total Days</div>
                  <div class="subscription-detail-value">${subscription.totalDays} Days</div>
                </div>
                <div class="subscription-detail-item">
                  <div class="subscription-detail-label">Bonus Days</div>
                  <div class="subscription-detail-value">${subscription.extraDays} Days</div>
                </div>
                <div class="subscription-detail-item">
                  <div class="subscription-detail-label">Purchase Date</div>
                  <div class="subscription-detail-value">${formatDate(currentDate)}</div>
                </div>
              </div>
              <div class="expiry-box">
                <div class="expiry-label">Valid Until</div>
                <div class="expiry-value">${formatDate(expiryDate)}</div>
              </div>
            </div>

            <h3 class="section-title">⚠️ Important Notes</h3>
            <div class="instructions">
              <ul>
                <li>Once a super user subscription is purchased, it is non-refundable under any circumstances.</li>
                <li>With your User ID, you may purchase any subscription without completing additional forms.</li>
                <li>Super user access will be automatically revoked after the expiration date.</li>
                <li>Your User ID is a 6-digit number. Please keep it safe for future purchases.</li>
                <li>For technical support or inquiries, please contact our Help Center.</li>
              </ul>
            </div>

            <div class="footer">
              <div class="footer-text">
                <strong>This is a system-generated document.</strong><br/>
                © 2025/26 ARN VIDEO SYLLABUS. All rights reserved.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Generate Invoice PDF HTML
  const generateInvoicePDF = (userDetails, subscription, expiryDate, paymentId, orderId) => {
    const logoUri = getBase64Logo();

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
              <div class="company-name">Super User Platform</div>
              <div class="company-details">
                Karnataka India 580011<br/>
                Phone: +91 6360785195<br/>
                Email: support@superuser.com<br/>
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
              <div class="info-value">INV-${paymentId ? paymentId.substring(0, 8) : new Date().getTime().toString().substring(0, 8)}</div>
              
              <div class="info-label">Payment ID:</div>
              <div class="info-value">${paymentId || 'N/A'}</div>
              
              <div class="info-label">Order ID:</div>
              <div class="info-value">${orderId || 'N/A'}</div>
            </div>
            
            <div class="info-right">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date().toLocaleDateString('en-IN')}</div>
              
              <div class="info-label">Bill To:</div>
              <div class="info-value">
                ${userDetails.name || 'N/A'}<br/>
                ${userDetails.email || 'N/A'}<br/>
                ${userDetails.phoneNo || 'N/A'}<br/>
                ${userDetails.district || 'N/A'}, ${userDetails.state || 'N/A'}
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
              <strong>Super User Subscription:</strong> ${subscription.month}-Month Plan
            </div>
            <div class="description-text">
              <strong>Validity:</strong> ${subscription.totalDays} days (including ${subscription.extraDays} bonus days)
            </div>
            <div class="description-text">
              <strong>Discount Applied:</strong> ${subscription.discountPercent}%
            </div>
            <div class="description-text">
              <strong>Access Until:</strong> ${formatDate(expiryDate)}
            </div>
            <div style="text-align: right; font-weight: bold; margin-top: 10px;">
              INR ${subscription.finalPrice}
            </div>
          </div>

          <div class="total-section">
            <div class="total-label">Total Amount:</div>
            <div class="total-amount">INR ${subscription.finalPrice}</div>
          </div>

          <div class="footer-divider"></div>

          <div class="footer-text">
            Thank you for your purchase. This is a computer-generated invoice.<br/>
            For any queries, please contact Super User Platform support team.<br/>
            You can reach us through the Help section as well.
          </div>
        </body>
      </html>
    `;
  };

  // Handle PDF Downloads
  const handleDownloadUserPDF = async (userDetails, subscription, expiryDate) => {
    try {
      const html = generateUserPDF(userDetails, subscription, expiryDate);
      await RNPrint.print({ html });
      Alert.alert('Success', 'Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate receipt PDF');
    }
  };

  const handleDownloadInvoice = async () => {
    if (!purchasedUserDetails || !selectedSubscription) {
      Alert.alert('Error', 'Purchase details not found. Cannot generate invoice.');
      return;
    }

    try {
      const html = generateInvoicePDF(
        purchasedUserDetails,
        selectedSubscription,
        purchaseExpiry,
        paymentId,
        orderId
      );
      await RNPrint.print({ html });
      Alert.alert('Success', 'Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  // Process payment
  const handleProceedToPurchase = async () => {
    if (!userFormData.name || !userFormData.age || !userFormData.gender ||
        !userFormData.phoneNo || !userFormData.district || !userFormData.state) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const orderRes = await axios.post(`${API_BASE_URL}/api/create-super-user-order`, {
        amount: selectedSubscription.finalPrice,
        notes: {
          planMonth: selectedSubscription.month,
          subscriptionId: selectedSubscription.id,
        },
      });

      if (!orderRes.data.success) {
        throw new Error('Failed to create order');
      }

      const order = orderRes.data.order;

      const options = {
        description: `${selectedSubscription.month}-Month Super User Subscription`,
        image: require('../Images/LOGO.jpg'),
        currency: order.currency || 'INR',
        key: 'rzp_live_bvTvgAdltDUW4O',
        amount: order.amount,
        name: 'Super User Subscription',
        order_id: order.id,
        prefill: {
          email: userFormData.email || '',
          contact: userFormData.phoneNo,
          name: userFormData.name,
        },
        theme: { color: '#0d6efd' },
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/api/verify-super-user-payment`, {
              orderId: data.razorpay_order_id,
              paymentId: data.razorpay_payment_id,
              signature: data.razorpay_signature,
              userId: userId || null,
              subscriptionId: selectedSubscription.id,
              planMonth: selectedSubscription.month,
            });

            if (!verifyRes.data.success) {
              Alert.alert('Error', 'Payment Verification Failed!');
              return;
            }

            const purchaseDate = new Date();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + selectedSubscription.totalDays);

            const completePurchaseRes = await axios.post(`${API_BASE_URL}/api/super-user-complete-purchase`, {
              userId: userId || null,
              name: userFormData.name,
              age: userFormData.age,
              gender: userFormData.gender,
              phoneNo: userFormData.phoneNo,
              email: userFormData.email,
              district: userFormData.district,
              state: userFormData.state,
              subscriptionDetails: {
                id: selectedSubscription.id,
                month: selectedSubscription.month,
                price: selectedSubscription.price,
                discountPercent: selectedSubscription.discountPercent,
                finalPrice: selectedSubscription.finalPrice,
                totalDays: selectedSubscription.totalDays,
                extraDays: selectedSubscription.extraDays
              },
              paymentDetails: {
                orderId: data.razorpay_order_id,
                paymentId: data.razorpay_payment_id,
                amount: selectedSubscription.finalPrice,
                status: 'completed'
              },
              purchaseDate: purchaseDate.toISOString(),
              expiryDate: expiryDate.toISOString()
            });

            if (completePurchaseRes.data.success) {
              const finalUserId = completePurchaseRes.data.userId;

              setPaymentId(data.razorpay_payment_id);
              setOrderId(data.razorpay_order_id);

              setPurchasedUserDetails({
                ...userFormData,
                userId: finalUserId
              });
              setPurchaseExpiry(expiryDate);

              setShowRegistrationModal(false);
              setShowSuccessModal(true);

              setTimeout(() => {
                handleDownloadUserPDF(
                  { ...userFormData, userId: finalUserId },
                  selectedSubscription,
                  expiryDate
                );
              }, 1000);

              Alert.alert('Success', 'Payment Successful! Super User Subscription Activated.');
            } else {
              Alert.alert('Error', 'Failed to save purchase details!');
            }
          } catch (error) {
            console.error('Error in payment handler:', error);
            Alert.alert('Error', 'Error processing payment. Please contact support.');
          } finally {
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error('Payment error:', error);
          Alert.alert('Error', 'Payment cancelled or failed');
          setLoading(false);
        });

      setLoading(false);
    } catch (error) {
      console.error('Purchase Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong during purchase');
      setLoading(false);
    }
  };

  const benefits = [
    { icon: '⚡', title: 'Unlimited Live Exam Access', color: '#FF6B6B' },
    { icon: '📄', title: 'Unlimited PDF Syllabus', color: '#4ECDC4' },
    { icon: '🎥', title: 'Unlimited Video Syllabus', color: '#FFD93D' },
    { icon: '📚', title: 'Unlimited Practice Tests', color: '#95E1D3' },
    { icon: '🎧', title: 'Quick Admin Support', color: '#A78BFA' }
  ];

  const usageSteps = [
    {
      number: '01',
      title: 'Practice Tests',
      description: 'Navigate to the Practice Test dashboard, click "My Practice Tests", and enter your Super User ID to unlock all available practice tests.',
      icon: '📚',
      color: '#8B5CF6'
    },
    {
      number: '02',
      title: 'PDF Syllabus',
      description: 'Go to the PDF Syllabus dashboard, click "My Study Material", and input your Super User ID to access all PDF syllabus materials.',
      icon: '📄',
      color: '#3B82F6'
    },
    {
      number: '03',
      title: 'Video Syllabus',
      description: 'Visit the Video Syllabus dashboard, select "My Video Syllabus Material", and enter your Super User ID to view all video syllabus content.',
      icon: '🎥',
      color: '#10B981'
    },
    {
      number: '04',
      title: 'Live Exam Registration',
      description: 'On the exam registration payment page, click "Are you a Super User? Click here", enter your User ID to bypass payment. Click "Complete Registration" to download your Live Exam ID.',
      icon: '⚡',
      color: '#F59E0B'
    },
    {
      number: '05',
      title: '24/7 Support Available',
      description: 'If you encounter any issues or have questions, our admin team is available around the clock through the Help section to assist you.',
      icon: '🎧',
      color: '#EC4899'
    }
  ];

  const importantNotes = [
    { icon: '🔒', title: 'Non-Refundable', text: 'Once purchased, super user subscriptions are non-refundable.' },
    { icon: '🎫', title: 'Reusable User ID', text: 'Your User ID can be used for future purchases without re-registration.' },
    { icon: '⏰', title: 'Auto Expiry', text: 'Super user access will expire automatically after the subscription period.' },
    { icon: '🔐', title: 'Keep ID Safe', text: 'Keep your 6-digit User ID safe for future transactions.' },
    { icon: '💬', title: '24/7 Support', text: 'For support or queries, contact our help center anytime.' },
    { icon: '🔑', title: 'Lost User ID?', text: 'If you lose your User ID, contact admin team for instant recovery.' }
  ];

  if (loading && subscriptions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2c3e50" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading amazing plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2c3e50" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Icon name="error" size={60} color="#dc2626" />
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2c3e50" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeIcon}>🛡️</Text>
          <Text style={styles.headerBadgeText}>Premium Access</Text>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSuperText}>Super</Text>
          <Text style={styles.headerUserText}> User </Text>
          <Text style={styles.headerSubscriptionsText}>Subscriptions</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
        }
      >
        {/* Subscription Plans */}
        <View style={styles.plansSection}>
          {subscriptions.map((sub, index) => (
            <View key={sub.id} style={[styles.pricingCard, index === 1 && styles.popularCard]}>
              {index === 1 && (
                <View style={styles.popularBadge}>
                  <Icon name="star" size={12} color="#fff" />
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{sub.month} Month{sub.month > 1 ? 's' : ''}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>₹{sub.price}</Text>
                  <View style={styles.finalPriceRow}>
                    <Text style={styles.finalPrice}>₹{sub.finalPrice}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{sub.discountPercent}% OFF</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.planDetails}>
                <View style={styles.detailRow}>
                  <Icon name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.detailText}><Text style={styles.detailBold}>{sub.totalDays}</Text> Total Days</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.detailText}><Text style={styles.detailBold}>{sub.extraDays}</Text> Bonus Days</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.detailText}>Full Feature Access</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.purchaseButton, index === 1 ? styles.primaryButton : styles.secondaryButton]}
                onPress={() => handlePurchaseClick(sub)}
              >
                <Text style={styles.purchaseButtonText}>Get Started Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>What's Included in Super User Subscription?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '20' }]}>
                  <Text style={[styles.benefitIconText, { color: benefit.color }]}>{benefit.icon}</Text>
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How to Use Section */}
        <View style={styles.usageSection}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageHeaderIcon}>🔑</Text>
            <Text style={styles.usageSectionTitle}>How to Use Your Super User ID</Text>
          </View>
          <Text style={styles.usageSubtitle}>Follow these simple steps to unlock all premium features with your 6-digit Super User ID</Text>

          {usageSteps.map((step, index) => (
            <View key={index} style={styles.usageCard}>
              <View style={styles.usageCardHeader}>
                <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <Text style={styles.stepIcon}>{step.icon}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>

        {/* Important Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Icon name="info" size={24} color="#0d6efd" />
            <Text style={styles.notesTitle}>Important Information</Text>
          </View>
          <View style={styles.notesGrid}>
            {importantNotes.map((note, index) => (
              <View key={index} style={styles.noteCard}>
                <Text style={styles.noteIcon}>{note.icon}</Text>
                <View style={styles.noteContent}>
                  <Text style={styles.noteHeading}>{note.title}</Text>
                  <Text style={styles.noteText}>{note.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025/2026 Karnataka Ayan Wholesale Supply Enterprises. All Rights Reserved.</Text>
          <Text style={styles.footerSubtext}>Empowering Minds, Developing India.</Text>
        </View>
      </ScrollView>

      {/* Registration Modal */}
      <Modal
        visible={showRegistrationModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowRegistrationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar backgroundColor="#667eea" barStyle="light-content" />
          
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRegistrationModal(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalHeaderContent}>
              <Icon name="person-add" size={24} color="#fff" />
              <Text style={styles.modalHeaderText}>User Registration</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedSubscription && (
                <View style={styles.planAlert}>
                  <View style={styles.planAlertRow}>
                    <Text style={styles.planAlertLabel}>Selected Plan:</Text>
                    <Text style={styles.planAlertValue}>{selectedSubscription.month}-Month Plan</Text>
                  </View>
                  <View style={styles.planAlertRow}>
                    <Text style={styles.planAlertLabel}>Amount:</Text>
                    <Text style={styles.planAlertPrice}>₹{selectedSubscription.finalPrice}</Text>
                  </View>
                  <View style={styles.planAlertRow}>
                    <Text style={styles.planAlertLabel}>Validity:</Text>
                    <Text style={styles.planAlertValue}>{selectedSubscription.totalDays} days</Text>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Have a User ID? <Text style={styles.optionalBadge}>Optional</Text></Text>
                <View style={styles.userIdInputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                    value={userId}
                    onChangeText={(value) => {
                      const numericValue = value.replace(/\D/g, '');
                      if (numericValue.length <= 6) {
                        setUserId(numericValue);
                      }
                    }}
                    placeholder="Enter 6-digit User ID"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[styles.verifyButton, (isCheckingUser || userId.length !== 6) && styles.buttonDisabled]}
                    onPress={handleUserIdCheck}
                    disabled={isCheckingUser || userId.length !== 6}
                  >
                    {isCheckingUser ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHelp}>If you have purchased before, enter your User ID to auto-fill details</Text>
              </View>

              {isExistingUser && (
                <View style={styles.successAlert}>
                  <Icon name="check-circle" size={20} color="#059669" />
                  <Text style={styles.successAlertText}>User ID verified! Your details have been loaded.</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.name}
                  onChangeText={(value) => handleFormChange('name', value)}
                  placeholder="Enter full name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Age *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={userFormData.age}
                    onChangeText={(value) => handleFormChange('age', value)}
                    placeholder="Age"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Gender *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={userFormData.gender}
                    onChangeText={(value) => handleFormChange('gender', value)}
                    placeholder="Male/Female/Other"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.phoneNo}
                  onChangeText={(value) => handleFormChange('phoneNo', value)}
                  placeholder="Enter 10-digit phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email <Text style={styles.optionalBadge}>Optional</Text></Text>
                <TextInput
                  style={styles.textInput}
                  value={userFormData.email}
                  onChangeText={(value) => handleFormChange('email', value)}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>District *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={userFormData.district}
                    onChangeText={(value) => handleFormChange('district', value)}
                    placeholder="Enter district"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>State *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={userFormData.state}
                    onChangeText={(value) => handleFormChange('state', value)}
                    placeholder="E.g Karnataka"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.proceedButton, loading && styles.buttonDisabled]}
                onPress={handleProceedToPurchase}
                disabled={loading || !userFormData.name || !userFormData.age || !userFormData.gender || !userFormData.phoneNo || !userFormData.district || !userFormData.state}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="payment" size={20} color="#fff" />
                    <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRegistrationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalHeader}>
              <Icon name="check-circle" size={60} color="#10b981" />
              <Text style={styles.successModalTitle}>Purchase Successful!</Text>
            </View>

            {purchasedUserDetails && selectedSubscription && (
              <View style={styles.successModalBody}>
                <View style={styles.celebrationAlert}>
                  <Text style={styles.celebrationText}>🎉 Congratulations! Your super user subscription is now active!</Text>
                </View>

                <View style={styles.purchaseDetails}>
                  <View style={styles.purchaseDetailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{purchasedUserDetails.name}</Text>
                  </View>
                  <View style={styles.purchaseDetailRow}>
                    <Text style={styles.detailLabel}>User ID:</Text>
                    <View style={styles.userIdBadge}>
                      <Text style={styles.userIdBadgeText}>{purchasedUserDetails.userId}</Text>
                    </View>
                  </View>
                  <View style={styles.purchaseDetailRow}>
                    <Text style={styles.detailLabel}>Plan:</Text>
                    <Text style={styles.detailValue}>{selectedSubscription.month}-Month Plan</Text>
                  </View>
                  <View style={styles.purchaseDetailRow}>
                    <Text style={styles.detailLabel}>Amount Paid:</Text>
                    <Text style={styles.amountPaid}>₹{selectedSubscription.finalPrice}</Text>
                  </View>
                  <View style={styles.purchaseDetailRow}>
                    <Text style={styles.detailLabel}>Valid Until:</Text>
                    <Text style={styles.expiryDate}>{purchaseExpiry && formatDate(purchaseExpiry)}</Text>
                  </View>
                </View>

                <View style={styles.downloadAlert}>
                  <Icon name="download" size={20} color="#0d6efd" />
                  <View style={styles.downloadAlertContent}>
                    <Text style={styles.downloadAlertTitle}>Receipt Downloaded!</Text>
                    <Text style={styles.downloadAlertText}>
                      Your purchase receipt has been downloaded automatically. Keep your User ID <Text style={styles.boldText}>{purchasedUserDetails.userId}</Text> safe for future purchases!
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeSuccessButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    fetchSubscriptions();
                  }}
                >
                  <Text style={styles.closeSuccessButtonText}>Close & Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invoiceButton}
                  onPress={handleDownloadInvoice}
                >
                  <Icon name="receipt" size={20} color="#7c3aed" />
                  <Text style={styles.invoiceButtonText}>Download Invoice</Text>
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: '#2c3e50',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingTop:50
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  headerBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  headerSuperText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '900',
  },
  headerUserText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubscriptionsText: {
    color: '#e0e0e0',
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  plansSection: {
    marginBottom: 20,
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#f59e0b',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: -0,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  planHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  originalPrice: {
    fontSize: 16,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  finalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finalPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
  },
  discountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  planDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
  },
  detailBold: {
    fontWeight: '700',
  },
  purchaseButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#0d6efd',
    elevation: 3,
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  benefitsSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  benefitIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIconText: {
    fontSize: 28,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  usageSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  usageHeaderIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  usageSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  usageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  usageCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  usageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  stepIcon: {
    fontSize: 28,
    opacity: 0.3,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 8,
  },
  notesGrid: {
    flexDirection: 'column',
  },
  noteCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  noteIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  noteContent: {
    flex: 1,
  },
  noteHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  footer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 30,
    elevation: 4,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  planAlert: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  planAlertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planAlertLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  planAlertValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  planAlertPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#374151',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  userIdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#6b7280',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  successAlert: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successAlertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  proceedButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  successModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 12,
    textAlign: 'center',
  },
  successModalBody: {
    marginBottom: 10,
  },
  celebrationAlert: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
  },
  purchaseDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  purchaseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  userIdBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userIdBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  amountPaid: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  downloadAlert: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  downloadAlertContent: {
    flex: 1,
    marginLeft: 8,
  },
  downloadAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  downloadAlertText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  closeSuccessButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  closeSuccessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  invoiceButton: {
    borderWidth: 2,
    borderColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceButtonText: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SuperUserDashboard;