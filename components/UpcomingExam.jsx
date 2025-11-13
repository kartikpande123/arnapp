import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { EventSourcePolyfill } from 'event-source-polyfill';
import API_BASE_URL from './ApiConfig';

const { width } = Dimensions.get('window');

const UpcomingExams = ({ navigation }) => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cleanup = setupSSEListener();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const setupSSEListener = () => {
    try {
      const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/api/exams`, {
        headers: {},
      });

      eventSource.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          if (response.success) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const upcoming = response.data
              .filter((exam) => {
                const examDate = new Date(exam.date);
                return examDate >= tomorrow;
              })
              .sort((a, b) => new Date(a.date) - new Date(b.date));

            setUpcomingExams(upcoming);
            setError(null);
          } else {
            setError(response.error || 'Failed to load upcoming exams');
          }
          setLoading(false);
        } catch (err) {
          console.error('Error parsing SSE data:', err);
          setError('Failed to process server data');
          setLoading(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Error with SSE connection:', error);
        setError('Connection to server lost. Retrying...');
        eventSource.close();
        
        // Fallback to regular fetch
        fetchExams();
      };

      return () => {
        eventSource.close();
      };
    } catch (error) {
      console.error('Error setting up SSE:', error);
      fetchExams();
      return null;
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exams`);
      const data = await response.json();
      
      if (data.success) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const upcoming = data.data
          .filter((exam) => {
            const examDate = new Date(exam.date);
            return examDate >= tomorrow;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setUpcomingExams(upcoming);
        setError(null);
      } else {
        setError(data.error || 'Failed to load upcoming exams');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to fetch exam data');
      setLoading(false);
    }
  };

  const handleApplyClick = (exam) => {
    navigation.navigate('ExamForm', { selectedExam: exam.id });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDaysUntilExam = (dateStr) => {
    const examDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderExamCard = ({ item: exam }) => {
    const daysRemaining = getDaysUntilExam(exam.date);
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.examId} numberOfLines={2}>
              {exam.id}
            </Text>
            <View style={styles.marksBadge}>
              <Text style={styles.marksText}>{exam.marks}</Text>
              <Text style={styles.marksLabel}>Marks</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.daysRemainingContainer}>
            <View style={styles.daysRemainingBadge}>
              <Text style={styles.daysRemainingIcon}>⏱️</Text>
              <Text style={styles.daysRemainingText}>
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>{formatDate(exam.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>
              {exam.startTime} - {exam.endTime}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏆</Text>
            <Text style={styles.infoText}>Total Marks: {exam.marks}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => handleApplyClick(exam)}
          activeOpacity={0.7}
        >
          <Text style={styles.applyButtonText}>Apply Now</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading exams...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            setupSSEListener();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Live Examinations</Text>
        <Text style={styles.headerSubtitle}>Prepare for your next challenge</Text>
      </View>

      {upcomingExams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No upcoming exams scheduled</Text>
          <Text style={styles.emptySubtext}>Check back later for new exams</Text>
        </View>
      ) : (
        <FlatList
          data={upcomingExams}
          renderItem={renderExamCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    backgroundColor: '#1a3b5d',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#f0f0f0',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#1a3b5d',
    padding: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  marksBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  marksText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  marksLabel: {
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
  },
  cardBody: {
    padding: 20,
  },
  daysRemainingContainer: {
    marginBottom: 16,
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#667eea',
  },
  daysRemainingIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  daysRemainingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  infoText: {
    fontSize: 15,
    color: '#495057',
    flex: 1,
  },
  applyButton: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 8,
  },
  arrowIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 64,
  },
  errorText: {
    fontSize: 16,
    color: '#f5576c',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UpcomingExams;