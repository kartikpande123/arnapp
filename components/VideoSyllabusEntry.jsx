import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const VideoSyllabusEntry = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [activeSyllabuses, setActiveSyllabuses] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [allVideoSyllabuses, setAllVideoSyllabuses] = useState([]);
  const [searchCategory, setSearchCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const videoRef = useRef(null);

  // Calculate expiration date from purchase date and duration
  const calculateExpirationDate = (purchaseDate, duration) => {
    const match = duration.match(/(\d+)\s*(day|days|month|months|year|years)/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const date = new Date(purchaseDate);
    
    if (unit.startsWith('day')) {
      date.setDate(date.getDate() + value);
    } else if (unit.startsWith('month')) {
      date.setMonth(date.getMonth() + value);
    } else if (unit.startsWith('year')) {
      date.setFullYear(date.getFullYear() + value);
    }

    return date;
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

  // Fetch all video syllabuses from video-syllabi collection
  const fetchAllVideoSyllabiFromCollection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/video-syllabi`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video syllabi');
      }
      
      const syllabi = await response.json();
      const allSyllabuses = [];
      
      // Structure: { "Maths": { "chap-1": {...data} }, "fun": { "fun-1": {...data} } }
      Object.entries(syllabi).forEach(([categoryKey, videosInCategory]) => {
        // Check if videosInCategory is an object with video entries
        if (videosInCategory && typeof videosInCategory === 'object') {
          Object.entries(videosInCategory).forEach(([videoKey, videoData]) => {
            // Only process if videoData has fileUrl (it's an actual video)
            if (videoData && typeof videoData === 'object' && videoData.fileUrl) {
              allSyllabuses.push({
                id: videoKey,
                syllabusTitle: videoData.title || videoKey,
                syllabusCategory: videoData.category || categoryKey,
                syllabusDescription: videoData.description || '',
                syllabusFileUrl: videoData.fileUrl,
                thumbnailUrl: videoData.imageUrl || '',
                paymentAmount: videoData.fees || 0,
                duration: videoData.duration || 'N/A',
                createdAt: videoData.createdAt || null,
                isFromCollection: true
              });
            }
          });
        }
      });
      
      return allSyllabuses;
    } catch (error) {
      console.error('Error fetching video syllabi from collection:', error);
      return [];
    }
  };

  // Match thumbnail for a purchase by video title
  const matchThumbnailForPurchase = (purchase, allVideos) => {
    if (!purchase || !allVideos || allVideos.length === 0) {
      return null;
    }

    // Try to find matching video by title (case-insensitive)
    const purchaseTitle = (purchase.syllabusTitle || '').trim().toLowerCase();
    
    const matchedVideo = allVideos.find(video => {
      const videoTitle = (video.syllabusTitle || '').trim().toLowerCase();
      return videoTitle === purchaseTitle;
    });

    return matchedVideo?.thumbnailUrl || null;
  };

  // Fetch all video syllabuses for super user
  const fetchAllVideoSyllabuses = async () => {
    try {
      const collectionSyllabuses = await fetchAllVideoSyllabiFromCollection();
      
      collectionSyllabuses.sort((a, b) => 
        (a.syllabusTitle || '').localeCompare(b.syllabusTitle || '')
      );
      
      return collectionSyllabuses;
    } catch (error) {
      console.error('Error fetching all video syllabuses:', error);
      return [];
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
    setAllVideoSyllabuses([]);
    setSearchCategory('');
    setSearchText('');
    
    try {
      // First check if user is a super user
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
        
        // Fetch all video syllabuses
        const syllabuses = await fetchAllVideoSyllabuses();
        setAllVideoSyllabuses(syllabuses);
        
        if (syllabuses.length === 0) {
          setError('No video syllabuses found in the system');
          Toast.show({
            type: 'info',
            text1: 'Info',
            text2: 'No video syllabuses found',
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Super User Access',
            text2: `${syllabuses.length} video syllabuses available`,
          });
        }
        
        return;
      }
      
      // Regular user flow
      const response = await fetch(`${API_BASE_URL}/api/videosyllabuspurchasers`);
      
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
      
      // Fetch all videos to match thumbnails
      const allVideosForMatching = await fetchAllVideoSyllabiFromCollection();
      
      const currentDate = new Date();
      const active = [];
      
      if (student.purchases) {
        Object.values(student.purchases).forEach(purchase => {
          const expirationDate = calculateExpirationDate(
            purchase.purchaseDate, 
            purchase.syllabusDuration
          );
          
          if (expirationDate && expirationDate > currentDate) {
            const remainingDays = calculateRemainingDays(expirationDate);
            
            // Match thumbnail from video-syllabi collection
            const matchedThumbnail = matchThumbnailForPurchase(purchase, allVideosForMatching);
            
            active.push({
              id: purchase.syllabusTitle,
              syllabusTitle: purchase.syllabusTitle,
              syllabusCategory: purchase.syllabusCategory,
              syllabusDescription: purchase.syllabusDescription,
              purchaseDate: purchase.purchaseDate,
              syllabusDuration: purchase.syllabusDuration,
              expirationDate: expirationDate.toISOString(),
              remainingDays: remainingDays,
              syllabusFileUrl: purchase.syllabusFileUrl,
              thumbnailUrl: matchedThumbnail, // Add matched thumbnail
              paymentAmount: purchase.paymentAmount
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
        setError('No active video syllabus purchases found');
        Toast.show({
          type: 'info',
          text1: 'No Active Videos',
          text2: 'You don\'t have any active video purchases',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Found ${active.length} active video${active.length > 1 ? 's' : ''}`,
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

  // Handle video click
  const handleVideoClick = (syllabus) => {
    setSelectedVideo(syllabus);
    setVideoPaused(true);
    setShowVideoModal(true);
    
    setTimeout(() => {
      setVideoPaused(false);
    }, 300);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setVideoPaused(true);
    setShowVideoModal(false);
    
    setTimeout(() => {
      setSelectedVideo(null);
    }, 300);
  };

  const getCategories = (syllabuses) => {
    const categories = [...new Set(syllabuses.map(syllabus => syllabus.syllabusCategory))];
    return categories.filter(cat => cat).sort();
  };

  const getFilteredSyllabuses = () => {
    let syllabusesToFilter = isSuperUser ? allVideoSyllabuses : activeSyllabuses;
    
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
        const descMatch = syllabus.syllabusDescription?.toLowerCase().includes(searchLower);
        return titleMatch || descMatch;
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

  // Get icon for category
  const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    
    if (categoryLower.includes('science') || categoryLower.includes('chemistry') || categoryLower.includes('physics') || categoryLower.includes('biology')) {
      return 'flask';
    } else if (categoryLower.includes('math') || categoryLower.includes('algebra') || categoryLower.includes('geometry')) {
      return 'calculator';
    } else if (categoryLower.includes('english') || categoryLower.includes('language')) {
      return 'book-alphabet';
    } else if (categoryLower.includes('history') || categoryLower.includes('social')) {
      return 'book-open-variant';
    } else if (categoryLower.includes('computer') || categoryLower.includes('coding') || categoryLower.includes('programming')) {
      return 'laptop';
    } else if (categoryLower.includes('fun') || categoryLower.includes('entertainment')) {
      return 'party-popper';
    } else if (categoryLower.includes('art') || categoryLower.includes('drawing')) {
      return 'palette';
    } else if (categoryLower.includes('music')) {
      return 'music';
    } else if (categoryLower.includes('sports') || categoryLower.includes('physical')) {
      return 'basketball';
    } else {
      return 'folder-video';
    }
  };

  const filteredSyllabuses = getFilteredSyllabuses();
  const groupedSyllabuses = groupSyllabusesByCategory(filteredSyllabuses);
  const availableCategories = isSuperUser 
    ? getCategories(allVideoSyllabuses) 
    : getCategories(activeSyllabuses);

  const clearFilters = () => {
    setSearchCategory('');
    setSearchText('');
    Toast.show({
      type: 'info',
      text1: 'Filters Cleared',
      text2: 'Showing all videos',
    });
  };

  // Render video card with thumbnail
  const renderVideoCard = (syllabus) => {
    const thumbnailUrl = syllabus.thumbnailUrl || syllabus.imageUrl;
    
    return (
      <TouchableOpacity
        key={syllabus.id}
        style={styles.videoCard}
        onPress={() => handleVideoClick(syllabus)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailContainer}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={(e) => {
                console.log('Image load error:', e.nativeEvent.error);
              }}
            />
          ) : (
            <View style={styles.noThumbnail}>
              <Icon name="video" size={40} color="#ffffff" />
            </View>
          )}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Icon name="play" size={32} color="#fff" />
            </View>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>Video</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {syllabus.syllabusTitle}
          </Text>
          <View style={styles.videoMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{syllabus.syllabusCategory}</Text>
            </View>
            {!isSuperUser && syllabus.remainingDays !== undefined && (
              <View style={[
                styles.remainingDaysBadge,
                syllabus.remainingDays <= 1 ? styles.remainingDaysCritical :
                syllabus.remainingDays <= 3 ? styles.remainingDaysWarning :
                styles.remainingDaysSuccess
              ]}>
                <Text style={styles.remainingDaysText}>
                  {syllabus.remainingDays}d
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
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
        <Icon name={isSuperUser ? "crown" : "video"} size={32} color="#fff" />
        <Text style={styles.headerTitle}>
          {isSuperUser ? 'Super User Access' : 'My Video Portal'}
        </Text>
        {isSuperUser && (
          <Text style={styles.headerSubtitle}>All Video Syllabuses Available</Text>
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
                  <Text style={styles.buttonText}>Verify & Find My Videos</Text>
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
                👑 You have access to all videos in the system
              </Text>
            )}
            {studentDetails.email ? (
              <Text style={styles.detailText}>📧 {studentDetails.email}</Text>
            ) : null}
          </View>
        )}

        {/* Search Filters */}
        {studentDetails && ((isSuperUser && allVideoSyllabuses.length > 0) || (!isSuperUser && activeSyllabuses.length > 0)) && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
              activeOpacity={0.7}
            >
              <View style={styles.filterHeader}>
                <Icon name="magnify" size={24} color="#3498db" />
                <Text style={styles.filterTitle}>Search & Filter Videos</Text>
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
                  <Text style={styles.filterLabel}>Search by Video Name</Text>
                  <View style={styles.searchInputContainer}>
                    <Icon name="video-search" size={18} color="#7f8c8d" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholder="Type video name or description..."
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
                    Showing {filteredSyllabuses.length} of {isSuperUser ? allVideoSyllabuses.length : activeSyllabuses.length} videos
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Video Lists */}
        {(isSuperUser && allVideoSyllabuses.length > 0) || (!isSuperUser && activeSyllabuses.length > 0) ? (
          <View style={styles.videoListContainer}>
            {filteredSyllabuses.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="video-off" size={64} color="#bdc3c7" />
                <Text style={styles.emptyStateText}>No videos found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
              </View>
            ) : (
              Object.entries(groupedSyllabuses).map(([category, syllabuses]) => (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Icon name={getCategoryIcon(category)} size={20} color="#3498db" />
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{syllabuses.length}</Text>
                    </View>
                  </View>

                  <View style={styles.videosGrid}>
                    {syllabuses.map(renderVideoCard)}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {studentDetails && !isSuperUser && activeSyllabuses.length === 0 && (
          <View style={styles.card}>
            <View style={styles.warningContainer}>
              <Icon name="video-off" size={48} color="#f39c12" />
              <Text style={styles.warningTitle}>No Active Videos</Text>
              <Text style={styles.warningText}>
                You don't have any active video purchases. All your purchased videos have expired or you haven't purchased any yet.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Icon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedVideo?.syllabusTitle}
              </Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.videoContainer}>
              {selectedVideo && (
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.syllabusFileUrl }}
                  style={styles.videoPlayer}
                  controls={true}
                  paused={videoPaused}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error("Video error:", error);
                    Toast.show({
                      type: "error",
                      text1: "Video playback error",
                      position: "top",
                      visibilityTime: 3000,
                    });
                  }}
                  onLoad={() => {
                    console.log("Video loaded successfully");
                  }}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

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
  videoListContainer: {
    marginTop: 8,
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
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryCountBadge: {
    backgroundColor: '#2c3e50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  videoCard: {
    width: screenWidth - 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  noThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a3b5d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingDaysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 10,
    fontWeight: '600',
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
  // Video Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    paddingTop: 50, // Added this line
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: screenWidth,
    height: screenHeight - 150,
  },
});

export default VideoSyllabusEntry;