import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

const MainExam = ({ route, navigation }) => {
  const { candidateId, examName } = route.params;
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [examEndTime, setExamEndTime] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestionIndex]);

  // Load saved answers from AsyncStorage equivalent
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // In real app, use AsyncStorage
        // const savedAnswers = await AsyncStorage.getItem(`exam_${examName}_${candidateId}`);
        // if (savedAnswers) setSelectedAnswers(JSON.parse(savedAnswers));
        
        // const savedSkipped = await AsyncStorage.getItem(`skipped_${examName}_${candidateId}`);
        // if (savedSkipped) setSkippedQuestions(JSON.parse(savedSkipped));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, [examName, candidateId]);

  // Save to AsyncStorage when answers change
  useEffect(() => {
    const saveData = async () => {
      try {
        // await AsyncStorage.setItem(`exam_${examName}_${candidateId}`, JSON.stringify(selectedAnswers));
        // await AsyncStorage.setItem(`skipped_${examName}_${candidateId}`, JSON.stringify(skippedQuestions));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };
    saveData();
  }, [selectedAnswers, skippedQuestions]);

  // Timer logic
  useEffect(() => {
    let timerInterval;
    const getCurrentISTTime = () => {
      const now = new Date();
      const istOffset = 330;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      return new Date(utc + (istOffset * 60000));
    };

    const parseISTDateTime = (dateStr, timeStr) => {
      let year, month, day;
      if (dateStr.includes('-')) {
        [year, month, day] = dateStr.split('-');
      } else {
        const parts = dateStr.split('/');
        month = parts[0];
        day = parts[1];
        year = parts[2];
      }
      
      let hours, minutes;
      const timeUpper = timeStr.trim().toUpperCase();
      
      if (timeUpper.includes('AM') || timeUpper.includes('PM')) {
        const isPM = timeUpper.includes('PM');
        const timeOnly = timeUpper.replace(/AM|PM/g, '').trim();
        const [h, m] = timeOnly.split(':');
        
        hours = parseInt(h);
        minutes = parseInt(m) || 0;
        
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        const [h, m] = timeStr.split(':');
        hours = parseInt(h);
        minutes = parseInt(m) || 0;
      }
      
      const hoursStr = hours.toString().padStart(2, '0');
      const minutesStr = minutes.toString().padStart(2, '0');
      const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hoursStr}:${minutesStr}:00+05:30`;
      
      return new Date(isoString);
    };

    const fetchExamTime = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/today-exams`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const currentExam = data.data.find(exam => exam.date === getCurrentISTTime().toISOString().split('T')[0]);
          if (currentExam) {
            const endTime = parseISTDateTime(currentExam.date, currentExam.endTime);
            setExamEndTime(endTime);
            
            timerInterval = setInterval(() => {
              const now = getCurrentISTTime();
              const diff = endTime - now;
              
              if (diff <= 0) {
                clearInterval(timerInterval);
                handleExamTimeout();
              } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                setTimeRemaining({ hours, minutes, seconds });
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error fetching exam time:', error);
      }
    };

    fetchExamTime();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // Fetch questions
  useEffect(() => {
    const fetchTodaysExam = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE_URL}/api/exam-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today, examName })
        });

        const data = await response.json();
        if (data.success && data.data.questions) {
          setQuestions(data.data.questions);
        } else {
          Alert.alert('Error', 'No exam scheduled for today');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching questions:', err);
        Alert.alert('Error', 'Failed to load exam questions');
        setLoading(false);
      }
    };

    fetchTodaysExam();
  }, [examName]);

  const handleExamTimeout = async () => {
    try {
      const answersToSubmit = questions.map(question => ({
        registrationNumber: candidateId,
        questionId: question.id.startsWith('Q') ? question.id : `Q${question.id}`,
        answer: selectedAnswers[question.id] !== undefined ? selectedAnswers[question.id] : null,
        examName,
        order: questions.findIndex(q => q.id === question.id) + 1,
        skipped: skippedQuestions.includes(question.id)
      }));

      await fetch(`${API_BASE_URL}/api/timeout-save-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToSubmit })
      });

      // Clear AsyncStorage
      // await AsyncStorage.removeItem(`exam_${examName}_${candidateId}`);
      // await AsyncStorage.removeItem(`skipped_${examName}_${candidateId}`);
      
      setShowCompletionModal(true);
      
      setTimeout(() => {
        navigation.navigate('Home', {
          candidateId,
          examName,
          answeredQuestions: Object.keys(selectedAnswers).length,
          skippedQuestions: skippedQuestions.length,
          totalQuestions: questions.length,
          timeoutSubmission: true
        });
      }, 3000);
    } catch (error) {
      console.error('Error saving timeout answers:', error);
    }
  };

  const handleAnswerSelection = async (questionId, answer) => {
    try {
      const newAnswers = { ...selectedAnswers, [questionId]: answer };
      setSelectedAnswers(newAnswers);
      
      if (skippedQuestions.includes(questionId)) {
        setSkippedQuestions(prev => prev.filter(id => id !== questionId));
      }

      const formattedQuestionId = questionId.startsWith('Q') ? questionId : `Q${questionId}`;
      
      await fetch(`${API_BASE_URL}/api/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: candidateId,
          questionId: formattedQuestionId,
          answer: answer,
          examName,
          order: currentQuestionIndex + 1,
          skipped: false
        })
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSkipQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.id;

    try {
      setSkippedQuestions(prev => [...prev, questionId]);
      
      const newAnswers = { ...selectedAnswers };
      delete newAnswers[questionId];
      setSelectedAnswers(newAnswers);

      const formattedQuestionId = questionId.startsWith('Q') ? questionId : `Q${questionId}`;
      
      await fetch(`${API_BASE_URL}/api/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: candidateId,
          questionId: formattedQuestionId,
          answer: null,
          examName,
          order: currentQuestionIndex + 1,
          skipped: true
        })
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        resetAnimations();
      }
    } catch (error) {
      console.error('Error marking question as skipped:', error);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetAnimations();
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (!selectedAnswers[currentQuestion.id] && !skippedQuestions.includes(currentQuestion.id)) {
      Alert.alert('Required', 'Please select an answer or skip the question');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetAnimations();
    } else {
      handleExamCompletion();
    }
  };

  const resetAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.95);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleExamCompletion = async () => {
    try {
      const answersToSubmit = questions.map(question => ({
        registrationNumber: candidateId,
        questionId: question.id.startsWith('Q') ? question.id : `Q${question.id}`,
        answer: selectedAnswers[question.id] !== undefined ? selectedAnswers[question.id] : null,
        examName,
        order: questions.findIndex(q => q.id === question.id) + 1,
        skipped: skippedQuestions.includes(question.id)
      }));

      await fetch(`${API_BASE_URL}/api/complete-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          examName,
          answers: answersToSubmit,
          submitted: true
        })
      });

      // Clear AsyncStorage
      // await AsyncStorage.removeItem(`exam_${examName}_${candidateId}`);
      // await AsyncStorage.removeItem(`skipped_${examName}_${candidateId}`);
      
      setShowCompletionModal(true);

      setTimeout(() => {
        navigation.navigate('Home', { 
          candidateId,
          examName,
          answeredQuestions: Object.keys(selectedAnswers).length,
          skippedQuestions: skippedQuestions.length,
          totalQuestions: questions.length
        });
      }, 3000);
    } catch (error) {
      console.error('Error completing exam:', error);
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your exam...</Text>
        </LinearGradient>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.modalGradient}
            >
              <Icon name="checkmark-circle" size={80} color="#fff" />
              <Text style={styles.modalTitle}>Exam Completed!</Text>
              <Text style={styles.modalSubtitle}>
                Redirecting to dashboard...
              </Text>
              <ActivityIndicator size="small" color="#fff" style={styles.modalSpinner} />
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.examTitle} numberOfLines={1}>{examName}</Text>
          {timeRemaining && (
            <View style={styles.timerContainer}>
              <Icon name="time-outline" size={16} color="#fff" />
              <Text style={styles.timerText}>
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                { width: `${progress}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.questionCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Question Number Badge */}
          <View style={styles.questionBadge}>
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={styles.badgeGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={styles.badgeText}>Q{currentQuestionIndex + 1}</Text>
            </LinearGradient>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {/* Question Image */}
          {currentQuestion.image && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentQuestion.image }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion.id] === index.toString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBox,
                    isSelected && styles.optionBoxSelected
                  ]}
                  onPress={() => handleAnswerSelection(currentQuestion.id, index.toString())}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={isSelected ? ['#3b82f6', '#2563eb'] : ['#fff', '#fff']}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionContent}>
                      <View style={[
                        styles.optionRadio,
                        isSelected && styles.optionRadioSelected
                      ]}>
                        {isSelected && (
                          <View style={styles.optionRadioInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected
                      ]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <LinearGradient
          colors={['#f9fafb', '#fff']}
          style={styles.footerGradient}
        >
          <View style={styles.footerContent}>
            {/* Previous Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonSecondary,
                currentQuestionIndex === 0 && styles.navButtonDisabled
              ]}
              onPress={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              activeOpacity={0.7}
            >
              <Icon 
                name="chevron-back" 
                size={20} 
                color={currentQuestionIndex === 0 ? '#9ca3af' : '#3b82f6'} 
              />
              <Text style={[
                styles.navButtonText,
                styles.navButtonTextSecondary,
                currentQuestionIndex === 0 && styles.navButtonTextDisabled
              ]}>
                Previous
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonWarning]}
              onPress={handleSkipQuestion}
              activeOpacity={0.7}
            >
              <Icon name="play-skip-forward" size={18} color="#fff" />
              <Text style={[styles.navButtonText, styles.navButtonTextLight]}>
                Skip
              </Text>
            </TouchableOpacity>

            {/* Next/Finish Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonPrimary,
                (!selectedAnswers[currentQuestion.id] && !skippedQuestions.includes(currentQuestion.id)) && 
                styles.navButtonDisabled
              ]}
              onPress={handleNextQuestion}
              disabled={!selectedAnswers[currentQuestion.id] && !skippedQuestions.includes(currentQuestion.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  (!selectedAnswers[currentQuestion.id] && !skippedQuestions.includes(currentQuestion.id))
                    ? ['#9ca3af', '#6b7280']
                    : ['#10b981', '#059669']
                }
                style={styles.navButtonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
              >
                <Text style={[styles.navButtonText, styles.navButtonTextLight]}>
                  {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </Text>
                <Icon 
                  name={currentQuestionIndex === questions.length - 1 ? "checkmark" : "chevron-forward"} 
                  size={20} 
                  color="#fff" 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questionBadge: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
  },
  badgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  questionImage: {
    width: width - 80,
    height: 200,
    borderRadius: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  optionBox: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionBoxSelected: {
    elevation: 4,
  },
  optionGradient: {
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#fff',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    minWidth: 24,
  },
  optionLabelSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  footerContent: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  navButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  navButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  navButtonPrimary: {
    overflow: 'hidden',
  },
  navButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  navButtonTextSecondary: {
    color: '#3b82f6',
  },
  navButtonTextLight: {
    color: '#fff',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
  },
  modalGradient: {
    padding: 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSpinner: {
    marginTop: 8,
  },
});

export default MainExam;