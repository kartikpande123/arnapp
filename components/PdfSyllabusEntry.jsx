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

const PdfSyllabusEntry = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [activeSyllabuses, setActiveSyllabuses] = useState([]);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [allPdfSyllabuses, setAllPdfSyllabuses] = useState([]);
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
      
      if (!responseData.success || !responseData.purchasers) {
        return false;
      }
      
      const superUser = responseData.purchasers.find(user => user.userId === userId);
      
      if (!superUser) {
        return false;
      }
      
      // Check if any purchase is not expired
      const currentDate = new Date();
      const hasActivePurchase = Object.values(superUser.purchases || {}).some(purchase => {
        const expiryDate = new Date(purchase.expiryDate);
        return expiryDate > currentDate && purchase.isActive;
      });
      
      return hasActivePurchase;
    } catch (error) {
      console.error('Error checking super user:', error);
      return false;
    }
  };

  // Fetch all PDF syllabuses from pdf-syllabi collection
  const fetchAllPdfSyllabiFromCollection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pdf-syllabi`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF syllabi');
      }
      
      const syllabi = await response.json();
      const allSyllabuses = [];
      
      // Structure: { "Category": { "Title": {...data} } }
      Object.entries(syllabi).forEach(([categoryKey, pdfsInCategory]) => {
        if (pdfsInCategory && typeof pdfsInCategory === 'object') {
          Object.entries(pdfsInCategory).forEach(([pdfKey, pdfData]) => {
            if (pdfData && typeof pdfData === 'object' && pdfData.fileUrl) {
              allSyllabuses.push({
                syllabusTitle: pdfData.title || pdfKey,
                syllabusCategory: pdfData.category || categoryKey,
                syllabusDescription: pdfData.description || '',
                syllabusFileUrl: pdfData.fileUrl,
                paymentAmount: pdfData.fees || 0,
                duration: pdfData.duration || 'N/A',
                thumbnailUrl: pdfData.imageUrl || '',
                createdAt: pdfData.createdAt || null,
                isFromCollection: true
              });
            }
          });
        }
      });
      
      return allSyllabuses;
    } catch (error) {
      console.error('Error fetching PDF syllabi from collection:', error);
      return [];
    }
  };

  // Fetch all PDF syllabuses for super user
  const fetchAllPdfSyllabuses = async () => {
    try {
      const collectionSyllabuses = await fetchAllPdfSyllabiFromCollection();
      
      collectionSyllabuses.sort((a, b) => 
        (a.syllabusTitle || '').localeCompare(b.syllabusTitle || '')
      );
      
      return collectionSyllabuses;
    } catch (error) {
      console.error('Error fetching all PDF syllabuses:', error);
      return [];
    }
  };

  // Calculate remaining days
  const calculateRemainingDays = (expirationDateString) => {
    try {
      const expirationDate = new Date(expirationDateString);
      const currentDate = new Date();
      
      expirationDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      const timeDiff = expirationDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysDiff > 0 ? daysDiff : 0;
    } catch (e) {
      return 0;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      return `${month} ${day}, ${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Verify student
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
    setAllPdfSyllabuses([]);
    setActiveSyllabuses([]);
    setSearchCategory('');
    setSearchText('');
    
    try {
      // Check if user is a super user
      const isSuperUserCheck = await checkSuperUser(trimmedId);
      
      if (isSuperUserCheck) {
        setIsSuperUser(true);
        
        // Fetch super user details
        const superUserResponse = await fetch(`${API_BASE_URL}/api/super-user-all`);
        const superUserData = await superUserResponse.json();
        const superUser = superUserData.purchasers.find(user => user.userId === trimmedId);
        
        if (superUser && superUser.userDetails) {
          setStudentDetails({
            name: superUser.userDetails.name,
            email: superUser.userDetails.email,
            phoneNo: superUser.userDetails.phoneNo,
            age: superUser.userDetails.age,
            gender: superUser.userDetails.gender,
            state: superUser.userDetails.state,
            district: superUser.userDetails.district
          });
        }
        
        // Fetch all PDF syllabuses
        const syllabuses = await fetchAllPdfSyllabuses();
        setAllPdfSyllabuses(syllabuses);
        
        if (syllabuses.length === 0) {
          setError('No PDF syllabuses found in the system');
          Toast.show({
            type: 'info',
            text1: 'Info',
            text2: 'No PDF syllabuses found',
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Super User Access',
            text2: `${syllabuses.length} PDF syllabuses available`,
          });
        }
        
        return;
      }
      
      // Regular user flow
      const response = await fetch(`${API_BASE_URL}/api/pdfsyllabuspurchasers`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success || !responseData.data) {
        throw new Error('Invalid response format');
      }
      
      const students = responseData.data;
      
      if (!students[trimmedId]) {
        setError('Student not found');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Student not found',
        });
        setStudentDetails(null);
        setActiveSyllabuses([]);
        return;
      }
      
      const student = students[trimmedId];
      
      // Process student's purchases
      const currentDate = new Date();
      const active = [];
      
      if (student.purchases) {
        Object.values(student.purchases).forEach(purchase => {
          const expirationDate = new Date(purchase.expirationDate);
          
          if (expirationDate > currentDate) {
            const remainingDays = calculateRemainingDays(purchase.expirationDate);
            
            active.push({
              syllabusTitle: purchase.syllabusTitle,
              syllabusCategory: purchase.syllabusCategory,
              purchaseDate: purchase.purchaseDate,
              expirationDate: purchase.expirationDate,
              remainingDays: remainingDays,
              syllabusFileUrl: purchase.syllabusFileUrl
            });
          }
        });
      }
      
      setStudentDetails({
        name: student.name,
        email: student.email,
        phoneNo: student.phoneNo,
        age: student.age,
        gender: student.gender,
        state: student.state,
        district: student.district
      });
      
      setActiveSyllabuses(active);
      
      if (active.length === 0) {
        setError('No active syllabus purchases found');
        Toast.show({
          type: 'info',
          text1: 'No Active Syllabuses',
          text2: 'You don\'t have any active syllabus purchases',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Found ${active.length} active syllabus${active.length > 1 ? 'es' : ''}`,
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred. Please try again.',
      });
      console.error(err);
      setStudentDetails(null);
      setActiveSyllabuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSyllabus = async (syllabus) => {
    try {
      // Save syllabus data to AsyncStorage
      await AsyncStorage.setItem('selectedPdfSyllabus', JSON.stringify({
        syllabus,
        studentName: studentDetails?.name,
        studentId: studentId
      }));
      
      // Navigate to PDF viewer screen
      navigation.navigate('SecurePdfViewer', {
        syllabus,
        studentName: studentDetails?.name
      });
    } catch (error) {
      console.error('Error opening syllabus:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open PDF. Please try again.',
      });
    }
  };

  const getCategories = (syllabuses) => {
    const categories = [...new Set(syllabuses.map(syllabus => syllabus.syllabusCategory))];
    return categories.filter(cat => cat).sort();
  };

  const getFilteredSyllabuses = () => {
    let syllabusesToFilter = isSuperUser ? allPdfSyllabuses : activeSyllabuses;
    
    if (!syllabusesToFilter || syllabusesToFilter.length === 0) {
      return [];
    }

    return syllabusesToFilter.filter(syllabus => {
      if (searchCategory && syllabus.syllabusCategory !== searchCategory) {
        return false;
      }
      
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const titleMatch = syllabus.syllabusTitle?.toLowerCase().includes(searchLower);
        return titleMatch;
      }
      
      return true;
    });
  };

  const groupSyllabusesByCategory = (syllabuses) => {
    return syllabuses.reduce((acc, syllabus) => {
      const category = syllabus.syllabusCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(syllabus);
      return acc;
    }, {});
  };

  const filteredSyllabuses = getFilteredSyllabuses();
  const groupedSyllabuses = groupSyllabusesByCategory(filteredSyllabuses);
  const availableCategories = isSuperUser 
    ? getCategories(allPdfSyllabuses) 
    : getCategories(activeSyllabuses);

  const clearFilters = () => {
    setSearchCategory('');
    setSearchText('');
    Toast.show({
      type: 'info',
      text1: 'Filters Cleared',
      text2: 'Showing all syllabuses',
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
        colors={isSuperUser ? ["#D4AF37", "#B8860B"] : ['#3498db', '#2c3e50']}
        style={styles.header}
      >
        <Icon name={isSuperUser ? "crown" : "file-pdf-box"} size={32} color="#fff" />
        <Text style={styles.headerTitle}>
          {isSuperUser ? 'Super User Access' : 'My Syllabus Portal'}
        </Text>
        {isSuperUser && (
          <Text style={styles.headerSubtitle}>All PDF Syllabuses Available</Text>
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
                  <Text style={styles.buttonText}>Verify & Find My PDF Syllabuses</Text>
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
                👑 You have access to all PDF syllabuses in the system
              </Text>
            )}
            {studentDetails.email ? (
              <Text style={styles.detailText}>📧 {studentDetails.email}</Text>
            ) : null}
          </View>
        )}

        {/* Search Filters */}
        {studentDetails && ((isSuperUser && allPdfSyllabuses.length > 0) || (!isSuperUser && activeSyllabuses.length > 0)) && (
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
                  <Text style={styles.filterLabel}>Search by Syllabus Name</Text>
                  <View style={styles.searchInputContainer}>
                    <Icon name="file-search" size={18} color="#7f8c8d" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholder="Type syllabus name..."
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
                    Showing {filteredSyllabuses.length} of {isSuperUser ? allPdfSyllabuses.length : activeSyllabuses.length} syllabuses
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Syllabus Lists */}
        {(isSuperUser && allPdfSyllabuses.length > 0) || (!isSuperUser && activeSyllabuses.length > 0) ? (
          <View style={styles.syllabusListContainer}>
            {filteredSyllabuses.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="file-search-outline" size={64} color="#bdc3c7" />
                <Text style={styles.emptyStateText}>No syllabuses found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
              </View>
            ) : (
              Object.entries(groupedSyllabuses).map(([category, syllabuses]) => (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Icon name="folder" size={20} color="#3498db" />
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{syllabuses.length}</Text>
                    </View>
                  </View>

                  {syllabuses.map((syllabus, index) => (
                    <View key={index} style={styles.syllabusCard}>
                      <View style={styles.syllabusCardHeader}>
                        <Icon name="file-pdf-box" size={24} color="#e74c3c" />
                        <View style={styles.syllabusCardTitleContainer}>
                          <Text style={styles.syllabusCardTitle} numberOfLines={2}>
                            {syllabus.syllabusTitle}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.syllabusDetails}>
                        <View style={styles.syllabusDetailRow}>
                          <Icon name="tag" size={16} color="#7f8c8d" />
                          <Text style={styles.syllabusDetailText}>
                            Category: {syllabus.syllabusCategory}
                          </Text>
                        </View>
                        
                        {isSuperUser ? (
                          <>
                            {syllabus.syllabusDescription && (
                              <View style={styles.syllabusDetailRow}>
                                <Icon name="text" size={16} color="#7f8c8d" />
                                <Text style={styles.syllabusDetailText} numberOfLines={2}>
                                  {syllabus.syllabusDescription}
                                </Text>
                              </View>
                            )}
                            {syllabus.duration && (
                              <View style={styles.syllabusDetailRow}>
                                <Icon name="clock-outline" size={16} color="#7f8c8d" />
                                <Text style={styles.syllabusDetailText}>
                                  Duration: {syllabus.duration}
                                </Text>
                              </View>
                            )}
                            {syllabus.paymentAmount > 0 && (
                              <View style={styles.syllabusDetailRow}>
                                <Icon name="currency-inr" size={16} color="#7f8c8d" />
                                <Text style={styles.syllabusDetailText}>
                                  Fees: ₹{syllabus.paymentAmount}
                                </Text>
                              </View>
                            )}
                          </>
                        ) : (
                          <>
                            <View style={styles.syllabusDetailRow}>
                              <Icon name="calendar-check" size={16} color="#7f8c8d" />
                              <Text style={styles.syllabusDetailText}>
                                Purchased: {formatDate(syllabus.purchaseDate)}
                              </Text>
                            </View>
                            <View style={styles.syllabusDetailRow}>
                              <Icon name="calendar-remove" size={16} color="#7f8c8d" />
                              <Text style={styles.syllabusDetailText}>
                                Expires: {formatDate(syllabus.expirationDate)}
                              </Text>
                            </View>
                            <View style={[
                              styles.remainingDaysBadge,
                              syllabus.remainingDays <= 1 ? styles.remainingDaysCritical :
                              syllabus.remainingDays <= 3 ? styles.remainingDaysWarning :
                              styles.remainingDaysSuccess
                            ]}>
                              <Icon name="clock-alert" size={16} color="#fff" />
                              <Text style={styles.remainingDaysText}>
                                {syllabus.remainingDays} {syllabus.remainingDays === 1 ? 'day' : 'days'} remaining
                              </Text>
                            </View>
                          </>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => handleOpenSyllabus(syllabus)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#3498db', '#2980b9']}
                          style={styles.viewButtonGradient}
                        >
                          <Icon name="eye" size={20} color="#fff" />
                          <Text style={styles.viewButtonText}>
                            {isSuperUser ? 'View PDF' : 'View Securely'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        ) : null}

        {studentDetails && !isSuperUser && activeSyllabuses.length === 0 && (
          <View style={styles.card}>
            <View style={styles.warningContainer}>
              <Icon name="alert" size={48} color="#f39c12" />
              <Text style={styles.warningTitle}>No Active Syllabuses</Text>
              <Text style={styles.warningText}>
                You don't have any active syllabuses. All your purchased syllabuses have expired or you haven't purchased any yet.
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
    paddingTop: 50,
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
    borderLeftColor: '#D4AF37',
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
  syllabusListContainer: {
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
  syllabusCard: {
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
    borderLeftColor: '#e74c3c',
  },
  syllabusCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  syllabusCardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  syllabusCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 22,
  },
  syllabusDetails: {
    marginBottom: 16,
  },
  syllabusDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  syllabusDetailText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
    flex: 1,
  },
  remainingDaysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  remainingDaysSuccess: {
    backgroundColor: '#27ae60',
  },
  remainingDaysWarning: {
    backgroundColor: '#f39c12',
  },
  remainingDaysCritical: {
    backgroundColor: '#e74c3c',
  },
  remainingDaysText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewButtonText: {
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

export default PdfSyllabusEntry;