import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import API_BASE_URL from './ApiConfigCourse';

const { width } = Dimensions.get('window');

// Custom Icon Components
const SearchIcon = ({ size = 20, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.searchIcon, { borderColor: color }]}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View
        style={[
          styles.searchHandle,
          { backgroundColor: color, transform: [{ rotate: '45deg' }] },
        ]}
      />
    </View>
  </View>
);

const CheckCircleIcon = ({ size = 28, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.checkCircle, { borderColor: color }]}>
      <View style={[styles.checkMark, { borderColor: color }]} />
    </View>
  </View>
);

const ClockIcon = ({ size = 28, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.clockIcon, { borderColor: color }]}>
      <View style={[styles.clockHourHand, { backgroundColor: color }]} />
      <View style={[styles.clockMinuteHand, { backgroundColor: color }]} />
      <View style={styles.clockCenter} />
    </View>
  </View>
);

const XCircleIcon = ({ size = 28, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.xCircle, { borderColor: color }]}>
      <View
        style={[
          styles.xLine,
          { backgroundColor: color, transform: [{ rotate: '45deg' }] },
        ]}
      />
      <View
        style={[
          styles.xLine,
          { backgroundColor: color, transform: [{ rotate: '-45deg' }] },
        ]}
      />
    </View>
  </View>
);

const CourseStatusCheck = () => {
  const [applicationId, setApplicationId] = useState('');
  const [applicationData, setApplicationData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    if (!applicationId.trim()) {
      setError('Please enter an application ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/applications`);
      const result = await response.json();

      if (result.success && result.data) {
        const application = result.data[applicationId];
        if (application) {
          setApplicationData({
            ...application,
            status: application.status || 'PENDING',
          });
          setError('');
        } else {
          setError('Application not found');
          setApplicationData(null);
        }
      } else {
        setError('Failed to fetch application details');
      }
    } catch (err) {
      setError('Error checking application status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = status => {
    switch (status) {
      case 'SELECTED':
        return {
          container: styles.statusSelected,
          icon: <CheckCircleIcon size={28} color="#ffffff" />,
          text: 'SELECTED',
        };
      case 'REJECTED':
        return {
          container: styles.statusRejected,
          icon: <XCircleIcon size={28} color="#ffffff" />,
          text: 'REJECTED',
        };
      default:
        return {
          container: styles.statusPending,
          icon: <ClockIcon size={28} color="#ffffff" />,
          text: 'PENDING',
        };
    }
  };

  const handleKeyPress = e => {
    if (e.nativeEvent.key === 'Enter') {
      checkStatus();
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
          <Text style={styles.title}>Application Status Checker</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Application ID"
            placeholderTextColor="#94a3b8"
            value={applicationId}
            onChangeText={setApplicationId}
            onSubmitEditing={checkStatus}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={checkStatus}
            disabled={loading}
            activeOpacity={0.8}
          >
            <SearchIcon size={18} color="#ffffff" />
            <Text style={styles.buttonText}>
              {loading ? 'Checking...' : 'Check Status'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a3b5d" />
            <Text style={styles.loadingText}>
              Checking application status...
            </Text>
          </View>
        )}

        {/* Application Data */}
        {applicationData && (
          <View style={styles.resultContainer}>
            {/* Status Badge */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  getStatusStyle(applicationData.status).container,
                ]}
              >
                {getStatusStyle(applicationData.status).icon}
                <Text style={styles.statusText}>
                  {getStatusStyle(applicationData.status).text}
                </Text>
              </View>
            </View>

            {/* Info Cards Grid */}
            <View style={styles.gridContainer}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Applicant Name</Text>
                <Text style={styles.cardValue}>{applicationData.name}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>Course Name</Text>
                <Text style={styles.cardValue}>
                  {applicationData.courseName}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>City</Text>
                <Text style={styles.cardValue}>{applicationData.city}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>State</Text>
                <Text style={styles.cardValue}>{applicationData.state}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>Application Date</Text>
                <Text style={styles.cardValue}>
                  {new Date(applicationData.applicationDate).toLocaleDateString(
                    'en-IN',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    },
                  )}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>Course Fees</Text>
                <Text style={styles.cardValue}>
                  ₹{applicationData.courseFees?.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
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
  inputContainer: {
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
  alertContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 25,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  alertText: {
    color: '#991b1b',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
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
  resultContainer: {
    marginTop: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 25,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statusText: {
    marginLeft: 10,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  statusSelected: {
    backgroundColor: '#10b981',
  },
  statusRejected: {
    backgroundColor: '#ef4444',
  },
  statusPending: {
    backgroundColor: '#64748b',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  card: {
    flex: 1,
    minWidth: width > 768 ? '48%' : '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 15,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a202c',
    lineHeight: 22,
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

  // Check Circle Icon
  checkCircle: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 14,
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

  // Clock Icon
  clockIcon: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clockHourHand: {
    position: 'absolute',
    width: '25%',
    height: 2,
    top: '50%',
    left: '50%',
    marginLeft: '-12.5%',
    transform: [{ translateY: -1 }],
  },
  clockMinuteHand: {
    position: 'absolute',
    width: '40%',
    height: 2,
    top: '50%',
    left: '50%',
    marginLeft: '-20%',
    transform: [{ translateY: -1 }, { rotate: '90deg' }],
  },
  clockCenter: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },

  // X Circle Icon
  xCircle: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  xLine: {
    position: 'absolute',
    width: '60%',
    height: 2,
    backgroundColor: '#ffffff',
  },
});

// Responsive adjustments
const responsiveStyles = StyleSheet.create({
  container:
    width <= 768
      ? {
          padding: 20,
          paddingTop: 25,
          paddingBottom: 25,
        }
      : {},

  title:
    width <= 768
      ? {
          fontSize: 24,
        }
      : {},

  inputContainer:
    width <= 768
      ? {
          flexDirection: 'column',
        }
      : {},

  input:
    width <= 768
      ? {
          width: '100%',
        }
      : {},

  button:
    width <= 768
      ? {
          width: '100%',
        }
      : {},

  titleContainer:
    width <= 768
      ? {
          padding: 15,
        }
      : {},

  statusBadge:
    width <= 768
      ? {
          paddingHorizontal: 25,
          paddingVertical: 16,
        }
      : {},

  statusText:
    width <= 768
      ? {
          fontSize: 16,
        }
      : {},

  gridContainer:
    width <= 768
      ? {
          gap: 12,
        }
      : {},

  card:
    width <= 768
      ? {
          minWidth: width <= 576 ? '100%' : '48%',
        }
      : {},

  containerSmall:
    width <= 576
      ? {
          padding: 15,
          paddingTop: 20,
          paddingBottom: 20,
        }
      : {},

  titleSmall:
    width <= 576
      ? {
          fontSize: 22,
        }
      : {},

  titleContainerSmall:
    width <= 576
      ? {
          padding: 12,
        }
      : {},

  cardSmall:
    width <= 576
      ? {
          padding: 16,
        }
      : {},
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
  inputContainer: {
    ...styles.inputContainer,
    ...(width <= 768 && responsiveStyles.inputContainer),
  },
  input: {
    ...styles.input,
    ...(width <= 768 && responsiveStyles.input),
  },
  button: {
    ...styles.button,
    ...(width <= 768 && responsiveStyles.button),
  },
  statusBadge: {
    ...styles.statusBadge,
    ...(width <= 768 && responsiveStyles.statusBadge),
  },
  statusText: {
    ...styles.statusText,
    ...(width <= 768 && responsiveStyles.statusText),
  },
  gridContainer: {
    ...styles.gridContainer,
    ...(width <= 768 && responsiveStyles.gridContainer),
  },
  card: {
    ...styles.card,
    ...(width <= 768 && responsiveStyles.card),
    ...(width <= 576 && responsiveStyles.cardSmall),
  },
});

export default CourseStatusCheck;
