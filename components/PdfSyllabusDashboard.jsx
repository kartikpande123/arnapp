import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const PdfSyllabusDashboard = ({ navigation }) => {
  const [syllabi, setSyllabi] = useState({});
  const [filteredSyllabi, setFilteredSyllabi] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/pdf-syllabi`);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF syllabi');
      }

      const data = await response.json();
      setSyllabi(data);

      const allSyllabi = Object.entries(data).flatMap(([category, items]) =>
        Object.entries(items).map(([title, item]) => ({
          ...item,
          category,
          title
        }))
      ).sort((a, b) => b.createdAt - a.createdAt);

      setFilteredSyllabi(allSyllabi);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching PDF syllabi:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSyllabi();
    setRefreshing(false);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);

    const filtered = Object.entries(syllabi)
      .flatMap(([cat, items]) =>
        Object.entries(items).map(([title, item]) => ({
          ...item,
          category: cat,
          title
        }))
      )
      .filter(item =>
        (category === 'All Categories' || item.category === category) &&
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    setFilteredSyllabi(filtered);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);

    const filtered = Object.entries(syllabi)
      .flatMap(([cat, items]) =>
        Object.entries(items).map(([title, item]) => ({
          ...item,
          category: cat,
          title
        }))
      )
      .filter(item =>
        (selectedCategory === 'All Categories' || item.category === selectedCategory) &&
        item.title.toLowerCase().includes(term.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    setFilteredSyllabi(filtered);
  };

  const handlePurchasePdf = (syllabus) => {
    // Ensure all required fields are present
    const syllabusDetails = {
      id: syllabus.id || syllabus.title,
      title: syllabus.title,
      category: syllabus.category,
      fees: syllabus.fees || 0,
      duration: syllabus.duration || '30 Days',
      description: syllabus.description || 'Comprehensive PDF syllabus for exam preparation.',
      filePath: syllabus.filePath || `syllabi/${syllabus.id || syllabus.title}.pdf`,
      imageUrl: syllabus.imageUrl || null,
      createdAt: syllabus.createdAt,
    };

    console.log('Navigating to PdfSyllabusPurchase with:', syllabusDetails);

    // Check if navigation object exists and has navigate method
    if (navigation && typeof navigation.navigate === 'function') {
      try {
        navigation.navigate('PdfSyllabusPurchase', { 
          selectedSyllabus: syllabusDetails
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        Alert.alert(
          'Navigation Error',
          'Unable to navigate to purchase screen. Please check your navigation configuration.',
          [{ text: 'OK' }]
        );
      }
    } else {
      console.error('Navigation object is not properly configured');
      Alert.alert(
        'Error',
        'Navigation is not properly configured. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const categories = ['All Categories', ...new Set(Object.keys(syllabi))];

  const renderSyllabusCard = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => handlePurchasePdf(item)}
    >
      <View style={styles.card}>
        {/* Card with Horizontal Layout */}
        <View style={styles.cardHorizontal}>
          {/* Thumbnail Image Section */}
          <View style={styles.thumbnailContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumbnailImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noThumbnail}>
                <Icon name="picture-as-pdf" size={50} color="#fff" />
              </View>
            )}
            
            {/* Category Badge Overlay */}
            <View style={styles.categoryBadgeOverlay}>
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.categoryBadge}
              >
                <Text style={styles.categoryText}>{item.category}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Icon name="access-time" size={14} color="#1a3b5d" />
                </View>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{item.duration || '30 Days'}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Icon name="calendar-today" size={14} color="#1a3b5d" />
                </View>
                <Text style={styles.infoLabel}>Uploaded:</Text>
                <Text style={styles.infoValue}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Icon name="money" size={14} color="#1a3b5d" />
                </View>
                <Text style={styles.infoLabel}>Price:</Text>
                <View style={[
                  styles.priceBadge,
                  (item.fees === 0 || item.fees === '0') ? styles.freeBadge : styles.paidBadge
                ]}>
                  <Text style={styles.priceText}>
                    {(item.fees === 0 || item.fees === '0') ? 'FREE' : `₹${item.fees}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button - Full Width */}
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={() => handlePurchasePdf(item)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1a3b5d', '#2d5a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Icon name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.purchaseButtonText}>
              {(item.fees === 0 || item.fees === '0') ? 'Get Free PDF' : 'Purchase PDF'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a3b5d" />
        <Text style={styles.loadingText}>Loading study materials...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={70} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchSyllabi}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1a3b5d', '#2d5a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryButtonGradient}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1a3b5d', '#2d5a8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>PDF Materials</Text>
            <Text style={styles.headerSubtitle}>
              {filteredSyllabi.length} material{filteredSyllabi.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.myMaterialsButton}
            onPress={() => {
              if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('PdfSyllabusEntry');
              } else {
                Alert.alert('Error', 'Navigation not configured properly');
              }
            }}
            activeOpacity={0.8}
          >
            <Icon name="library-books" size={20} color="#fff" />
            <Text style={styles.myMaterialsButtonText}>My Materials</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={22} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search study materials..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={handleSearch}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Icon name="close" size={22} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="filter-list" size={24} color="#fff" />
            {selectedCategory !== 'All Categories' && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Selected Category Chip */}
        {selectedCategory !== 'All Categories' && (
          <View style={styles.selectedCategoryContainer}>
            <View style={styles.categoryChip}>
              <Icon name="label" size={16} color="#1a3b5d" />
              <Text style={styles.categoryChipText}>{selectedCategory}</Text>
              <TouchableOpacity 
                onPress={() => handleCategoryChange('All Categories')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={18} color="#1a3b5d" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Syllabus Cards List */}
      {filteredSyllabi.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="menu-book" size={90} color="#ddd" />
          <Text style={styles.emptyText}>No PDF study materials found</Text>
          <Text style={styles.emptySubtext}>
            {searchTerm || selectedCategory !== 'All Categories'
              ? 'Try adjusting your filters'
              : 'Check back later for new materials'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSyllabi}
          renderItem={renderSyllabusCard}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1a3b5d']}
              tintColor="#1a3b5d"
            />
          }
        />
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Category</Text>
                <Text style={styles.modalSubtitle}>
                  Filter materials by category
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category && styles.categoryItemSelected
                  ]}
                  onPress={() => handleCategoryChange(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryItemContent}>
                    <Icon 
                      name={category === 'All Categories' ? 'apps' : 'label'} 
                      size={22} 
                      color={selectedCategory === category ? '#4CAF50' : '#666'} 
                    />
                    <Text
                      style={[
                        styles.categoryItemText,
                        selectedCategory === category && styles.categoryItemTextSelected
                      ]}
                    >
                      {category}
                    </Text>
                  </View>
                  {selectedCategory === category && (
                    <View style={styles.checkmarkCircle}>
                      <Icon name="check" size={18} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#b3d1ff',
    marginTop: 4,
  },
  myMaterialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  myMaterialsButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    height: 52,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  filterButton: {
    backgroundColor: '#1a3b5d',
    borderRadius: 14,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedCategoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryChipText: {
    color: '#1a3b5d',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHorizontal: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    width: 140,
    height: 180,
    backgroundColor: '#1a3b5d',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a3b5d',
  },
  categoryBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
  },
  categoryBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  categoryText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3b5d',
    marginBottom: 10,
    lineHeight: 22,
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    width: 65,
  },
  infoValue: {
    fontSize: 11,
    color: '#333',
    flex: 1,
  },
  priceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  freeBadge: {
    backgroundColor: '#2196F3',
  },
  paidBadge: {
    backgroundColor: '#FF9800',
  },
  priceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  purchaseButton: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    paddingBottom: 20,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  categoryList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryItemTextSelected: {
    fontWeight: '700',
    color: '#2e7d32',
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PdfSyllabusDashboard;