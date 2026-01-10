import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './ApiConfig';

const ExamForm = ({ navigation }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    gender: '',
    dob: '',
    district: '',
    pincode: '',
    state: '',
    email: '',
    phone: '',
    photo: null,
    exam: '',
    examStartTime: '',
    examEndTime: '',
    examPrice: '',
    examDate: '',
  });

  const [imageError, setImageError] = useState('');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isValidImage, setIsValidImage] = useState(false);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate(),
  });
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    pincode: ''
  });

  useEffect(() => {
    fetchExams();
    
    // Set up interval to periodically check for exam updates
    const interval = setInterval(() => {
      fetchExams();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exams/json`);
      const data = await response.json();
      
      if (data.success) {
        const formattedExams = data.data.map((exam) => ({
          ...exam,
          startTime: formatTimeString(exam.startTime),
          endTime: formatTimeString(exam.endTime),
        }));
        setExams(formattedExams);
        setError(null);
        
        // Store exams locally for offline access
        await AsyncStorage.setItem('availableExams', JSON.stringify(formattedExams));
      } else {
        setError('Failed to load exams');
        // Try to load from local storage if API fails
        await loadStoredExams();
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to connect to exam server');
      // Try to load from local storage if API fails
      await loadStoredExams();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStoredExams = async () => {
    try {
      const storedExams = await AsyncStorage.getItem('availableExams');
      if (storedExams) {
        setExams(JSON.parse(storedExams));
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Using cached exam data',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } catch (storageError) {
      console.error('Error loading stored exams:', storageError);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const formatTimeString = (timeStr) => {
    try {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      const formattedHours = hours.padStart(2, '0');
      const formattedMinutes = minutes ? minutes.padStart(2, '0') : '00';
      return `${formattedHours}:${formattedMinutes} ${period || 'AM'}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeStr;
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    if (!email) return true; // Optional field, so empty is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function (exactly 10 digits)
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Pincode validation function (exactly 6 digits)
  const validatePincode = (pincode) => {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
  };

  // Handle email input with validation
  const handleEmailChange = (text) => {
    setFormData((prev) => ({ ...prev, email: text }));
    
    if (text && !validateEmail(text)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  // Handle phone input with validation
  const handlePhoneChange = (text) => {
    // Only allow numbers and limit to 10 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: numericText }));
    
    if (numericText && !validatePhone(numericText)) {
      setValidationErrors(prev => ({
        ...prev,
        phone: 'Phone number must be exactly 10 digits'
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  // Handle pincode input with validation
  const handlePincodeChange = (text) => {
    // Only allow numbers and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: numericText }));
    
    if (numericText && !validatePincode(numericText)) {
      setValidationErrors(prev => ({
        ...prev,
        pincode: 'Pincode must be exactly 6 digits'
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        pincode: ''
      }));
    }
  };

  const validateImageSize = (fileSize) => {
    const maxSize = 1 * 1024 * 1024; // 1 MB in bytes
    return fileSize <= maxSize;
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (validateImageSize(asset.fileSize)) {
          setImageError('');
          setIsValidImage(true);
          setFormData((prev) => ({
            ...prev,
            photo: asset,
          }));
        } else {
          setImageError(
            'Image size must be less than 1 MB. Please use an image compressor.'
          );
          setIsValidImage(false);
          Alert.alert(
            'Image Too Large',
            'Image size must be less than 1 MB. Please compress your image and try again.'
          );
        }
      }
    });
  };

  const handleExamSelect = (examId) => {
    const selectedExam = exams.find((exam) => exam.id === examId);
    if (selectedExam) {
      setFormData((prev) => ({
        ...prev,
        exam: examId,
        examStartTime: selectedExam.startTime,
        examEndTime: selectedExam.endTime,
        examPrice: selectedExam.price,
        examDate: selectedExam.date,
      }));
      setShowExamPicker(false);
    }
  };

  const handleGenderSelect = (gender) => {
    setFormData((prev) => ({
      ...prev,
      gender: gender,
    }));
    setShowGenderPicker(false);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDateConfirm = () => {
    const dateString = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setFormData((prev) => ({
      ...prev,
      dob: dateString,
    }));
    setShowDatePicker(false);
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const isFormValid = () => {
    return (
      formData.candidateName &&
      formData.gender &&
      formData.dob &&
      formData.district &&
      formData.pincode &&
      formData.state &&
      formData.phone &&
      formData.exam &&
      isValidImage &&
      validatePincode(formData.pincode) &&
      validatePhone(formData.phone) &&
      (formData.email ? validateEmail(formData.email) : true)
    );
  };

  const handleSubmit = () => {
    // Final validation check before submission
    if (!validatePincode(formData.pincode)) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    if (!validatePhone(formData.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (!formData.photo) {
      Alert.alert('Error', 'Please select a photo under 1 MB');
      return;
    }

    const formattedData = {
      ...formData,
      dob: new Date(formData.dob).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    navigation.navigate('PaymentGateway', { formData: formattedData });
  };

  const getSelectedExamLabel = () => {
    if (!formData.exam) return 'Select Exam';
    const exam = exams.find((e) => e.id === formData.exam);
    if (!exam) return 'Select Exam';
    return `${exam.id} - ${exam.date}`;
  };

  if (loading && exams.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exam Application Form</Text>
          <Text style={styles.headerSubtitle}>Live Exam Registration</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#1a3b5d" />
          <Text style={styles.loadingText}>Loading available exams...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam Application Form</Text>
        <Text style={styles.headerSubtitle}>Live Exam Registration</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="error" size={20} color="#fff" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Exam Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Exam *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowExamPicker(!showExamPicker)}
            disabled={loading}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !formData.exam && styles.placeholderText,
              ]}
            >
              {loading ? 'Loading exams...' : getSelectedExamLabel()}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          {showExamPicker && (
            <View style={styles.pickerModal}>
              <ScrollView 
                style={styles.pickerScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {exams.map((exam) => (
                  <TouchableOpacity
                    key={exam.id}
                    style={styles.pickerOption}
                    onPress={() => handleExamSelect(exam.id)}
                  >
                    <Text style={styles.pickerOptionText}>
                      {exam.id} - {exam.date}
                    </Text>
                    <Text style={styles.pickerOptionSubtext}>
                      Time: {exam.startTime} to {exam.endTime}
                    </Text>
                    <Text style={styles.pickerOptionSubtext}>
                      Marks: {exam.marks} | Price: ₹{exam.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Candidate Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Candidate Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={formData.candidateName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, candidateName: text }))
            }
          />
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.label}>Gender *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGenderPicker(!showGenderPicker)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !formData.gender && styles.placeholderText,
              ]}
            >
              {formData.gender
                ? formData.gender.charAt(0).toUpperCase() +
                  formData.gender.slice(1)
                : 'Select Gender'}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          {showGenderPicker && (
            <View style={styles.pickerModal}>
              {['male', 'female', 'other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={styles.pickerOption}
                  onPress={() => handleGenderSelect(gender)}
                >
                  <Text style={styles.pickerOptionText}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date of Birth */}
        <View style={styles.section}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !formData.dob && styles.placeholderText,
              ]}
            >
              {formData.dob ? formatDisplayDate(formData.dob) : 'Select Date of Birth'}
            </Text>
            <Icon name="calendar-today" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContent}>
                {/* Year Picker */}
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerColumnLabel}>Year</Text>
                  <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.datePickerOption,
                          selectedDate.year === year && styles.datePickerOptionSelected,
                        ]}
                        onPress={() => setSelectedDate((prev) => ({ ...prev, year }))}
                      >
                        <Text
                          style={[
                            styles.datePickerOptionText,
                            selectedDate.year === year && styles.datePickerOptionTextSelected,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Month Picker */}
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerColumnLabel}>Month</Text>
                  <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.datePickerOption,
                          selectedDate.month === month && styles.datePickerOptionSelected,
                        ]}
                        onPress={() => setSelectedDate((prev) => ({ ...prev, month }))}
                      >
                        <Text
                          style={[
                            styles.datePickerOptionText,
                            selectedDate.month === month && styles.datePickerOptionTextSelected,
                          ]}
                        >
                          {getMonthName(month)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Day Picker */}
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerColumnLabel}>Day</Text>
                  <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1).map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.datePickerOption,
                          selectedDate.day === day && styles.datePickerOptionSelected,
                        ]}
                        onPress={() => setSelectedDate((prev) => ({ ...prev, day }))}
                      >
                        <Text
                          style={[
                            styles.datePickerOptionText,
                            selectedDate.day === day && styles.datePickerOptionTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.datePickerFooter}>
                <TouchableOpacity
                  style={styles.datePickerCancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerConfirmButton}
                  onPress={handleDateConfirm}
                >
                  <Text style={styles.datePickerConfirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* District */}
        <View style={styles.section}>
          <Text style={styles.label}>District *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your district"
            placeholderTextColor="#999"
            value={formData.district}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, district: text }))
            }
          />
        </View>

        {/* Pincode & State Row */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={[
                styles.input,
                formData.pincode && !validatePincode(formData.pincode) && styles.inputError
              ]}
              placeholder="6-digit pincode"
              placeholderTextColor="#999"
              value={formData.pincode}
              onChangeText={handlePincodeChange}
              keyboardType="numeric"
              maxLength={6}
            />
            {validationErrors.pincode ? (
              <Text style={styles.errorText}>{validationErrors.pincode}</Text>
            ) : null}
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#999"
              value={formData.state}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, state: text }))
              }
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.section}>
          <Text style={styles.label}>Email ID (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              formData.email && !validateEmail(formData.email) && styles.inputError
            ]}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {validationErrors.email ? (
            <Text style={styles.errorText}>{validationErrors.email}</Text>
          ) : null}
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[
              styles.input,
              formData.phone && !validatePhone(formData.phone) && styles.inputError
            ]}
            placeholder="10-digit phone number"
            placeholderTextColor="#999"
            value={formData.phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={10}
          />
          {validationErrors.phone ? (
            <Text style={styles.errorText}>{validationErrors.phone}</Text>
          ) : null}
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Upload Photo (Max size: 1 MB) *</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handleImagePicker}
          >
            <Icon name="add-photo-alternate" size={24} color="#1a3b5d" />
            <Text style={styles.imagePickerButtonText}>
              {formData.photo ? 'Change Photo' : 'Select Photo'}
            </Text>
          </TouchableOpacity>

          {formData.photo && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: formData.photo.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, photo: null }));
                  setIsValidImage(false);
                }}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {imageError ? (
            <Text style={styles.errorText}>{imageError}</Text>
          ) : null}
          <Text style={styles.helperText}>
            Please ensure image is under 1 MB
          </Text>
        </View>

        {/* Exam Details Card */}
        {formData.examPrice && formData.examStartTime && formData.examEndTime && (
          <View style={styles.examDetailsCard}>
            <View style={styles.examDetailRow}>
              <Icon name="payment" size={20} color="#1a3b5d" />
              <Text style={styles.examDetailText}>
                Price: ₹{formData.examPrice}
              </Text>
            </View>
            <View style={styles.examDetailRow}>
              <Icon name="access-time" size={20} color="#1a3b5d" />
              <Text style={styles.examDetailText}>
                Time: {formData.examStartTime} to {formData.examEndTime}
              </Text>
            </View>
            <View style={styles.examDetailRow}>
              <Icon name="event" size={20} color="#1a3b5d" />
              <Text style={styles.examDetailText}>
                Date: {formData.examDate}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid() && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid()}
        >
          <Text style={styles.submitButtonText}>Submit Application</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1a3b5d',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b3c9e6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1.5,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
},
pickerButtonText: {
fontSize: 16,
color: '#333',
flex: 1,
},
placeholderText: {
color: '#999',
},
pickerModal: {
backgroundColor: '#fff',
borderWidth: 1,
borderColor: '#ddd',
borderRadius: 8,
marginTop: 8,
maxHeight: 300,
elevation: 3,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
},
pickerScrollView: {
maxHeight: 300,
},
pickerOption: {
padding: 16,
borderBottomWidth: 1,
borderBottomColor: '#f0f0f0',
},
pickerOptionText: {
fontSize: 16,
color: '#333',
fontWeight: '500',
marginBottom: 4,
},
pickerOptionSubtext: {
fontSize: 13,
color: '#666',
marginTop: 2,
},
imagePickerButton: {
backgroundColor: '#fff',
borderWidth: 2,
borderColor: '#1a3b5d',
borderStyle: 'dashed',
borderRadius: 8,
paddingVertical: 20,
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
},
imagePickerButtonText: {
fontSize: 16,
color: '#1a3b5d',
fontWeight: '600',
marginLeft: 8,
},
imagePreviewContainer: {
marginTop: 12,
position: 'relative',
alignSelf: 'center',
},
imagePreview: {
width: 150,
height: 150,
borderRadius: 8,
backgroundColor: '#f0f0f0',
},
removeImageButton: {
position: 'absolute',
top: -8,
right: -8,
backgroundColor: '#ff4444',
borderRadius: 15,
width: 30,
height: 30,
justifyContent: 'center',
alignItems: 'center',
elevation: 2,
},
errorText: {
color: '#ff4444',
fontSize: 12,
marginTop: 6,
},
helperText: {
color: '#666',
fontSize: 12,
marginTop: 6,
},
examDetailsCard: {
backgroundColor: '#e3f2fd',
borderRadius: 8,
padding: 16,
marginBottom: 20,
borderLeftWidth: 4,
borderLeftColor: '#1a3b5d',
},
examDetailRow: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 8,
},
examDetailText: {
fontSize: 15,
color: '#1a3b5d',
fontWeight: '500',
marginLeft: 12,
},
submitButton: {
backgroundColor: '#1a3b5d',
borderRadius: 8,
paddingVertical: 16,
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
elevation: 3,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.25,
shadowRadius: 3.84,
},
submitButtonDisabled: {
backgroundColor: '#ccc',
elevation: 0,
},
submitButtonText: {
color: '#fff',
fontSize: 18,
fontWeight: 'bold',
marginRight: 8,
},
bottomPadding: {
height: 30,
},
modalOverlay: {
flex: 1,
backgroundColor: 'rgba(0, 0, 0, 0.5)',
justifyContent: 'center',
alignItems: 'center',
},
datePickerModal: {
backgroundColor: '#fff',
borderRadius: 12,
width: '90%',
maxHeight: '70%',
elevation: 5,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.25,
shadowRadius: 3.84,
},
datePickerHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
padding: 16,
borderBottomWidth: 1,
borderBottomColor: '#f0f0f0',
},
datePickerTitle: {
fontSize: 18,
fontWeight: 'bold',
color: '#1a3b5d',
},
datePickerContent: {
flexDirection: 'row',
height: 300,
},
datePickerColumn: {
flex: 1,
borderRightWidth: 1,
borderRightColor: '#f0f0f0',
},
datePickerColumnLabel: {
fontSize: 14,
fontWeight: '600',
color: '#1a3b5d',
textAlign: 'center',
paddingVertical: 12,
backgroundColor: '#f8f9fa',
},
datePickerScrollView: {
flex: 1,
},
datePickerOption: {
paddingVertical: 12,
paddingHorizontal: 8,
alignItems: 'center',
borderBottomWidth: 1,
borderBottomColor: '#f5f5f5',
},
datePickerOptionSelected: {
backgroundColor: '#e3f2fd',
},
datePickerOptionText: {
fontSize: 16,
color: '#333',
},
datePickerOptionTextSelected: {
color: '#1a3b5d',
fontWeight: 'bold',
},
datePickerFooter: {
flexDirection: 'row',
justifyContent: 'flex-end',
padding: 16,
borderTopWidth: 1,
borderTopColor: '#f0f0f0',
},
datePickerCancelButton: {
paddingVertical: 10,
paddingHorizontal: 20,
marginRight: 12,
},
datePickerCancelButtonText: {
fontSize: 16,
color: '#666',
fontWeight: '600',
},
datePickerConfirmButton: {
backgroundColor: '#1a3b5d',
paddingVertical: 10,
paddingHorizontal: 20,
borderRadius: 6,
},
datePickerConfirmButtonText: {
fontSize: 16,
color: '#fff',
fontWeight: 'bold',
},
});


export default ExamForm;