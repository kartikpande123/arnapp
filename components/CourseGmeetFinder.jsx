import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import API_BASE_URL from './ApiConfigCourse';

const { width } = Dimensions.get('window');

// Custom Icon Components
const SearchIcon = ({ size = 20, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.searchIcon, { borderColor: color }]}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
    </View>
  </View>
);

const VideoIcon = ({ size = 20, color = '#1a3b5d' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.videoIcon, { borderColor: color }]}>
      <View style={[styles.videoTriangle, { borderLeftColor: color }]} />
    </View>
  </View>
);

const CheckCircleIcon = ({ size = 20, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.checkCircle, { borderColor: color }]}>
      <View style={[styles.checkMark, { borderColor: color }]} />
    </View>
  </View>
);

const CourseGmeetFinder = () => {
  const [applicationId, setApplicationId] = useState('');
  const [meetLink, setMeetLink] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async () => {
    if (!applicationId.trim()) {
      setError('Please enter an application ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setApplicationData(null);
      setSearched(true);

      const appResponse = await fetch(`${API_BASE_URL}/applications`);
      if (!appResponse.ok) {
        throw new Error('Failed to fetch applications');
      }

      const { data } = await appResponse.json();
      const appData = Object.values(data).find(app => app.applicationId === applicationId);

      if (!appData) {
        throw new Error('Application not found');
      }

      const applicationWithStatus = {
        ...appData,
        status: appData.status || 'PENDING'
      };

      setApplicationData(applicationWithStatus);

      if (applicationWithStatus.status !== 'SELECTED') {
        setError(`Your application status is: ${applicationWithStatus.status}. Only selected applications can access the meet link.`);
        return;
      }

      const meetResponse = await fetch(`${API_BASE_URL}/meetlinks/all`);
      if (!meetResponse.ok) {
        throw new Error('Failed to fetch meet links');
      }

      const meetData = await meetResponse.json();
      const matchingMeetLink = meetData.data.find(
        link => link.courseTitle.toLowerCase() === applicationWithStatus.courseName.toLowerCase()
      );

      if (!matchingMeetLink) {
        throw new Error('Meet link not found for this course');
      }

      setMeetLink(matchingMeetLink);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLink = async () => {
    if (meetLink?.meetLink) {
      const supported = await Linking.canOpenURL(meetLink.meetLink);
      if (supported) {
        await Linking.openURL(meetLink.meetLink);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor="#ffffff"  
        barStyle="dark-content"  
        translucent={false} 
        animated={true}
      />
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Container */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Course Link Finder</Text>
      </View>
      
      {/* Instruction */}
      <Text style={styles.instruction}>
        Enter your application ID to get your course meet link
      </Text>

      {/* Input Form */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          value={applicationId}
          onChangeText={setApplicationId}
          placeholder="Enter Application ID"
          placeholderTextColor="#94a3b8"
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <SearchIcon size={18} />
          <Text style={styles.buttonText}>
            {isLoading ? 'Checking...' : 'Find Link'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3b5d" />
          <Text style={styles.loadingText}>Checking application status...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Application Details */}
      {applicationData && !error && (
        <View style={styles.resultContainer}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Course:</Text>
              <Text style={styles.detailValue}>{applicationData.courseName}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{applicationData.name}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Application Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(applicationData.applicationDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.statusContainer}>
              <CheckCircleIcon size={20} color="#ffffff" />
              <Text style={styles.statusText}>Status: {applicationData.status}</Text>
            </View>
          </View>

          {/* Meet Link */}
          {meetLink && (
            <View style={styles.meetLinkContainer}>
              <View style={styles.linkHeader}>
                <VideoIcon size={20} color="#1a3b5d" />
                <Text style={styles.linkLabel}>Your Class Link:</Text>
              </View>
              
              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleOpenLink}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText} numberOfLines={2}>
                  {meetLink.meetLink}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* No Results Found */}
      {searched && !applicationData && !error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No application found with this ID. Please check and try again.
          </Text>
        </View>
      )}
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: Dimensions.get('window').height,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#1a3b5d',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  instruction: {
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  formContainer: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 12,
    marginBottom: 30,
  },
  input: {
    flex: width > 768 ? 1 : undefined,
    height: 52,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    fontWeight: '500',
    color: '#1a202c',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#1a3b5d',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  loadingText: {
    color: '#1a3b5d',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    marginTop: 20,
    padding: 18,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  errorText: {
    color: '#991b1b',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultContainer: {
    marginTop: 30,
    padding: 25,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailLabel: {
    fontWeight: '700',
    color: '#1a3b5d',
    minWidth: 140,
    fontSize: 15,
    lineHeight: 22,
  },
  detailValue: {
    fontWeight: '600',
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  statusText: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  meetLinkContainer: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#e0f2fe',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1a3b5d',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  linkLabel: {
    fontWeight: '700',
    color: '#1a3b5d',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  linkButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a3b5d',
    marginTop: 8,
  },
  linkText: {
    color: '#1a3b5d',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },

  // Custom Icon Styles
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search Icon
  searchIcon: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  searchCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '70%',
    borderRadius: 10,
    borderWidth: 2,
  },
  searchHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '40%',
    height: 2,
    backgroundColor: '#ffffff',
  },

  // Video Icon
  videoIcon: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },

  // Check Circle Icon
  checkCircle: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    width: '50%',
    height: '25%',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '-45deg' }],
    marginTop: -3,
    marginLeft: 2,
  },
});

// Responsive adjustments
const responsiveStyles = StyleSheet.create({
  container: width <= 768 ? {
    padding: 20,
    paddingTop: 25,
    paddingBottom: 25,
  } : {},
  
  title: width <= 768 ? {
    fontSize: 24,
  } : {},
  
  formContainer: width <= 768 ? {
    flexDirection: 'column',
  } : {},
  
  input: width <= 768 ? {
    width: '100%',
  } : {},
  
  button: width <= 768 ? {
    width: '100%',
  } : {},
  
  titleContainer: width <= 768 ? {
    padding: 15,
  } : {},
  
  resultContainer: width <= 768 ? {
    padding: 20,
  } : {},
  
  detailLabel: width <= 768 ? {
    minWidth: 120,
  } : {},
  
  containerSmall: width <= 576 ? {
    padding: 15,
    paddingTop: 20,
    paddingBottom: 20,
  } : {},
  
  titleSmall: width <= 576 ? {
    fontSize: 22,
  } : {},
  
  titleContainerSmall: width <= 576 ? {
    padding: 12,
  } : {},
  
  instructionSmall: width <= 576 ? {
    fontSize: 14,
  } : {},
});

// Merge responsive styles
const mergedStyles = StyleSheet.create({
  ...styles,
  contentContainer: {
    ...styles.contentContainer,
    ...(width <= 768 && responsiveStyles.container),
    ...(width <= 576 && responsiveStyles.containerSmall),
  },
  title: {
    ...styles.title,
    ...(width <= 768 && responsiveStyles.title),
    ...(width <= 576 && responsiveStyles.titleSmall),
  },
  titleContainer: {
    ...styles.titleContainer,
    ...(width <= 768 && responsiveStyles.titleContainer),
    ...(width <= 576 && responsiveStyles.titleContainerSmall),
  },
  instruction: {
    ...styles.instruction,
    ...(width <= 576 && responsiveStyles.instructionSmall),
  },
  formContainer: {
    ...styles.formContainer,
    ...(width <= 768 && responsiveStyles.formContainer),
  },
  input: {
    ...styles.input,
    ...(width <= 768 && responsiveStyles.input),
  },
  button: {
    ...styles.button,
    ...(width <= 768 && responsiveStyles.button),
  },
  resultContainer: {
    ...styles.resultContainer,
    ...(width <= 768 && responsiveStyles.resultContainer),
  },
  detailLabel: {
    ...styles.detailLabel,
    ...(width <= 768 && responsiveStyles.detailLabel),
  },
});

export default CourseGmeetFinder;