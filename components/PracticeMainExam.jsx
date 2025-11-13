import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Image,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const PracticeMainExam = ({ navigation, route }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [examDetails, setExamDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [submittingResults, setSubmittingResults] = useState(false);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        console.log('Attempting to fetch exam data from AsyncStorage...');
        const examInfoString = await AsyncStorage.getItem('practiceExamSession');
        console.log('Raw AsyncStorage data:', examInfoString);
        
        if (!examInfoString) {
          throw new Error('No exam information found in AsyncStorage');
        }

        const examInfo = JSON.parse(examInfoString);
        console.log('Parsed exam info:', examInfo);

        // Validate exam info structure
        if (!examInfo.examDetails || !examInfo.examDetails.title || !examInfo.examDetails.category) {
          throw new Error('Invalid exam information structure');
        }

        if (examInfo.examDetails.timeLimit && examInfo.examDetails.timeLimit !== 'N/A') {
          const timeLimitParts = examInfo.examDetails.timeLimit.split(':');
          if (timeLimitParts.length === 2) {
            const [hours, minutes] = timeLimitParts.map(Number);
            const totalSeconds = (hours * 60 * 60) + (minutes * 60);
            setTimeRemaining(totalSeconds);
            console.log('Timer set to:', totalSeconds, 'seconds');
          }
        } else {
          setTimeRemaining(null);
          console.log('No time limit set');
        }

        console.log('Fetching questions from API...');
        const apiUrl = `${API_BASE_URL}/api/practice-tests/${examInfo.examDetails.category}/${examInfo.examDetails.title}/questions`;
        console.log('API URL:', apiUrl);
        
        const response = await axios.get(apiUrl);
        console.log('API Response:', response.data);

        if (response.data && response.data.questions && response.data.questions.length > 0) {
          setQuestions(response.data.questions);
          setExamDetails({
            title: examInfo.examDetails.title,
            category: examInfo.examDetails.category,
            timeLimit: examInfo.examDetails.timeLimit || 'N/A',
            purchaseDate: examInfo.examDetails.purchaseDate || null
          });
          console.log('Exam loaded successfully with', response.data.questions.length, 'questions');
        } else {
          throw new Error('No questions found in API response');
        }
      } catch (err) {
        console.error('Error in fetchExamData:', err);
        console.error('Error details:', err.message);
        setError(err.message || 'Error loading exam');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamData();
  }, []);

  useEffect(() => {
    let timerId;
    
    if (timeRemaining !== null && timeRemaining > 0 && !timeExpired) {
      timerId = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerId);
            setTimeExpired(true);
            calculateResults();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timeRemaining, timeExpired]);

  useEffect(() => {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex, questions.length]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return "N/A";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelection = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setShowAnswerFeedback(true);
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;
    
    const currentQuestion = questions[currentQuestionIndex];

    if (!selectedAnswers[currentQuestion.id]) {
      Toast.show({
        type: 'error',
        text1: 'Attention',
        text2: 'Please select an answer before proceeding',
      });
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setShowAnswerFeedback(false);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    setSubmittingResults(true);
    
    const totalQuestions = questions.length;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let answeredQuestions = 0;
    
    questions.forEach(question => {
      const selectedAnswer = selectedAnswers[question.id];
      if (selectedAnswer !== undefined) {
        answeredQuestions++;
        if (parseInt(selectedAnswer) === question.correctAnswer) {
          correctAnswers++;
        } else {
          incorrectAnswers++;
        }
      }
    });
    
    const score = (correctAnswers / totalQuestions) * 100;
    
    setExamResult({
      score: score.toFixed(2),
      correctAnswers,
      totalQuestions,
      incorrectAnswers,
      unansweredQuestions: totalQuestions - answeredQuestions
    });
    
    setTimeout(() => {
      setSubmittingResults(false);
      setShowResultModal(true);
    }, 800);
  };

  const handleStartAgain = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResultModal(false);
    setExamResult(null);
    setTimeExpired(false);
    setShowAnswerFeedback(false);
    
    if (examDetails.timeLimit && examDetails.timeLimit !== 'N/A') {
      const [hours, minutes] = examDetails.timeLimit.split(':').map(Number);
      const totalSeconds = (hours * 60 * 60) + (minutes * 60);
      setTimeRemaining(totalSeconds);
    } else {
      setTimeRemaining(null);
    }
  };

  const getOptionStyle = (optionIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestion.id];
    
    if (!showAnswerFeedback) {
      return selectedAnswer === optionIndex.toString() ? styles.selectedOption : styles.optionBox;
    }
    
    if (optionIndex === currentQuestion.correctAnswer) {
      return styles.correctOption;
    }
    
    if (selectedAnswer === optionIndex.toString() && optionIndex !== currentQuestion.correctAnswer) {
      return styles.incorrectOption;
    }
    
    return styles.optionBox;
  };

  if (loading) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2c3e50" translucent />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading practice exam...</Text>
            <View style={styles.loadingBar}>
              <View style={styles.loadingBarFill} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#e74c3c" translucent />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={64} color="#e74c3c" />
            <Text style={styles.errorTitle}>Error Loading Exam</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.backButtonGradient}
              >
                <Icon name="arrow-left" size={20} color="#fff" />
                <Text style={styles.backButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#f39c12" translucent />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Icon name="file-question" size={64} color="#f39c12" />
            <Text style={styles.errorTitle}>No Questions Available</Text>
            <Text style={styles.errorText}>There are no questions available for this exam.</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.backButtonGradient}
              >
                <Icon name="arrow-left" size={20} color="#fff" />
                <Text style={styles.backButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isAnswerCorrect = selectedAnswers[currentQuestion.id] !== undefined && 
                          parseInt(selectedAnswers[currentQuestion.id]) === currentQuestion.correctAnswer;

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />
      
      {/* Header - Extended to status bar */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle} numberOfLines={1}>{examDetails.title || 'Practice Exam'}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{examDetails.category || 'General'}</Text>
              </View>
            </View>
            <View style={styles.timerContainer}>
              <Icon name="clock-outline" size={18} color="#fff" />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    }),
                    backgroundColor: progressPercentage < 30 ? '#e74c3c' : 
                                    progressPercentage < 70 ? '#f39c12' : '#2ecc71'
                  }
                ]}
              />
            </View>
            <Text style={styles.questionCounter}>
              Question {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.contentSafeArea}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Question Card */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Icon name="help-circle" size={24} color="#3498db" />
              <Text style={styles.questionLabel}>Question</Text>
            </View>
            
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {currentQuestion.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentQuestion.imageUrl }}
                  style={styles.questionImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const optionStyle = getOptionStyle(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionBox, optionStyle]}
                  onPress={() => !showAnswerFeedback && handleAnswerSelection(currentQuestion.id, index.toString())}
                  activeOpacity={0.7}
                  disabled={showAnswerFeedback}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionCircle,
                      selectedAnswers[currentQuestion.id] === index.toString() && styles.optionCircleSelected
                    ]}>
                      <Text style={[
                        styles.optionLabel,
                        selectedAnswers[currentQuestion.id] === index.toString() && styles.optionLabelSelected
                      ]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      selectedAnswers[currentQuestion.id] === index.toString() && styles.optionTextSelected,
                      showAnswerFeedback && index === currentQuestion.correctAnswer && styles.optionTextCorrect,
                      showAnswerFeedback && selectedAnswers[currentQuestion.id] === index.toString() && 
                      index !== currentQuestion.correctAnswer && styles.optionTextIncorrect
                    ]}>
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback Message */}
          {showAnswerFeedback && (
            <View style={[
              styles.feedbackContainer,
              isAnswerCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
            ]}>
              <Icon 
                name={isAnswerCorrect ? "check-circle" : "close-circle"} 
                size={24} 
                color={isAnswerCorrect ? "#2ecc71" : "#e74c3c"} 
              />
              <Text style={[
                styles.feedbackText,
                isAnswerCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect
              ]}>
                {isAnswerCorrect ? 
                  'Correct! Well done!' : 
                  `Incorrect! The correct answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`
                }
              </Text>
            </View>
          )}

          {/* Navigation Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextQuestion}
            disabled={submittingResults}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={submittingResults ? ['#95a5a6', '#7f8c8d'] : ['#27ae60', '#229954']}
              style={styles.nextButtonGradient}
            >
              {submittingResults ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.nextButtonText}>Calculating...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                  </Text>
                  <Icon 
                    name={currentQuestionIndex === questions.length - 1 ? "check" : "arrow-right"} 
                    size={20} 
                    color="#fff" 
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Extra bottom padding for safe area */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Results Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.fullScreenContainer}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" translucent />
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  style={styles.modalHeader}
                >
                  <Icon name="trophy" size={32} color="#fff" />
                  <Text style={styles.modalTitle}>
                    {timeExpired ? 'Time Expired' : 'Exam Complete!'}
                  </Text>
                </LinearGradient>

                <ScrollView 
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalBodyContent}
                >
                  {examResult && (
                    <>
                      {/* Score Circle */}
                      <View style={styles.scoreCircleContainer}>
                        <View style={[
                          styles.scoreCircle,
                          {
                            borderColor: examResult.score >= 70 ? '#2ecc71' : 
                                        examResult.score >= 50 ? '#f39c12' : '#e74c3c'
                          }
                        ]}>
                          <Text style={[
                            styles.scorePercentage,
                            {
                              color: examResult.score >= 70 ? '#2ecc71' : 
                                    examResult.score >= 50 ? '#f39c12' : '#e74c3c'
                            }
                          ]}>
                            {examResult.score}%
                          </Text>
                          <Text style={styles.scoreLabel}>Score</Text>
                        </View>
                      </View>

                      {/* Result Cards */}
                      <View style={styles.resultCardsContainer}>
                        <View style={[styles.resultCard, { backgroundColor: '#2ecc71' }]}>
                          <Icon name="check-circle" size={32} color="#fff" />
                          <Text style={styles.resultCardNumber}>{examResult.correctAnswers}</Text>
                          <Text style={styles.resultCardLabel}>Correct</Text>
                        </View>
                        <View style={[styles.resultCard, { backgroundColor: '#e74c3c' }]}>
                          <Icon name="close-circle" size={32} color="#fff" />
                          <Text style={styles.resultCardNumber}>{examResult.incorrectAnswers}</Text>
                          <Text style={styles.resultCardLabel}>Incorrect</Text>
                        </View>
                      </View>

                      {/* Details */}
                      <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Total Questions:</Text>
                          <Text style={styles.detailValue}>{examResult.totalQuestions}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Time Used:</Text>
                          <Text style={styles.detailValue}>
                            {examDetails.timeLimit && examDetails.timeLimit !== 'N/A' ? 
                              formatTime(timeExpired ? 0 : timeRemaining) : 'N/A'}
                          </Text>
                        </View>
                        {examResult.unansweredQuestions > 0 && (
                          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.detailLabel}>Unanswered:</Text>
                            <Text style={[styles.detailValue, { color: '#f39c12' }]}>
                              {examResult.unansweredQuestions}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalButton}
                          onPress={handleStartAgain}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#27ae60', '#229954']}
                            style={styles.modalButtonGradient}
                          >
                            <Icon name="refresh" size={20} color="#fff" />
                            <Text style={styles.modalButtonText}>Start Again</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.modalButton}
                          onPress={() => navigation.navigate('Dashboard')}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#3498db', '#2980b9']}
                            style={styles.modalButtonGradient}
                          >
                            <Icon name="home" size={20} color="#fff" />
                            <Text style={styles.modalButtonText}>Dashboard</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerSafeArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timerContainer: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  questionCounter: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  contentSafeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  questionImage: {
    width: '100%',
    height: 200,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    minHeight: 60,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
    elevation: 4,
  },
  correctOption: {
    backgroundColor: '#d5f4e6',
    borderColor: '#2ecc71',
    elevation: 4,
  },
  incorrectOption: {
    backgroundColor: '#fee',
    borderColor: '#e74c3c',
    elevation: 4,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  optionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#dee2e6',
    flexShrink: 0,
  },
  optionCircleSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  optionLabelSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    lineHeight: 22,
    flexWrap: 'wrap',
    paddingRight: 8,
  },
  optionTextSelected: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    minHeight: 60,
  },
  feedbackCorrect: {
    backgroundColor: '#d5f4e6',
    borderColor: '#2ecc71',
  },
  feedbackIncorrect: {
    backgroundColor: '#fee',
    borderColor: '#e74c3c',
  },
  feedbackText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  feedbackTextCorrect: {
    color: '#27ae60',
  },
  feedbackTextIncorrect: {
    color: '#c0392b',
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    marginBottom: 16,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 40 : 30,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: height * 0.85,
    overflow: 'hidden',
    elevation: 8,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  modalBody: {
    maxHeight: height * 0.65,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 30,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  resultCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  resultCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },
  resultCardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  resultCardLabel: {
    fontSize: 13,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  loadingBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3498db',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '80%',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PracticeMainExam;