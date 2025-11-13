import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import API_BASE_URL from './ApiConfig';

const Help = ({ navigation }) => {
  const [concern, setConcern] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async () => {
    Alert.alert(
      'Upload Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
              });
              
              if (!result.didCancel && result.assets && result.assets[0]) {
                setFile({
                  uri: result.assets[0].uri,
                  type: result.assets[0].type,
                  name: result.assets[0].fileName || 'photo.jpg',
                });
              }
            } catch (error) {
              console.error('Error taking photo:', error);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 1,
              });
              
              if (!result.didCancel && result.assets && result.assets[0]) {
                setFile({
                  uri: result.assets[0].uri,
                  type: result.assets[0].type,
                  name: result.assets[0].fileName || 'photo.jpg',
                });
              }
            } catch (error) {
              console.error('Error selecting image:', error);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handleSubmit = async () => {
    if (!concern.trim()) {
      Alert.alert('Error', 'Please describe your concern');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('concern', concern);
    
    if (file) {
      formData.append('photo', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'photo.jpg',
      });
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/concern`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Alert.alert(
        'Success',
        'Your concern has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setConcern('');
              setFile(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to submit your concern. Please try again later.'
      );
      console.error('Error submitting concern:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>
            We're here to help you with any concerns
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Concern Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Concern</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              value={concern}
              onChangeText={setConcern}
              placeholder="Describe your concern here...&#10;&#10;(If you have personal concerns, please add your name and phone number...)"
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
          </View>

          {/* File Upload Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Upload Photo (Optional)</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleFileSelect}
              activeOpacity={0.7}>
              <View style={styles.uploadContent}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>
                  {file ? file.name : 'Choose Photo'}
                </Text>
              </View>
            </TouchableOpacity>
            
            {file && (
              <View style={styles.filePreview}>
                <Text style={styles.filePreviewText}>✓ Photo selected</Text>
                <TouchableOpacity
                  onPress={() => setFile(null)}
                  style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Concern</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025/2026 Karnataka Ayan Wholesale Supply Enterprises.
          </Text>
          <Text style={styles.footerText}>All Rights Reserved.</Text>
          
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#1a3b5d',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#b8d4f1',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    fontSize: 15,
    color: '#333',
    minHeight: 140,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: '600',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
  },
  filePreviewText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  removeButtonText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerLink: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  footerSeparator: {
    fontSize: 12,
    color: '#6c757d',
    marginHorizontal: 4,
  },
});

export default Help;