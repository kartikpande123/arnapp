import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNPrint from 'react-native-print';
import axios from 'axios';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const DownloadHallTicket = () => {
  const [regId, setRegId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatTime = (time) => {
    // Return time as-is from API since it's already formatted with AM/PM
    return time || '';
  };

  const getBase64Logo = () => {
    // Get the resolved asset path from require
    const logoSource = Image.resolveAssetSource(require('../Images/LOGO.jpg'));
    return logoSource ? logoSource.uri : '';
  };

  const generateHTML = async (candidate) => {
    // Try to get logo from bundled assets
    let logoUri = '';
    try {
      const logoSource = Image.resolveAssetSource(require('../Images/LOGO.jpg'));
      if (logoSource && logoSource.uri) {
        // For Android, the URI might need to be converted
        logoUri = logoSource.uri;
      }
    } catch (error) {
      console.log('Could not load logo:', error);
    }

    // Get candidate photo (already should be a URL or base64)
    const photoUrl = candidate.photoUrl || '';
    
    return `
      <html>
        <head>
          <meta charset="UTF-8">
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
              ${photoUrl ? 'margin-right: 120px;' : ''}
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
                ${logoUri ? `<img src="${logoUri}" alt="Logo" class="logo" />` : '<div style="width:60px;height:60px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;">🎓</div>'}
              </div>
              <h1>ARN STUDY ACADEMY</h1>
              <h2>Hall Ticket (Live Exam)</h2>
            </div>
            
            <div class="content">
              <div class="reg-id-box">
                <div class="reg-id-label">Registration ID</div>
                <div class="reg-id-value">${candidate.registrationNumber}</div>
              </div>

              ${photoUrl ? `<img src="${photoUrl}" alt="Candidate Photo" class="candidate-photo" />` : ''}

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

  const handleGenerate = async () => {
    if (!regId.trim()) {
      setError('Please enter Registration ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_BASE_URL}/api/candidate/${regId}`);
      const { candidate } = res.data;

      if (!candidate) {
        setError('No candidate found with this Registration ID');
        setLoading(false);
        return;
      }

      const html = await generateHTML(candidate);
      await RNPrint.print({ html });
      
      Alert.alert(
        'Success',
        'Hall ticket generated successfully!',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (err) {
      console.error(err);
      // Check if it's a 404 error (user not found)
      if (err.response && err.response.status === 404) {
        setError('No candidate found with this Registration ID');
      } else {
        setError('Failed to generate hall ticket. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Icon name="ticket-confirmation" size={32} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>Download Hall Ticket</Text>
          <Text style={styles.headerSubtitle}>Enter your registration ID to download</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Registration ID</Text>
            <View style={styles.inputWrapper}>
              <Icon name="identifier" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={regId}
                onChangeText={setRegId}
                placeholder="Enter your registration ID"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading && <ActivityIndicator color="#FFFFFF" size="small" style={{marginRight: 8}} />}
            <Icon name={loading ? "loading" : "download"} size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? '  Generating...' : '  Generate & Print Hall Ticket'}
            </Text>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="information" size={20} color="#3b82f6" />
              <Text style={styles.infoHeaderText}>Important Note</Text>
            </View>
            <Text style={styles.infoText}>
              • Ensure your registration ID is correct{'\n'}
              • Hall ticket is mandatory for exam entry{'\n'}
              • Keep a printed or digital copy ready{'\n'}
              • Arrive 15 minutes before exam time
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: height * 0.06,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    marginTop: 10,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
});

export default DownloadHallTicket;