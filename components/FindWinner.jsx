import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import API_BASE_URL from "./ApiConfig";

const { width, height } = Dimensions.get('window');

const Toast = ({ message, type, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(4700),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#10B981' : '#EF4444';

  return (
    <Animated.View style={[styles.toast, { backgroundColor, opacity: fadeAnim }]}>
      <Icon name={type === 'success' ? 'check-circle' : 'alert-circle'} size={20} color="#FFFFFF" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const FindWinner = () => {
  const [registrationNo, setRegistrationNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');
  const [savingChoice, setSavingChoice] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  const showToast = (message, type) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: '' });
  };

  const getPrizeAmount = (rank) => {
    const prizes = {
      1: '1000₹',
      2: '750₹',
      3: '500₹'
    };
    return prizes[rank] || '0₹';
  };

  const getTopThreeByExam = (results) => {
    const examWiseResults = {};
    
    results.forEach(exam => {
      examWiseResults[exam.examId] = exam.candidates
        .filter(candidate => candidate.correctAnswers > 0)
        .sort((a, b) => {
          if (b.correctAnswers === a.correctAnswers) {
            return a.timestamp.localeCompare(b.timestamp);
          }
          return b.correctAnswers - a.correctAnswers;
        })
        .slice(0, 3);
    });
    
    return examWiseResults;
  };

  const findUserRank = (topThree, regNo) => {
    for (const examId in topThree) {
      const rankIndex = topThree[examId].findIndex(
        candidate => candidate.registrationId === regNo
      );
      if (rankIndex !== -1) {
        return {
          rank: rankIndex + 1,
          examTitle: examId,
          candidateData: topThree[examId][rankIndex]
        };
      }
    }
    return null;
  };

  const handleSearch = async () => {
    if (!registrationNo.trim()) {
      setError('Please enter a registration number');
      return;
    }

    setLoading(true);
    setError('');
    setAlreadyClaimed(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/all-exam-results`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const topThreeByExam = getTopThreeByExam(data.data);
      const userRankInfo = findUserRank(topThreeByExam, registrationNo);
      setResultData(userRankInfo);
      setShowModal(true);

    } catch (error) {
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChoice = async (selectedOption) => {
    if (!resultData) return;

    setSavingChoice(true);
    try {
      const today = new Date();
      const dateString = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

      const response = await fetch(`${API_BASE_URL}/api/save-winner-choice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examTitle: resultData.examTitle,
          registrationNumber: registrationNo,
          rank: resultData.rank,
          selectedOption: selectedOption,
          dateCreated: dateString
        })
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error && data.error.includes('already recorded')) {
          setAlreadyClaimed(true);
          setSavingChoice(false);
          return;
        }
        throw new Error(data.error || 'Failed to save choice');
      }

      setShowModal(false);
      showToast('Thank you! We will contact you within 2 days.', 'success');

    } catch (error) {
      if (error.message.includes('already recorded')) {
        setAlreadyClaimed(true);
      } else {
        showToast('Failed to save your choice. Please try again.', 'error');
      }
    } finally {
      setSavingChoice(false);
    }
  };

  const openPrizeDetails = () => {
    Linking.openURL('https://drive.google.com/file/d/1RgPxDZ_SHcr8-JX8ZWJ6X498r9egAfVU/view?usp=sharing');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Icon name="trophy" size={32} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>Prize Winner Search</Text>
          <Text style={styles.headerSubtitle}>Check if you've won a prize!</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Registration Number</Text>
            <View style={styles.inputWrapper}>
              <Icon name="identifier" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={registrationNo}
                onChangeText={setRegistrationNo}
                placeholder="Enter your registration number"
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
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading && <ActivityIndicator color="#FFFFFF" size="small" style={{marginRight: 8}} />}
            <Icon name={loading ? "loading" : "magnify"} size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {loading ? '  Searching...' : '  Check Your Prize'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Result Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {resultData ? (
                <View style={styles.resultContainer}>
                  {/* Success Icon */}
                  <View style={styles.successIconContainer}>
                    <Icon name="trophy" size={48} color="#f59e0b" />
                  </View>
                  
                  <Text style={styles.congratsText}>Congratulations!</Text>
                  
                  <View style={styles.prizeCard}>
                    <View style={styles.rankRow}>
                      <Icon name="medal" size={20} color="#3b82f6" />
                      <Text style={styles.rankText}>
                        You have secured <Text style={styles.rankBold}>Rank {resultData.rank}</Text>
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.prizeAmountRow}>
                      <Text style={styles.prizeText}>Equivalent Prize Amount</Text>
                      <View style={styles.prizeAmountBadge}>
                        <Icon name="currency-inr" size={20} color="#10b981" />
                        <Text style={styles.prizeAmount}>{getPrizeAmount(resultData.rank)}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.outlineButton}
                    onPress={openPrizeDetails}
                    activeOpacity={0.7}
                  >
                    <Icon name="file-document" size={18} color="#3b82f6" />
                    <Text style={styles.outlineButtonText}>  View Prize Details</Text>
                  </TouchableOpacity>

                  {alreadyClaimed ? (
                    <View style={styles.claimedNoteContainer}>
                      <View style={styles.claimedNoteHeader}>
                        <Icon name="information" size={24} color="#3b82f6" />
                        <Text style={styles.claimedNoteTitle}>Already Claimed</Text>
                      </View>
                      <Text style={styles.claimedNoteText}>
                        You have already made your choice for this prize. Our team will contact you within 2 days.
                      </Text>
                      <Text style={styles.claimedNoteSubText}>
                        If you need to make changes, please contact our support team.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.choiceButton, styles.productButton]}
                        onPress={() => handleSaveChoice('product')}
                        disabled={savingChoice}
                        activeOpacity={0.8}
                      >
                        {savingChoice && <ActivityIndicator color="#FFFFFF" size="small" style={{marginRight: 8}} />}
                        <Icon name="gift" size={18} color="#FFFFFF" />
                        <Text style={styles.choiceButtonText}>
                          {savingChoice ? '  Saving...' : '  Get Equivalent Product'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.choiceButton, styles.cashButton]}
                        onPress={() => handleSaveChoice('cash')}
                        disabled={savingChoice}
                        activeOpacity={0.8}
                      >
                        {savingChoice && <ActivityIndicator color="#FFFFFF" size="small" style={{marginRight: 8}} />}
                        <Icon name="cash" size={18} color="#FFFFFF" />
                        <Text style={styles.choiceButtonText}>
                          {savingChoice ? '  Saving...' : '  Get Cash Prize'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.resultContainer}>
                  {/* Error Icon */}
                  <View style={[styles.successIconContainer, { backgroundColor: '#fee2e2' }]}>
                    <Icon name="close-circle" size={48} color="#dc2626" />
                  </View>
                  
                  <Text style={styles.notFoundTitle}>Not in Top 3</Text>
                  <Text style={styles.notFoundText}>
                    Sorry, you are not among the top 3 rank holders.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  resultContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  congratsText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 20,
  },
  prizeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rankText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginLeft: 8,
  },
  rankBold: {
    fontWeight: '800',
    color: '#3b82f6',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  prizeAmountRow: {
    alignItems: 'center',
  },
  prizeText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  prizeAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  prizeAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
    marginLeft: 4,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productButton: {
    backgroundColor: '#10b981',
  },
  cashButton: {
    backgroundColor: '#3b82f6',
  },
  choiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  claimedNoteContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  claimedNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  claimedNoteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
    marginLeft: 8,
  },
  claimedNoteText: {
    fontSize: 15,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: '500',
  },
  claimedNoteSubText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
  },
  notFoundText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
});

export default FindWinner;