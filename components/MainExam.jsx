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
  Dimensions,
  Image,
  Modal,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNPrint from 'react-native-print';
import API_BASE_URL from './ApiConfig';
import styles from "./MainExamStyles"

const { width, height } = Dimensions.get('window');

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
  const [timeExpired, setTimeExpired] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const navigationRef = useRef(false);

  // Prevent back button during exam
  useEffect(() => {
    const subscription = navigation.addListener('beforeRemove', (e) => {
      if (examCompleted || navigationRef.current) {
        // Allow navigation if exam is completed
        return;
      }

      // Prevent default behavior
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        'Exit Exam?',
        'Are you sure you want to exit? Your progress will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit', 
            onPress: () => navigation.dispatch(e.data.action),
            style: 'destructive'
          }
        ]
      );
    });

    return () => subscription();
  }, [examCompleted, navigation]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (examCompleted || navigationRef.current) {
        // If exam completed, close the app
        BackHandler.exitApp();
        return true;
      }
      
      // During exam, show exit confirmation
      Alert.alert(
        'Exit Exam?',
        'Are you sure you want to exit? Your progress will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit', 
            onPress: () => navigation.goBack(),
            style: 'destructive'
          }
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [examCompleted, navigation]);

  // Load saved answers from AsyncStorage
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedAnswers = await AsyncStorage.getItem(`exam_${examName}_${candidateId}`);
        if (savedAnswers) setSelectedAnswers(JSON.parse(savedAnswers));
        
        const savedSkipped = await AsyncStorage.getItem(`skipped_${examName}_${candidateId}`);
        if (savedSkipped) setSkippedQuestions(JSON.parse(savedSkipped));
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
        await AsyncStorage.setItem(`exam_${examName}_${candidateId}`, JSON.stringify(selectedAnswers));
        await AsyncStorage.setItem(`skipped_${examName}_${candidateId}`, JSON.stringify(skippedQuestions));
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
        const response = await fetch(`${API_BASE_URL}/api/today-exams/json`);
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
                setTimeExpired(true);
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

  const formatTime = (timeObj) => {
    if (!timeObj) return "00:00:00";
    return `${String(timeObj.hours).padStart(2, '0')}:${String(timeObj.minutes).padStart(2, '0')}:${String(timeObj.seconds).padStart(2, '0')}`;
  };

  // Generate PDF
  const generatePDF = async () => {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
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
            .header {
              background: linear-gradient(135deg, #1a3b5d 0%, #2563eb 100%);
              padding: 20px 30px;
              text-align: center;
              color: white;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .summary-info {
              background: #f8fafc;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
              border-left: 4px solid #3b82f6;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 15px;
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
            .question {
              margin: 10px 0;
              padding: 8px;
              border-left: 3px solid #3498db;
              background: white;
              border-radius: 4px;
            }
            .skipped { color: #e74c3c; font-weight: bold; }
            .answered { color: #27ae60; font-weight: bold; }
            .not-attempted { color: #95a5a6; font-style: italic; }
            .footer {
              text-align: center;
              padding: 12px 20px;
              background: #f8fafc;
              border-top: 2px dashed #e5e7eb;
              margin-top: 20px;
            }
            .footer-text {
              color: #6b7280;
              font-size: 9px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exam Answer Sheet</h1>
            <p><strong>ARN STUDY ACADEMY</strong></p>
          </div>
          
          <div class="summary-info">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Registration ID</div>
                <div class="info-value">${candidateId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Exam Title</div>
                <div class="info-value">${examName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${new Date().toLocaleDateString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Time</div>
                <div class="info-value">${new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            
            <div style="margin-top: 10px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span><strong>Total Questions:</strong> ${questions.length}</span>
                <span><strong>Answered:</strong> ${Object.keys(selectedAnswers).length}</span>
                <span><strong>Skipped:</strong> ${skippedQuestions.length}</span>
                <span><strong>Not Attempted:</strong> ${questions.length - Object.keys(selectedAnswers).length - skippedQuestions.length}</span>
              </div>
            </div>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">Question-wise Answers</h3>
      `;

      questions.forEach((question, index) => {
        const selectedAnswer = selectedAnswers[question.id];
        const isSkipped = skippedQuestions.includes(question.id);
        
        let answerText;
        if (isSkipped) {
          answerText = `<span class="skipped">❌ Skipped</span>`;
        } else if (selectedAnswer !== undefined) {
          const answerLetter = String.fromCharCode(65 + parseInt(selectedAnswer, 10));
          answerText = `<span class="answered">✅ Selected answer: ${answerLetter}</span>`;
        } else {
          answerText = `<span class="not-attempted">⏸️ No answer recorded</span>`;
        }

        htmlContent += `
          <div class="question">
            <strong>Q${index + 1}:</strong> ${answerText}
          </div>
        `;
      });

      htmlContent += `
          <div class="footer">
            <div class="footer-text">
              <strong>This is a system-generated answer sheet.</strong><br>
              © ${new Date().getFullYear()} ARN STUDY ACADEMY. All rights reserved.
            </div>
          </div>
        </body>
      </html>
      `;

      await RNPrint.print({ html: htmlContent });
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate answer sheet');
      return false;
    }
  };

  const handleExamTimeout = async () => {
    // Prevent multiple timeout submissions
    if (examCompleted || navigationRef.current) {
      return;
    }

    setExamCompleted(true);
    navigationRef.current = true;

    try {
      const answersToSubmit = questions.map((question, index) => ({
        registrationNumber: candidateId,
        questionId: question.id.startsWith('Q') ? question.id : `Q${question.id}`,
        answer: selectedAnswers[question.id] !== undefined ? selectedAnswers[question.id] : null,
        examName,
        order: index + 1,
        skipped: skippedQuestions.includes(question.id)
      }));

      await fetch(`${API_BASE_URL}/api/timeout-save-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToSubmit })
      });

      // Clear storage
      await AsyncStorage.removeItem(`exam_${examName}_${candidateId}`);
      await AsyncStorage.removeItem(`skipped_${examName}_${candidateId}`);
      
      // Show completion modal
      setShowCompletionModal(true);
      
      // Navigate to Dashboard after 3 seconds
      setTimeout(() => {
        navigation.replace('Dashboard', {
          candidateId,
          examName,
          answeredQuestions: Object.keys(selectedAnswers).length,
          skippedQuestions: skippedQuestions.length,
          totalQuestions: questions.length,
          timeoutSubmission: true
        });
      }, 9000);
      
    } catch (error) {
      console.error('Error saving timeout answers:', error);
      
      // Still navigate to Dashboard even if save fails
      setTimeout(() => {
        navigation.replace('Dashboard', {
          candidateId,
          examName,
          answeredQuestions: Object.keys(selectedAnswers).length,
          skippedQuestions: skippedQuestions.length,
          totalQuestions: questions.length,
          timeoutSubmission: true
        });
      }, 3000);
    }
  };

  // Answer selection
  const handleAnswerSelection = async (questionId, answer) => {
    try {
      // Update local state first
      const newAnswers = { ...selectedAnswers, [questionId]: answer };
      setSelectedAnswers(newAnswers);
      
      // Remove from skipped questions if it was previously skipped
      if (skippedQuestions.includes(questionId)) {
        setSkippedQuestions(prev => prev.filter(id => id !== questionId));
      }

      // Format question ID
      const formattedQuestionId = questionId.startsWith('Q') ? questionId : `Q${questionId}`;
      
      // Save to backend
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

  // Skip Question
  const handleSkipQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion.id;

    try {
      // Update local state - Add to skipped if not already there
      if (!skippedQuestions.includes(questionId)) {
        setSkippedQuestions(prev => [...prev, questionId]);
      }
      
      // Remove any previously selected answer
      const newAnswers = { ...selectedAnswers };
      delete newAnswers[questionId];
      setSelectedAnswers(newAnswers);

      // Save skipped status to backend
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

      // Move to next question IMMEDIATELY
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // If last question, complete exam
        handleExamCompletion();
      }
    } catch (error) {
      console.error('Error marking question as skipped:', error);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];

    // Check if current question is answered or skipped
    if (!selectedAnswers[currentQuestion.id] && !skippedQuestions.includes(currentQuestion.id)) {
      Alert.alert('Required', 'Please select an answer or skip the question');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleExamCompletion();
    }
  };

  // Exam Completion - Show full screen exit modal instead of navigating
  const handleExamCompletion = async () => {
    // Prevent multiple submissions
    if (examCompleted || navigationRef.current) {
      return;
    }

    setExamCompleted(true);
    navigationRef.current = true;
    
    try {
      // Prepare answers
      const answersToSubmit = questions.map((question, index) => {
        const isSkipped = skippedQuestions.includes(question.id);
        const selectedAnswer = selectedAnswers[question.id];
        
        return {
          registrationNumber: candidateId,
          questionId: question.id.startsWith('Q') ? question.id : `Q${question.id}`,
          answer: selectedAnswer !== undefined ? selectedAnswer : null,
          examName,
          order: index + 1,
          skipped: isSkipped
        };
      });

      // Submit exam
      const response = await fetch(`${API_BASE_URL}/api/complete-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          examName,
          answers: answersToSubmit,
          submitted: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit exam');
      }

      // Generate PDF
      await generatePDF();

      // Clear storage
      await AsyncStorage.removeItem(`exam_${examName}_${candidateId}`);
      await AsyncStorage.removeItem(`skipped_${examName}_${candidateId}`);
      
      // Show completion modal - User MUST close app from here
      setShowCompletionModal(true);
      
    } catch (error) {
      console.error('Error completing exam:', error);
      
      // Reset flags on error
      setExamCompleted(false);
      navigationRef.current = false;
      
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
    }
  };

  const handleCloseApp = () => {
    BackHandler.exitApp();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#1e40af" translucent={false} />
        <LinearGradient
          colors={['#1e40af', '#3b82f6', '#60a5fa']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your exam...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1e40af" 
        translucent={false} 
      />
      
      {/* Full Screen Completion Modal - Force App Close */}
      <Modal
        visible={showCompletionModal}
        transparent={false}
        animationType="fade"
      >
        <LinearGradient
          colors={['#10b981', '#059669', '#047857']}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 30
          }}
        >
          <View style={{
            backgroundColor: 'white',
            padding: 40,
            borderRadius: 20,
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10
          }}>
            <Icon name="checkmark-circle" size={100} color="#10b981" />
            
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              marginTop: 20,
              marginBottom: 10,
              textAlign: 'center',
              color: '#1f2937'
            }}>
              Exam Completed!
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: '#6b7280',
              marginBottom: 30,
              textAlign: 'center',
              lineHeight: 24
            }}>
              Your answers have been submitted successfully and answer sheet has been downloaded.
            </Text>

            <View style={{
              backgroundColor: '#fef3c7',
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b',
              padding: 20,
              borderRadius: 10,
              marginBottom: 30,
              width: '100%'
            }}>
              <Text style={{
                fontSize: 14,
                color: '#92400e',
                textAlign: 'center',
                fontWeight: '600',
                lineHeight: 20
              }}>
                ⚠️Please close the app completely from your recent apps and restart it for future use.
                {'\n\n'}
                <Text style={{ fontSize: 12, fontWeight: '400' }}>
                  Note: Closing the app is mandatory for storing all results properly in our database.
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#ef4444',
                paddingVertical: 16,
                paddingHorizontal: 40,
                borderRadius: 12,
                width: '100%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5
              }}
              onPress={handleCloseApp}
              activeOpacity={0.8}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="exit-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  Close App
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={{
              fontSize: 11,
              color: '#9ca3af',
              marginTop: 20,
              textAlign: 'center'
            }}>
              Thank you for using ARN Study Academy
            </Text>
          </View>
        </LinearGradient>
      </Modal>

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Header */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.examTitle} numberOfLines={1}>{examName}</Text>
              {timeRemaining && (
                <View style={[
                  styles.timerContainer,
                  timeRemaining.hours === 0 && timeRemaining.minutes < 5 && styles.timerWarning
                ]}>
                  <Icon name="time-outline" size={18} color="#fff" />
                  <Text style={styles.timerText}>
                    {formatTime(timeRemaining)}
                  </Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${progress}%` }
                  ]}
                />
              </View>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionCard}>
            {/* Question Number Badge */}
            <View style={styles.questionBadge}>
              <LinearGradient
                colors={['#6366f1', '#4f46e5', '#4338ca']}
                style={styles.badgeGradient}
              >
                <Icon name="help-circle" size={20} color="#fff" style={styles.badgeIcon} />
                <Text style={styles.badgeText}>Question {currentQuestionIndex + 1}</Text>
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
                    <View style={styles.optionContent}>
                      <View style={[
                        styles.optionRadio,
                        isSelected && styles.optionRadioSelected
                      ]}>
                        {isSelected && (
                          <View style={styles.optionRadioInner} />
                        )}
                      </View>
                      <View style={styles.optionLabelContainer}>
                        <Text style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected
                        ]}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Navigation Footer */}
        <View style={styles.footer}>
          <LinearGradient
            colors={['#ffffff', '#f9fafb']}
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
                <View style={styles.navButtonInner}>
                  <Icon 
                    name="chevron-back" 
                    size={22} 
                    color={currentQuestionIndex === 0 ? '#9ca3af' : '#3b82f6'} 
                  />
                  <Text style={[
                    styles.navButtonText,
                    styles.navButtonTextSecondary,
                    currentQuestionIndex === 0 && styles.navButtonTextDisabled
                  ]}>
                    Previous
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Skip Button */}
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonWarning]}
                onPress={handleSkipQuestion}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.navButtonGradient}
                >
                  <View style={styles.navButtonInner}>
                    <Icon name="play-skip-forward" size={20} color="#fff" />
                    <Text style={[styles.navButtonText, styles.navButtonTextLight]}>
                      Skip
                    </Text>
                  </View>
                </LinearGradient>
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
                >
                  <View style={styles.navButtonInner}>
                    <Text style={[styles.navButtonText, styles.navButtonTextLight]}>
                      {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    </Text>
                    <Icon 
                      name={currentQuestionIndex === questions.length - 1 ? "checkmark-circle" : "chevron-forward"} 
                      size={22} 
                      color="#fff" 
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </>
  );
};

export default MainExam;