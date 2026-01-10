import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import axios from 'axios';
import API_BASE_URL from "./ApiConfigCourse";
import CourseHeader from './CourseHeader';

// Import icons from react-native-vector-icons
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CourseDashboard = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatTime = (time24) => {
    if (!time24) return 'N/A';
    const [hours, minutes] = time24.split(':');
    let period = 'AM';
    let hours12 = parseInt(hours, 10);
    
    if (hours12 >= 12) {
      period = 'PM';
      if (hours12 > 12) {
        hours12 -= 12;
      }
    }
    if (hours12 === 0) {
      hours12 = 12;
    }
    
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/courses`),
          axios.get(`${API_BASE_URL}/categories`)
        ]);

        const sortedCourses = [...(coursesRes.data || [])].sort((a, b) => {
          const getTimestampMs = (course) => {
            if (!course.createdAt) return 0;
            if (course.createdAt._seconds) {
              return (course.createdAt._seconds * 1000) + (course.createdAt._nanoseconds / 1000000);
            }
            return 0;
          };

          const timeA = getTimestampMs(a);
          const timeB = getTimestampMs(b);
          
          return timeB - timeA;
        });

        setCourses(sortedCourses);
        setCategories(categoriesRes.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = selectedCategory === 'all' || course.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (courseId) => {
    navigation.navigate('CourseDetails', { courseId });
  };

  const getSelectedCategoryName = () => {
    if (selectedCategory === 'all') return 'All Categories';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : 'All Categories';
  };

  const renderCourseCard = ({ item: course }) => {
    const isNew = course.createdAt && 
      new Date(course.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (
      <TouchableOpacity
        style={styles.courseCard}
        activeOpacity={0.9}
        onPress={() => handleViewDetails(course.id)}
      >
        {isNew && (
          <View style={styles.newCourseBadge}>
            <Text style={styles.newCourseBadgeText}>New</Text>
          </View>
        )}
        
        <Text style={styles.courseTitle}>{course.title || 'Untitled Course'}</Text>
        
        <View style={styles.courseInfo}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={16} color="#1a3b5d" style={styles.infoIcon} />
            <Text style={styles.infoText}>Date: {formatDate(course.startDate)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={16} color="#1a3b5d" style={styles.infoIcon} />
            <Text style={styles.infoText}>Start Time: {formatTime(course.startTime)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={16} color="#1a3b5d" style={styles.infoIcon} />
            <Text style={styles.infoText}>End Time: {formatTime(course.endTime)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="currency-inr" size={16} color="#1a3b5d" style={styles.infoIcon} />
            <Text style={styles.infoText}>INR {course.fees || '0'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="calendar-alert" size={16} color="#1a3b5d" style={styles.infoIcon} />
            <Text style={styles.infoText}>Last Date: {formatDate(course.lastDateToApply)}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => handleViewDetails(course.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCategoryDropdown = () => (
    <Modal
      transparent={true}
      visible={showCategoryDropdown}
      animationType="fade"
      onRequestClose={() => setShowCategoryDropdown(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowCategoryDropdown(false)}>
        <View style={styles.dropdownOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryDropdown(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#1a3b5d" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[{ id: 'all', name: 'All Categories' }, ...categories]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedCategory === item.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCategory(item.id);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedCategory === item.id && styles.dropdownItemTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    {selectedCategory === item.id && (
                      <Icon name="check" size={20} color="#1a3b5d" />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.dropdownList}
                showsVerticalScrollIndicator={true}
                ListFooterComponent={<View style={{ height: 20 }} />}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a3b5d" barStyle="light-content" />
      
      <CourseHeader navigation={navigation} />
      
      <View style={styles.mainContainer}>
        {/* SEARCH BAR - NOW VISIBLE */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="magnify" size={24} color="#1a3b5d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* CATEGORY FILTER */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={styles.categorySelect}
            onPress={() => setShowCategoryDropdown(true)}
            activeOpacity={0.8}
          >
            <View style={styles.categorySelectContent}>
              <Icon name="filter-variant" size={20} color="#1a3b5d" style={styles.categoryIcon} />
              <Text style={styles.categorySelectText} numberOfLines={1}>
                {getSelectedCategoryName()}
              </Text>
            </View>
            <Icon name="chevron-down" size={24} color="#1a3b5d" />
          </TouchableOpacity>
        </View>

        {renderCategoryDropdown()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a3b5d" style={styles.spinner} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : filteredCourses.length === 0 ? (
          <View style={styles.noCoursesContainer}>
            <Icon name="book-open-blank-variant" size={60} color="#718096" />
            <Text style={styles.noCoursesText}>No courses found</Text>
            {searchTerm || selectedCategory !== 'all' ? (
              <Text style={styles.noCoursesSubText}>
                {searchTerm ? 'Try a different search term' : 'Try selecting a different category'}
              </Text>
            ) : (
              <Text style={styles.noCoursesSubText}>Check back later for new courses</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.coursesGrid}
            showsVerticalScrollIndicator={false}
            numColumns={Platform.OS === 'web' ? 3 : 1}
            columnWrapperStyle={Platform.OS === 'web' && styles.columnWrapper}
            ListHeaderComponent={<View style={{ height: 16 }} />}
            ListFooterComponent={<View style={{ height: 20 }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  // SEARCH CONTAINER STYLES
  searchContainer: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // CATEGORY CONTAINER STYLES
  categoryContainer: {
    marginBottom: 20,
  },
  categorySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  categorySelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categorySelectText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8fafc',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a3b5d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: height * 0.6,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#1a3b5d',
    fontWeight: '600',
  },
  coursesGrid: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
    ...(isWeb && {
      minHeight: 300,
      flex: 1,
      marginHorizontal: 8,
      maxWidth: isTablet ? (isWeb ? '32%' : '100%') : '100%',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }),
  },
  courseTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  courseInfo: {
    marginBottom: 20,
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoText: {
    fontSize: isTablet ? 15 : 14,
    color: '#4a5568',
    flex: 1,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 20,
  },
  newCourseBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  newCourseBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  viewDetailsBtn: {
    backgroundColor: '#1a3b5d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
    ...(isWeb && {
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }),
  },
  viewDetailsBtnText: {
    color: 'white',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  spinner: {
    width: 48,
    height: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noCoursesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCoursesText: {
    fontSize: 18,
    color: '#718096',
    marginTop: 20,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noCoursesSubText: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

// Add web-specific hover styles
if (isWeb) {
  const originalStyles = { ...styles };
  styles.courseCard = {
    ...originalStyles.courseCard,
    ':hover': {
      transform: [{ translateY: -8 }],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
      borderColor: '#1a3b5d',
    }
  };
  
  styles.viewDetailsBtn = {
    ...originalStyles.viewDetailsBtn,
    ':hover': {
      backgroundColor: '#2d5175',
      transform: [{ translateY: -2 }],
      shadowColor: '#1a3b5d',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    }
  };

  styles.categorySelect = {
    ...originalStyles.categorySelect,
    ':hover': {
      borderColor: '#1a3b5d',
    }
  };

  styles.searchBox = {
    ...originalStyles.searchBox,
    ':focus-within': {
      borderColor: '#1a3b5d',
    }
  };
}

export default CourseDashboard;