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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const PracticeExamEntry = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [error, setError] = useState('');
  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [allPracticeTests, setAllPracticeTests] = useState([]);
  const [searchCategory, setSearchCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is a super user
  const checkSuperUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/super-user-all`);
      
      if (!response.ok) {
        return false;
      }
      
      const responseData = await response.json();
      
      if (!responseData.success || !responseData.purchasers || !Array.isArray(responseData.purchasers)) {
        return false;
      }
      
      const superUser = responseData.purchasers.find(user => user.userId === userId);
      
      if (!superUser) {
        return false;
      }
      
      if (superUser.hasActiveSubscription) {
        const currentDate = new Date();
        const latestExpiry = new Date(superUser.latestExpiry);
        return latestExpiry > currentDate;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking super user:', error);
      return false;
    }
  };

  // Fetch all practice tests for super user
  const fetchAllPracticeTests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/super-user-practice-tests`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch practice tests');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.practiceTests) {
        return [];
      }
      
      const sortedTests = data.practiceTests.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });
      
      return sortedTests;
    } catch (error) {
      console.error('Error fetching all practice tests:', error);
      return [];
    }
  };

  const verifyStudent = async () => {
    const trimmedId = studentId.trim();
    
    if (!trimmedId) {
      setError('Please enter a Student ID');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a Student ID',
      });
      return;
    }

    setLoading(true);
    setError('');
    setIsSuperUser(false);
    setAllPracticeTests([]);
    setActiveExams([]);
    setSearchCategory('');
    setSearchText('');

    try {
      const isSuperUserCheck = await checkSuperUser(trimmedId);
      
      if (isSuperUserCheck) {
        setIsSuperUser(true);
        
        const superUserResponse = await fetch(`${API_BASE_URL}/api/super-user-all`);
        const superUserData = await superUserResponse.json();
        
        const superUser = superUserData[trimmedId];
        
        if (superUser && superUser.userDetails) {
          setStudentDetails({
            name: superUser.userDetails.name || 'Super User',
            email: superUser.userDetails.email || '',
            phoneNo: superUser.userDetails.phoneNo || ''
          });
        } else {
          setStudentDetails({
            name: 'Super User',
            email: '',
            phoneNo: ''
          });
        }
        
        const tests = await fetchAllPracticeTests();
        setAllPracticeTests(tests);
        
        if (tests.length === 0) {
          setError('No practice tests found in the system');
          Toast.show({
            type: 'info',
            text1: 'Info',
            text2: 'No practice tests found in the system',
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Super User Access',
            text2: `Welcome! ${tests.length} tests available`,
          });
        }
        
        return;
      }

      const studentResponse = await fetch(`${API_BASE_URL}/api/verify-student/${trimmedId}`);
      const studentData = await studentResponse.json();

      if (!studentData.exists) {
        setError('Student not found');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Student not found',
        });
        return;
      }

      setStudentDetails(studentData.studentDetails);

      const currentDate = new Date();
      const activeExamList = studentData.studentDetails.purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate);
        const examDuration = purchase.examDetails.duration.includes('days') 
          ? parseInt(purchase.examDetails.duration) 
          : 1;
        const expirationDate = new Date(purchaseDate);
        expirationDate.setDate(expirationDate.getDate() + examDuration);

        return currentDate <= expirationDate;
      });

      if (activeExamList.length === 0) {
        setError('No active exam purchase found');
        Toast.show({
          type: 'error',
          text1: 'No Active Exams',
          text2: 'You don\'t have any active exam purchases',
        });
        return;
      }

      setActiveExams(activeExamList);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Found ${activeExamList.length} active exam${activeExamList.length > 1 ? 's' : ''}`,
      });

    } catch (err) {
      setError('An error occurred. Please try again.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred. Please try again.',
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (exam, isSuperUserExam = false) => {
    try {
      if (isSuperUserExam) {
        // For super user accessing from all tests list
        const examSessionData = {
          studentId: studentId,
          examDetails: {
            title: exam.title,
            category: exam.category,
            duration: exam.duration || 'N/A',
            timeLimit: exam.timeLimit || 'N/A',
            createdAt: exam.createdAt || Date.now()
          },
          isSuperUser: true
        };

        // Save to AsyncStorage
        await AsyncStorage.setItem('practiceExamSession', JSON.stringify(examSessionData));
        
        // Navigate to exam screen
        navigation.navigate('PracticeMainExam', { 
          studentId, 
          examDetails: {
            title: exam.title,
            category: exam.category,
            duration: exam.duration || 'N/A',
            timeLimit: exam.timeLimit || 'N/A',
            createdAt: exam.createdAt || Date.now()
          },
          isSuperUser: true
        });
      } else {
        // Regular user flow
        const examSessionData = {
          studentId: studentId,
          examDetails: {
            title: exam.examDetails.title,
            category: exam.examDetails.category,
            duration: exam.examDetails.duration,
            timeLimit: exam.examDetails.timeLimit,
            createdAt: exam.examDetails.createdAt
          },
          purchaseDate: exam.purchaseDate
        };

        // Save to AsyncStorage
        await AsyncStorage.setItem('practiceExamSession', JSON.stringify(examSessionData));
        
        navigation.navigate('PracticeMainExam', { 
          studentId, 
          examDetails: exam.examDetails 
        });
      }
    } catch (error) {
      console.error('Error saving exam session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start exam. Please try again.',
      });
    }
  };

  const getCategories = (tests) => {
    const categories = [...new Set(tests.map(test => test.category || test.examDetails?.category))];
    return categories.filter(cat => cat).sort();
  };

  const getFilteredTests = () => {
    let testsToFilter = isSuperUser ? allPracticeTests : activeExams;
    
    if (!testsToFilter || testsToFilter.length === 0) {
      return [];
    }

    return testsToFilter.filter(test => {
      const testCategory = isSuperUser ? test.category : test.examDetails?.category;
      const testTitle = isSuperUser ? test.title : test.examDetails?.title;
      
      if (searchCategory && testCategory !== searchCategory) {
        return false;
      }
      
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const titleMatch = testTitle?.toLowerCase().includes(searchLower);
        return titleMatch;
      }
      
      return true;
    });
  };

  const groupTestsByCategory = (tests) => {
    return tests.reduce((acc, test) => {
      const category = isSuperUser ? test.category : test.examDetails?.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(test);
      return acc;
    }, {});
  };

  const filteredTests = getFilteredTests();
  const groupedTests = groupTestsByCategory(filteredTests);
  const availableCategories = isSuperUser 
    ? getCategories(allPracticeTests) 
    : getCategories(activeExams);

  const clearFilters = () => {
    setSearchCategory('');
    setSearchText('');
    Toast.show({
      type: 'info',
      text1: 'Filters Cleared',
      text2: 'Showing all tests',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={isSuperUser ? "#D4AF37" : "#2c3e50"}  
      />
      
      {/* Header */}
      <LinearGradient
        colors={isSuperUser ? ['#D4AF37', '#B8860B'] : ['#3498db', '#2c3e50']}
        style={styles.header}
      >
        <Icon name={isSuperUser ? "crown" : "shield-check"} size={32} color="#fff" />
        <Text style={styles.headerTitle}>
          {isSuperUser ? 'Super User Access' : 'Practice Exam Portal'}
        </Text>
        {isSuperUser && (
          <Text style={styles.headerSubtitle}>All Practice Tests Available</Text>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Student ID Input Card */}
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Icon name="account-circle" size={24} color="#3498db" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={(text) => {
                setStudentId(text.replace(/\s/g, ''));
                setError('');
              }}
              placeholder="Enter your Student ID"
              placeholderTextColor="#95a5a6"
              editable={!loading}
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={verifyStudent}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#3498db', '#2980b9']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.buttonText}>Verifying...</Text>
                </>
              ) : (
                <>
                  <Icon name="magnify" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Verify & Find Exam</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Student Details */}
        {studentDetails && (
          <View style={[styles.card, isSuperUser ? styles.superUserCard : styles.successCard]}>
            <View style={styles.welcomeHeader}>
              <Icon 
                name={isSuperUser ? "crown" : "check-circle"} 
                size={28} 
                color={isSuperUser ? "#D4AF37" : "#27ae60"}  
              />
              <Text style={styles.welcomeText}>Welcome, {studentDetails.name}!</Text>
            </View>
            {isSuperUser && (
              <Text style={styles.superUserNote}>
                👑 You have access to all practice tests in the system
              </Text>
            )}
            {studentDetails.email ? (
              <Text style={styles.detailText}>📧 {studentDetails.email}</Text>
            ) : null}
          </View>
        )}

        {/* Search Filters */}
        {studentDetails && ((isSuperUser && allPracticeTests.length > 0) || (!isSuperUser && activeExams.length > 0)) && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
              activeOpacity={0.7}
            >
              <View style={styles.filterHeader}>
                <Icon name="magnify" size={24} color="#3498db" />
                <Text style={styles.filterTitle}>Search & Filter</Text>
              </View>
              <Icon 
                name={showFilters ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#7f8c8d" 
              />
            </TouchableOpacity>

            {showFilters && (
              <View style={styles.filterContent}>
                {/* Category Picker */}
                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Category</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    <TouchableOpacity
                      style={[styles.categoryChip, !searchCategory && styles.categoryChipActive]}
                      onPress={() => setSearchCategory('')}
                    >
                      <Text style={[styles.categoryChipText, !searchCategory && styles.categoryChipTextActive]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {availableCategories.map((category, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.categoryChip, searchCategory === category && styles.categoryChipActive]}
                        onPress={() => setSearchCategory(category)}
                      >
                        <Text style={[styles.categoryChipText, searchCategory === category && styles.categoryChipTextActive]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Search Input */}
                <View style={styles.filterItem}>
                  <Text style={styles.filterLabel}>Search by Name</Text>
                  <View style={styles.searchInputContainer}>
                    <Icon name="file-search" size={18} color="#7f8c8d" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholder="Type test name..."
                      placeholderTextColor="#95a5a6"
                    />
                    {searchText ? (
                      <TouchableOpacity onPress={() => setSearchText('')}>
                        <Icon name="close-circle" size={20} color="#95a5a6" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Clear Button */}
                {(searchCategory || searchText) && (
                  <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                    <Icon name="filter-off" size={18} color="#e74c3c" />
                    <Text style={styles.clearButtonText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}

                {/* Result Count */}
                {(searchCategory || searchText) && (
                  <Text style={styles.resultCount}>
                    Showing {filteredTests.length} of {isSuperUser ? allPracticeTests.length : activeExams.length} tests
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Exam Lists */}
        {(isSuperUser && allPracticeTests.length > 0) || (!isSuperUser && activeExams.length > 0) ? (
          <View style={styles.examListContainer}>
            {filteredTests.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="file-search-outline" size={64} color="#bdc3c7" />
                <Text style={styles.emptyStateText}>No tests found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
              </View>
            ) : (
              Object.entries(groupedTests).map(([category, tests]) => (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Icon name="folder" size={20} color="#3498db" />
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{tests.length}</Text>
                    </View>
                  </View>

                  {tests.map((test, index) => {
                    const isSuper = isSuperUser;
                    const title = isSuper ? test.title : test.examDetails.title;
                    const duration = isSuper ? test.duration : test.examDetails.duration;
                    const timeLimit = isSuper ? test.timeLimit : test.examDetails.timeLimit;
                    const fees = isSuper ? test.fees : null;

                    return (
                      <View key={index} style={styles.examCard}>
                        <View style={styles.examCardHeader}>
                          <Icon name="file-document" size={24} color="#3498db" />
                          <View style={styles.examCardTitleContainer}>
                            <Text style={styles.examCardTitle} numberOfLines={2}>{title}</Text>
                          </View>
                        </View>

                        <View style={styles.examDetails}>
                          <View style={styles.examDetailRow}>
                            <Icon name="clock-outline" size={16} color="#7f8c8d" />
                            <Text style={styles.examDetailText}>Duration: {duration || 'N/A'}</Text>
                          </View>
                          <View style={styles.examDetailRow}>
                            <Icon name="timer" size={16} color="#7f8c8d" />
                            <Text style={styles.examDetailText}>Time Limit: {timeLimit || 'N/A'}</Text>
                          </View>
                          {fees > 0 && (
                            <View style={styles.examDetailRow}>
                              <Icon name="currency-inr" size={16} color="#7f8c8d" />
                              <Text style={styles.examDetailText}>Fees: ₹{fees}</Text>
                            </View>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.startButton}
                          onPress={() => handleStartExam(test, isSuper)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#27ae60', '#229954']}
                            style={styles.startButtonGradient}
                          >
                            <Icon name="play-circle" size={20} color="#fff" />
                            <Text style={styles.startButtonText}>Start Exam</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        ) : null}

        {studentDetails && !isSuperUser && activeExams.length === 0 && (
          <View style={styles.card}>
            <View style={styles.warningContainer}>
              <Icon name="alert" size={48} color="#f39c12" />
              <Text style={styles.warningTitle}>No Active Exams</Text>
              <Text style={styles.warningText}>
                You don't have any active practice exams. All your purchased exams have expired or you haven't purchased any yet.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop:50
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ecf0f1',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#d5f4e6',
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  superUserCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
    flex: 1,
  },
  superUserNote: {
    fontSize: 13,
    color: '#795548',
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  filterContent: {
    marginTop: 20,
  },
  filterItem: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  categoryScroll: {
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryChipText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 15,
    color: '#2c3e50',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resultCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 12,
    textAlign: 'center',
  },
  examListContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  countBadge: {
    color: '#3498db',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  examCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examCardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  examCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 22,
  },
  examDetails: {
    marginBottom: 16,
  },
  examDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  examDetailText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PracticeExamEntry;