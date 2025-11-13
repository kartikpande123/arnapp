import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import API_BASE_URL from './ApiConfig';

const UserSyllabus = () => {
  const [syllabusData, setSyllabusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSyllabusData();
  }, []);

  const fetchSyllabusData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/syllabus`);
      if (!response.ok) {
        throw new Error('Failed to fetch syllabus data');
      }
      const data = await response.json();
      const syllabusArray = Object.values(data.data || {}).sort((a, b) =>
        a.examTitle.localeCompare(b.examTitle)
      );
      setSyllabusData(syllabusArray);
      setError(null);
    } catch (err) {
      setError('No syllabus available');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSyllabusData();
  };

  const extractFileId = (url) => {
    let fileId = null;
    
    try {
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0].split('?')[0];
      } else if (url.includes('/open?id=')) {
        fileId = url.split('/open?id=')[1].split('&')[0];
      } else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      } else if (url.includes('/d/')) {
        fileId = url.split('/d/')[1].split('/')[0].split('?')[0];
      }
    } catch (e) {
      console.error('Error extracting file ID:', e);
    }
    
    return fileId;
  };

  const handleOpenLink = async (url) => {
    try {
      console.log('Original URL:', url);
      
      let linkToOpen = url;
      
      if (url.includes('drive.google.com')) {
        const fileId = extractFileId(url);
        if (fileId) {
          linkToOpen = `https://drive.google.com/file/d/${fileId}/view`;
          console.log('Formatted view URL:', linkToOpen);
        }
      }
      
      const canOpen = await Linking.canOpenURL(linkToOpen);
      console.log('Can open URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(linkToOpen);
      } else {
        if (!linkToOpen.startsWith('http')) {
          linkToOpen = 'https://' + linkToOpen;
        }
        await Linking.openURL(linkToOpen);
      }
    } catch (err) {
      console.error('Error opening link:', err);
      Alert.alert(
        'Unable to Open Link',
        'Please check your internet connection or try again later.',
        [
          {
            text: 'Copy Link',
            onPress: () => {
              Alert.alert('Link', url);
            }
          },
          { text: 'OK' }
        ]
      );
    }
  };

  const handleDownload = async (url) => {
    try {
      console.log('Download URL:', url);
      
      let downloadUrl = url;
      
      if (url.includes('drive.google.com')) {
        const fileId = extractFileId(url);
        
        if (fileId) {
          downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          console.log('Formatted download URL:', downloadUrl);
        }
      }
      
      const canOpen = await Linking.canOpenURL(downloadUrl);
      console.log('Can open download URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(downloadUrl);
        Alert.alert('Download', 'Opening download link...');
      } else {
        await handleOpenLink(url);
        Alert.alert('Info', 'Opening in browser. You can download from there.');
      }
    } catch (err) {
      console.error('Error downloading:', err);
      Alert.alert(
        'Unable to Download',
        'Please open the link and download manually.',
        [
          {
            text: 'Open Link',
            onPress: () => handleOpenLink(url)
          },
          { text: 'Cancel' }
        ]
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📄</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.examTitle} numberOfLines={2}>
            {item.examTitle}
          </Text>
          <Text style={styles.dateText}>Added: {formatDate(item.uploadedAt)}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleOpenLink(item.syllabusLink)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonIcon}>🔗</Text>
          <Text style={styles.primaryButtonText}>View Syllabus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleDownload(item.syllabusLink)}
          activeOpacity={0.7}
        >
          <Text style={styles.downloadIcon}>⬇️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📂</Text>
      <Text style={styles.emptyTitle}>No syllabus documents available</Text>
      <Text style={styles.emptySubtitle}>Check back later for updates</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📚</Text>
          <Text style={styles.headerTitle}>Syllabus</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  if (error && syllabusData.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📚</Text>
          <Text style={styles.headerTitle}>Syllabus</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSyllabusData}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3b5d" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Syllabus Documents (Live Exam) 📔</Text>
      </View>

      <FlatList
        data={syllabusData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Click "View Syllabus" to open in browser or download icon to save
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1a3b5d',
    paddingVertical: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 8,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  downloadIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
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
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9ca3af',
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default UserSyllabus;