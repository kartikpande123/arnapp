import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from './ApiConfig';

const ExamEntry = ({ navigation }) => {
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);
  const [timeUntilExam, setTimeUntilExam] = useState(null);
  const [canStart, setCanStart] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [registeredInfo, setRegisteredInfo] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // ✅ FIX: Helper function to get current IST time consistently
  const getCurrentISTTime = () => {
    const now = new Date();
    // Convert to IST by adding offset (UTC+5:30 = 330 minutes)
    const istOffset = 330; // minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (istOffset * 60000));
  };

  // ✅ FIX: Parse date strings consistently in IST
  const parseISTDateTime = (dateStr, timeStr) => {
    // Expect date format: YYYY-MM-DD or MM/DD/YYYY
    // Expect time format: "9:30 PM" or "21:30" or "9:30"
    
    let year, month, day;
    
    if (dateStr.includes('-')) {
      // ISO format: YYYY-MM-DD
      [year, month, day] = dateStr.split('-');
    } else {
      // Assume MM/DD/YYYY
      const parts = dateStr.split('/');
      month = parts[0];
      day = parts[1];
      year = parts[2];
    }
    
    // Parse time - handle both 12-hour (9:30 PM) and 24-hour (21:30) format
    let hours, minutes;
    const timeUpper = timeStr.trim().toUpperCase();
    
    if (timeUpper.includes('AM') || timeUpper.includes('PM')) {
      // 12-hour format
      const isPM = timeUpper.includes('PM');
      const timeOnly = timeUpper.replace(/AM|PM/g, '').trim();
      const [h, m] = timeOnly.split(':');
      
      hours = parseInt(h);
      minutes = parseInt(m) || 0;
      
      // Convert to 24-hour
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
    } else {
      // 24-hour format
      const [h, m] = timeStr.split(':');
      hours = parseInt(h);
      minutes = parseInt(m) || 0;
    }
    
    // Create ISO string with IST timezone (+05:30)
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hoursStr}:${minutesStr}:00+05:30`;
    
    return new Date(isoString);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    let pollInterval;
    let timer;

    const fetchExamData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/exams/json`);
        const result = await response.json();
        
        if (result.success) {
          const currentTime = getCurrentISTTime();
          console.log('📅 Current IST Time:', currentTime.toString());
          
          const upcomingExams = result.data.filter(exam => {
            // ✅ FIX: Data is flat, not nested in examDetails
            if (!exam.date || !exam.startTime || !exam.endTime) {
              console.warn('Skipping exam with missing date/time:', exam);
              return false;
            }
            
            // ✅ FIX: Use consistent date parsing
            const examDateTime = parseISTDateTime(exam.date, exam.startTime);
            const endDateTime = parseISTDateTime(exam.date, exam.endTime);
            
            console.log(`📝 Exam: ${exam.id}`);
            console.log(`   Start: ${examDateTime.toString()}`);
            console.log(`   End: ${endDateTime.toString()}`);
            console.log(`   Current: ${currentTime.toString()}`);
            
            // Check if exam is today and not ended, or is in the future
            const isSameDay = examDateTime.toDateString() === currentTime.toDateString();
            const isNotEnded = endDateTime > currentTime;
            const isFuture = examDateTime > currentTime;
            
            console.log(`   Same Day: ${isSameDay}, Not Ended: ${isNotEnded}, Future: ${isFuture}`);
            
            return (isSameDay && isNotEnded) || isFuture;
          });

          const sortedExams = upcomingExams.sort((a, b) => {
            const dateTimeA = parseISTDateTime(a.date, a.startTime);
            const dateTimeB = parseISTDateTime(b.date, b.startTime);
            return dateTimeA - dateTimeB;
          });

          const nextExam = sortedExams[0];
          if (nextExam) {
            console.log('✅ Next Exam:', nextExam.id);
            // Data is already flat, just set it directly
            setExamData(nextExam);
          } else {
            console.log('❌ No upcoming exams found');
            setError('No upcoming exams scheduled');
          }
        }
      } catch (err) {
        console.error('Error fetching exam data:', err);
        setError('Failed to load exam data');
      }
    };

    const updateExamTimer = () => {
      if (examData) {
        const currentTime = getCurrentISTTime();
        
        // ✅ FIX: Parse exam times consistently
        const examDateTime = parseISTDateTime(examData.date, examData.startTime);
        const endDateTime = parseISTDateTime(examData.date, examData.endTime);
        
        if (currentTime > endDateTime) {
          setExamData(null);
          setError('Exam has ended');
          return;
        }

        const timeDiff = examDateTime - currentTime;
        const minutesUntilExam = Math.floor(timeDiff / (1000 * 60));

        setTimeUntilExam(minutesUntilExam);
        setCanStart(minutesUntilExam <= 15 && minutesUntilExam >= 0);

        if (registeredInfo && minutesUntilExam <= 0) {
          handleExamStart();
        }

        if (registeredInfo && minutesUntilExam > 0) {
          const seconds = Math.floor((timeDiff / 1000) % 60);
          const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
          setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }

        if (minutesUntilExam < -(examData.duration || 60)) {
          setRegNumber('');
          setError('Exam has ended');
        }
      }
    };

    fetchExamData();
    pollInterval = setInterval(fetchExamData, 5000);
    timer = setInterval(updateExamTimer, 1000);
    updateExamTimer();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timer) clearInterval(timer);
    };
  }, [examData, registeredInfo]);

  const handleExamStart = async () => {
    try {
      const startResponse = await fetch(`${API_BASE_URL}/api/start-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber: registeredInfo.regNumber,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start exam');
      }

      navigation.navigate('MainExam', {
        candidateId: registeredInfo.regNumber,
        examName: registeredInfo.examName,
        candidateName: registeredInfo.candidateName,
        district: registeredInfo.district,
        examDate: registeredInfo.examDate,
        examStartTime: registeredInfo.examStartTime,
        examEndTime: registeredInfo.examEndTime,
      });
    } catch (err) {
      console.error('Error starting exam:', err);
      Alert.alert('Error', 'Failed to start exam. Please try again.');
      setRegisteredInfo(null);
    }
  };

  const validateAndStartExam = async () => {
    if (!canStart) {
      Alert.alert('Not Available', 'Registration is not open yet');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const validateResponse = await fetch(`${API_BASE_URL}/api/validate-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber: regNumber,
        }),
      });

      const validationData = await validateResponse.json();

      if (!validateResponse.ok) {
        setError(validationData.error || 'Invalid registration number');
        return;
      }

      if (validationData.used) {
        setError('This registration number has already been used for the exam');
        return;
      }

      setRegisteredInfo({
        regNumber: regNumber,
        examName: validationData.examName,
        candidateName: validationData.candidateName,
        district: validationData.district,
        examDate: validationData.examDate,
        examStartTime: validationData.examStartTime,
        examEndTime: validationData.examEndTime
      });

      if (timeUntilExam <= 0) {
        await handleExamStart();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to verify registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!examData) return 'Loading exam information...';
    
    if (registeredInfo) {
      return `Registration confirmed! Exam starts in ${countdown}`;
    }
    
    if (timeUntilExam < 0) return 'Exam has already started';
    if (timeUntilExam <= 15 && timeUntilExam > 0) return `Registration is open! Exam starts in ${timeUntilExam} minutes`;  
    if (timeUntilExam > 15) {
      const hours = Math.floor(timeUntilExam / 60);
      const minutes = timeUntilExam % 60;
      return `Registration opens in ${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Icon name="document-text-outline" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Exam Entry</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {examData && (
            <View style={styles.examInfoCard}>
              <LinearGradient
                colors={['#dbeafe', '#eff6ff']}
                style={styles.examInfoGradient}
              >
                <Text style={styles.examTitle}>{examData.id}</Text>
                
                <View style={styles.examDetails}>
                  <Text style={styles.detailText}>
                    Date: {new Date(examData.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.detailText}>
                    Time: {examData.startTime} - {examData.endTime}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getStatusMessage()}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {timeUntilExam >= 0 && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  <Icon name="person-outline" size={16} /> Registration Number
                </Text>
                <View style={styles.inputWrapper}>
                  <Icon name="keypad-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, (!canStart || registeredInfo) && styles.inputDisabled]}
                    value={regNumber}
                    onChangeText={(text) => setRegNumber(text.trim())}
                    placeholder="Enter registration number"
                    placeholderTextColor="#9ca3af"
                    editable={canStart && !registeredInfo}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <Icon name="alert-circle" size={20} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {!registeredInfo ? (
                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || !regNumber || !canStart) && styles.buttonDisabled
                  ]}
                  onPress={validateAndStartExam}
                  disabled={loading || !regNumber || !canStart}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      loading || !regNumber || !canStart
                        ? ['#9ca3af', '#6b7280']
                        : ['#3b82f6', '#1e40af']
                    }
                    style={styles.buttonGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                  >
                    {loading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.buttonText}>Verifying...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Icon name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Start Exam</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}

              {registeredInfo && (
                <View style={styles.successCard}>
                  <LinearGradient
                    colors={['#d1fae5', '#ecfdf5']}
                    style={styles.successGradient}
                  >
                    <Icon name="checkmark-circle" size={48} color="#10b981" />
                    <Text style={styles.successTitle}>Registration Confirmed!</Text>
                    <Text style={styles.successName}>{registeredInfo.candidateName}</Text>
                    <Text style={styles.successDetail}>District: {registeredInfo.district}</Text>
                    <View style={styles.successDivider} />
                    <Text style={styles.successInfo}>
                      You will automatically enter the exam when it begins
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  examInfoCard: {
    marginBottom: 0,
  },
  examInfoGradient: {
    padding: 20,
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 16,
  },
  examDetails: {
    marginBottom: 16,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 15,
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    color: '#9ca3af',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    elevation: 1,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  successGradient: {
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 12,
    marginBottom: 8,
  },
  successName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  successDetail: {
    fontSize: 15,
    color: '#065f46',
    marginBottom: 16,
  },
  successDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#a7f3d0',
    marginBottom: 16,
  },
  successInfo: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ExamEntry;