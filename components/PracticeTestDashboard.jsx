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
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
import API_BASE_URL from './ApiConfig';

const PracticeTestDashboard = ({ navigation }) => {
  const [practiceTests, setPracticeTests] = useState({});
  const [filteredTests, setFilteredTests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPracticeTests();
  }, []);

  const fetchPracticeTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/practice-tests`);

      if (!response.ok) {
        throw new Error('Failed to fetch practice tests');
      }

      const data = await response.json();
      setPracticeTests(data);

      const allTests = Object.entries(data).flatMap(([category, tests]) =>
        Object.entries(tests).map(([title, test]) => ({
          ...test,
          category,
          title
        }))
      ).sort((a, b) => b.createdAt - a.createdAt);

      setFilteredTests(allTests);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching practice tests:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPracticeTests();
    setRefreshing(false);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);

    const filtered = Object.entries(practiceTests)
      .flatMap(([cat, tests]) =>
        Object.entries(tests).map(([title, test]) => ({
          ...test,
          category: cat,
          title
        }))
      )
      .filter(test =>
        (category === 'All Categories' || test.category === category) &&
        test.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    setFilteredTests(filtered);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);

    const filtered = Object.entries(practiceTests)
      .flatMap(([cat, tests]) =>
        Object.entries(tests).map(([title, test]) => ({
          ...test,
          category: cat,
          title
        }))
      )
      .filter(test =>
        (selectedCategory === 'All Categories' || test.category === selectedCategory) &&
        test.title.toLowerCase().includes(term.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    setFilteredTests(filtered);
  };

  const handlePurchaseExam = (exam) => {
    navigation.navigate('PracticeTestPurchase', { selectedExam: exam });
  };

  const categories = ['All Categories', ...new Set(Object.keys(practiceTests))];

  const renderTestCard = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.95}
      onPress={() => handlePurchaseExam(item)}
    >
      <View style={styles.card}>
        {/* Card Header with Gradient */}
        <LinearGradient
          colors={['#1a3b5d', '#2d5a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradientHeader}
        >
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Icon name="calendar-today" size={16} color="#1a3b5d" />
              </View>
              <Text style={styles.infoText}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Icon name="access-time" size={16} color="#1a3b5d" />
              </View>
              <Text style={styles.infoText}>{item.timeLimit}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Icon name="money" size={16} color="#1a3b5d" />
              </View>
              <Text style={styles.priceText}>
                {item.fees === 0 ? 'Free Access' : `₹${item.fees}`}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              item.fees === 0 ? styles.freeButton : styles.paidButton
            ]}
            onPress={() => handlePurchaseExam(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={item.fees === 0 ? ['#4CAF50', '#45a049'] : ['#1a3b5d', '#2d5a8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.purchaseButtonText}>
                {item.fees === 0 ? 'Start Free Test' : 'Purchase Now'}
              </Text>
              <Icon name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a3b5d" />
        <Text style={styles.loadingText}>Loading practice tests...</Text>
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
          onPress={fetchPracticeTests}
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
            <Text style={styles.headerTitle}>Practice Tests</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.myTestButton}
            onPress={() => navigation.navigate('PracticeExamEntry')}
            activeOpacity={0.8}
          >
            <Icon name="assignment" size={20} color="#fff" />
            <Text style={styles.myTestButtonText}>My Tests</Text>
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
              placeholder="Search practice tests..."
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

      {/* Test Cards List */}
      {filteredTests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="school" size={90} color="#ddd" />
          <Text style={styles.emptyText}>No practice tests found</Text>
          <Text style={styles.emptySubtext}>
            {searchTerm || selectedCategory !== 'All Categories'
              ? 'Try adjusting your filters'
              : 'Check back later for new tests'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          renderItem={renderTestCard}
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
                  Filter tests by category
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#b3d1ff',
    marginTop: 4,
  },
  myTestButton: {
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
  myTestButtonText: {
    color: '#fff',
    fontSize: 14,
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
  cardGradientHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a3b5d',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoContainer: {
    gap: 14,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priceText: {
    fontSize: 15,
    color: '#1a3b5d',
    fontWeight: '600',
    flex: 1,
  },
  purchaseButton: {
    borderRadius: 12,
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
    paddingVertical: 15,
    gap: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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

export default PracticeTestDashboard;