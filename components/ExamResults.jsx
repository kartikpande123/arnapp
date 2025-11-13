import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import API_BASE_URL from './ApiConfig';

const { width, height } = Dimensions.get('window');

const ExamResults = () => {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    if (results) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [results]);

  const fetchAllResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/all-exam-results`);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const examsList = data.data.map(exam => ({
          examId: exam.examId,
          totalCandidates: exam.candidates.length
        }));
        setExams(examsList);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.error('Failed to fetch exam list:', err);
      setExams([]);
      Alert.alert('Error', 'Failed to load exam list');
    }
  };

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchExamResults = async () => {
    if (!selectedExam) {
      setResults(null);
      setFilteredResults([]);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/all-exam-results`);
      const data = await response.json();
      
      if (data.success) {
        const selectedExamData = data.data.find(exam => exam.examId === selectedExam);
        
        if (selectedExamData) {
          const formattedResults = {
            examDetails: {
              examName: selectedExamData.examId,
              date: new Date().toISOString().split('T')[0],
              totalMarks: selectedExamData.candidates[0]?.totalQuestions || 0
            },
            results: selectedExamData.candidates.map(candidate => ({
              ...candidate,
              candidateName: candidate.candidateName,
              registrationNumber: candidate.registrationId,
              correctAnswers: candidate.correctAnswers,
              wrongAnswers: candidate.wrongAnswers,
              skippedQuestions: candidate.skippedQuestions,
              totalQuestions: candidate.totalQuestions,
              submitted: candidate.submitted,
              used: candidate.used
            })).sort((a, b) => b.correctAnswers - a.correctAnswers)
          };
          
          setResults(formattedResults);
          setFilteredResults(formattedResults.results);
        } else {
          setError('No results found for selected exam');
          setResults(null);
          setFilteredResults([]);
        }
      }
    } catch (err) {
      setError('An error occurred while fetching results');
      setResults(null);
      setFilteredResults([]);
      Alert.alert('Error', 'Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamResults();
  }, [selectedExam]);

  useEffect(() => {
    if (!results) return;

    const filtered = results.results.filter(result => {
      const searchLower = searchTerm.toLowerCase();
      const candidateName = result.candidateName || '';
      const registrationNumber = result.registrationNumber || '';
      
      return candidateName.toLowerCase().includes(searchLower) ||
             registrationNumber.toLowerCase().includes(searchLower);
    });
    setFilteredResults(filtered);
  }, [searchTerm, results]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllResults();
    if (selectedExam) {
      await fetchExamResults();
    }
    setRefreshing(false);
  };

  const getStatusBadge = (submitted, used) => {
    let backgroundColor, textColor, text, iconName;
    
    if (submitted) {
      backgroundColor = '#d1fae5';
      textColor = '#065f46';
      text = 'Submitted';
      iconName = 'check-circle';
    } else if (!submitted && !used) {
      backgroundColor = '#fef3c7';
      textColor = '#92400e';
      text = 'Not Attended';
      iconName = 'clock-outline';
    } else if (used && !submitted) {
      backgroundColor = '#fee2e2';
      textColor = '#991b1b';
      text = 'Network Error';
      iconName = 'wifi-off';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Icon name={iconName} size={14} color={textColor} />
        <Text style={[styles.statusText, { color: textColor }]}>{text}</Text>
      </View>
    );
  };

  const ScoreBadge = ({ value, type }) => {
    const colors = {
      correct: { bg: '#d1fae5', text: '#065f46', icon: 'check' },
      wrong: { bg: '#fee2e2', text: '#991b1b', icon: 'close' },
      skipped: { bg: '#fef3c7', text: '#92400e', icon: 'minus' },
    };

    return (
      <View style={[styles.scoreBadge, { backgroundColor: colors[type].bg }]}>
        <Icon name={colors[type].icon} size={16} color={colors[type].text} />
        <Text style={[styles.scoreText, { color: colors[type].text, marginLeft: 4 }]}>{value}</Text>
      </View>
    );
  };

  const StatCard = ({ iconName, title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={iconName} size={18} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const generateUniqueKey = (result, index) => {
    return `${result.registrationNumber}_${result.candidateName}_${index}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Exam Results Dashboard</Text>
            <Text style={styles.headerSubtitle}>View and track examination performance</Text>
          </View>
          
          {/* Exam Selector */}
          <TouchableOpacity 
            style={styles.examSelector}
            onPress={() => setShowExamDropdown(!showExamDropdown)}
          >
            <Text style={styles.examSelectorText}>
              {selectedExam || (exams.length === 0 ? 'No exams available' : 'Select an Exam')}
            </Text>
            <Icon 
              name={showExamDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#3b82f6" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Exam Dropdown */}
      {showExamDropdown && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll}>
            {exams.map((exam, index) => (
              <TouchableOpacity
                key={`${exam.examId}_${index}`}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedExam(exam.examId);
                  setShowExamDropdown(false);
                }}
              >
                <Icon name="file-document" size={18} color="#3b82f6" />
                <View style={styles.dropdownTextContainer}>
                  <Text style={styles.dropdownText}>{exam.examId}</Text>
                  <Text style={styles.dropdownSubtext}>({exam.totalCandidates} candidates)</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      {results && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Icon name="magnify" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search by name or hall ticket number..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Icon name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          {searchTerm && (
            <Text style={styles.searchResultsText}>
              Found {filteredResults.length} matching result{filteredResults.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading results...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {results && (
          <Animated.View 
            style={[
              styles.resultsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Exam Header Card */}
            <View style={styles.examHeaderCard}>
              <View style={styles.examTitleContainer}>
                <Icon name="clipboard-text" size={24} color="#3b82f6" />
                <Text style={styles.examTitle}>{results.examDetails.examName}</Text>
              </View>
              
              <View style={styles.statsGrid}>
                <StatCard
                  iconName="calendar"
                  title="Date"
                  value={results.examDetails.date}
                  color="#3b82f6"
                />
                <StatCard
                  iconName="help-circle"
                  title="Total Questions"
                  value={results.examDetails.totalMarks.toString()}
                  color="#10b981"
                />
                <StatCard
                  iconName="account-group"
                  title="Candidates"
                  value={results.results.length.toString()}
                  color="#f59e0b"
                />
              </View>
            </View>

            {/* Results List */}
            <View style={styles.resultsList}>
              {filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                  <View 
                    key={generateUniqueKey(result, index)} 
                    style={styles.resultCard}
                  >
                    {/* Rank and Basic Info */}
                    <View style={styles.resultHeader}>
                      <View style={styles.rankContainer}>
                        <Icon name="trophy" size={16} color="#ffffff" />
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateName}>{result.candidateName}</Text>
                        <View style={styles.regNumberContainer}>
                          <Icon name="identifier" size={14} color="#6b7280" />
                          <Text style={styles.registrationNumber} numberOfLines={1} ellipsizeMode="tail">
                            {result.registrationNumber}
                          </Text>
                        </View>
                      </View>
                      {getStatusBadge(result.submitted, result.used)}
                    </View>

                    {/* Scores */}
                    <View style={styles.scoresContainer}>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Correct</Text>
                        <ScoreBadge value={result.correctAnswers} type="correct" />
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Wrong</Text>
                        <ScoreBadge value={result.wrongAnswers} type="wrong" />
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Skipped</Text>
                        <ScoreBadge value={result.skippedQuestions} type="skipped" />
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Total</Text>
                        <View style={styles.totalBadge}>
                          <Icon name="format-list-numbered" size={16} color="#1f2937" />
                          <Text style={styles.totalText}>{result.totalQuestions}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="file-remove" size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>
                    No results found matching your search criteria
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Empty States */}
        {!selectedExam && !loading && exams.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="file-document-remove" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Exams Found</Text>
            <Text style={styles.emptySubtitle}>
              There are currently no exam results available in the system.
            </Text>
          </View>
        )}

        {!selectedExam && !loading && exams.length > 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="chart-bar" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Select an Exam to View Results</Text>
            <Text style={styles.emptySubtitle}>
              Choose an exam from the dropdown menu above to see detailed results.
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 20,
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 20,
  },
  examSelector: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  examSelectorText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: height * 0.22,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownScroll: {
    borderRadius: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  dropdownSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
    marginRight: 8,
  },
  searchResultsText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  resultsContainer: {
    padding: 20,
  },
  examHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  examTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 10,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  resultsList: {
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankContainer: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexDirection: 'row',
  },
  rankText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  regNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  registrationNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    numberOfLines: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 9,
    marginBottom:8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 50,
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 50,
    justifyContent: 'center',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExamResults;