import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import API_BASE_URL from './ApiConfig';

const CheckAnswers = () => {
  const [registrationId, setRegistrationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidateData, setCandidateData] = useState(null);
  const [examData, setExamData] = useState(null);

  const isExamCompleted = (examDateTime) => {
    if (!examDateTime) return false;

    const currentDate = new Date();
    const examDate = new Date(examDateTime.date);

    const [endTimeStr, period] = examDateTime.endTime.split(' ');
    let [hours, minutes] = endTimeStr.split(':');
    hours = parseInt(hours);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    examDate.setHours(hours, parseInt(minutes), 0);
    return currentDate > examDate;
  };

  const fetchCandidateAnswers = async () => {
    setLoading(true);
    setError('');
    try {
      const examResponse = await fetch(`${API_BASE_URL}/api/exams/qa`);
      const examData = await examResponse.json();

      if (!examData.success) {
        setError('Failed to fetch exam details');
        return;
      }

      const candidateResponse = await fetch(
        `${API_BASE_URL}/api/candidate-answers/${registrationId}`
      );
      const candidateData = await candidateResponse.json();

      if (!candidateData.success) {
        setError(candidateData.message || 'Failed to fetch candidate answers');
        setCandidateData(null);
        return;
      }

      const matchedExam = examData.data.find(
        (exam) => exam.id === candidateData.data.candidateDetails.exam
      );

      if (!matchedExam) {
        setError('Exam details not found');
        return;
      }

      if (!isExamCompleted(matchedExam.dateTime)) {
        setError(
          'Your exam is not completed yet. Answers will be available after the exam end time.'
        );
        setCandidateData(null);
        setExamData(null);
        return;
      }

      setCandidateData(candidateData.data);
      setExamData(matchedExam);
    } catch (err) {
      setError('Error fetching data');
      setCandidateData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (name, color = '#000', size = 20) => {
    const icons = {
      search: (
        <View style={{ width: size, height: size }}>
          <Text style={{ fontSize: size, color }}>🔍</Text>
        </View>
      ),
      check: (
        <View style={{ width: size, height: size }}>
          <Text style={{ fontSize: size, color }}>✓</Text>
        </View>
      ),
      cross: (
        <View style={{ width: size, height: size }}>
          <Text style={{ fontSize: size, color }}>✗</Text>
        </View>
      ),
      alert: (
        <View style={{ width: size, height: size }}>
          <Text style={{ fontSize: size, color }}>⚠</Text>
        </View>
      ),
    };
    return icons[name] || null;
  };

  const renderQuestion = (question, candidateAnswer) => {
    const isSkipped = !candidateAnswer || candidateAnswer.skipped;
    const userAnswer = isSkipped ? 'Skipped' : candidateAnswer.answer;
    const isCorrect = !isSkipped && userAnswer === question.correctAnswer;

    return (
      <View key={question.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionHeaderText}>Question {question.order}</Text>
        </View>

        <View style={styles.questionBody}>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isUserAnswer = userAnswer === index;
              const isCorrectAnswer = question.correctAnswer === index;

              let backgroundColor = '#F8F9FA';
              if (isUserAnswer && isCorrect) backgroundColor = '#D1FAE5';
              else if (isUserAnswer && !isCorrect) backgroundColor = '#FEE2E2';
              else if (isCorrectAnswer) backgroundColor = '#D1FAE5';

              return (
                <View
                  key={index}
                  style={[styles.optionItem, { backgroundColor }]}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionLetter}>
                        {String.fromCharCode(65 + index)}.
                      </Text>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      {isUserAnswer && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: isCorrect ? '#10B981' : '#EF4444',
                            },
                          ]}
                        >
                          <Text style={styles.badgeText}>Your Answer</Text>
                        </View>
                      )}
                      {isCorrectAnswer && (
                        <View style={[styles.badge, styles.correctBadge]}>
                          <Text style={styles.badgeText}>Correct</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.answerSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Your Answer:</Text>
              {isSkipped ? (
                <View style={styles.answerValue}>
                  {renderIcon('alert', '#F59E0B', 16)}
                  <Text style={[styles.answerText, { color: '#F59E0B' }]}>
                    Skipped
                  </Text>
                </View>
              ) : (
                <View style={styles.answerValue}>
                  {renderIcon(
                    isCorrect ? 'check' : 'cross',
                    isCorrect ? '#10B981' : '#EF4444',
                    16
                  )}
                  <Text
                    style={[
                      styles.answerText,
                      { color: isCorrect ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    Option {String.fromCharCode(65 + userAnswer)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Correct Answer:</Text>
              <Text style={[styles.answerText, { color: '#10B981' }]}>
                Option {String.fromCharCode(65 + question.correctAnswer)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCandidateInfo = () => {
    if (!candidateData || !examData) return null;

    return (
      <View>
        <View style={styles.candidateInfoCard}>
          <Text style={styles.candidateInfoTitle}>Candidate Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {candidateData.candidateDetails.name}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Exam ID</Text>
              <Text style={styles.infoValue}>
                {candidateData.candidateDetails.exam}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(
                  candidateData.candidateDetails.examDate
                ).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Exam Time</Text>
              <Text style={styles.infoValue}>
                {examData.dateTime.startTime} - {examData.dateTime.endTime}
              </Text>
            </View>
          </View>
        </View>

        {examData.questions
          .sort((a, b) => a.order - b.order)
          .map((question) => {
            const candidateAnswer = candidateData.answers.find(
              (ans) => ans.order === question.order
            );
            return renderQuestion(question, candidateAnswer);
          })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam Answer Viewer</Text>
        {loading && <ActivityIndicator color="#fff" size="small" />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Registration ID"
              placeholderTextColor="#9CA3AF"
              value={registrationId}
              onChangeText={setRegistrationId}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.searchButton,
              (!registrationId || loading) && styles.searchButtonDisabled,
            ]}
            onPress={fetchCandidateAnswers}
            disabled={loading || !registrationId}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.searchButtonText}>Loading Exam Key Answers...</Text>
              </>
            ) : (
              <>
                {renderIcon('search', '#fff', 20)}
                <Text style={styles.searchButtonText}>Show Answers</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            {renderIcon('alert', '#DC2626', 20)}
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {renderCandidateInfo()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1a3b5d',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingTop:70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  searchSection: {
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  candidateInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  candidateInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  questionHeader: {
    backgroundColor: '#2563EB',
    padding: 16,
  },
  questionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  questionBody: {
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  optionItem: {
    borderRadius: 12,
    padding: 12,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  badgeContainer: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  correctBadge: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  answerSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  answerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CheckAnswers;