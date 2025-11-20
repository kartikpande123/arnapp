import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  BackHandler,
  Dimensions,
  Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import API_BASE_URL from './ApiConfig';

const SecurePdfViewer = ({ route, navigation }) => {
  const { syllabus, studentName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfSource, setPdfSource] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const pdfRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    // Load PDF
    loadPdf();

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Auto-hide controls
    resetControlsTimeout();

    // Check initial orientation
    checkOrientation(Dimensions.get('window'));

    // Listen to orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      checkOrientation(window);
    });

    return () => {
      backHandler.remove();
      subscription?.remove();
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [retryCount]); // Add retryCount as dependency to reload on retry

  const checkOrientation = (dim) => {
    const isLandscapeMode = dim.width > dim.height;
    setIsLandscape(isLandscapeMode);
    setShowControls(false);
  };

  // NEW: Fetch PDF URL from API like web component
  const fetchPdfUrlFromApi = async () => {
    try {
      setLoading(true);
      setError('');

      if (!syllabus) {
        throw new Error('No syllabus selected');
      }

      console.log('Fetching PDF from API for syllabus:', syllabus.syllabusTitle);

      // Fetch all syllabi from API like web component does
      const response = await fetch(`${API_BASE_URL}/api/pdf-syllabi`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch syllabi: ${response.status}`);
      }
      
      const allSyllabi = await response.json();
      
      // Find the selected syllabus in the API response
      let foundSyllabus = null;
      
      Object.keys(allSyllabi).forEach(category => {
        Object.keys(allSyllabi[category]).forEach(title => {
          if (
            title === syllabus.syllabusTitle && 
            category === syllabus.syllabusCategory
          ) {
            foundSyllabus = allSyllabi[category][title];
          }
        });
      });
      
      if (!foundSyllabus) {
        throw new Error('Selected syllabus not found in API');
      }
      
      if (foundSyllabus.fileError) {
        throw new Error('This syllabus file is currently unavailable');
      }
      
      // Use the fileUrl from API response
      const pdfUrl = foundSyllabus.fileUrl;
      
      if (!pdfUrl) {
        throw new Error('No PDF URL found in API response');
      }

      console.log('PDF URL from API:', pdfUrl);

      // Set PDF source with the URL from API
      setPdfSource({
        uri: pdfUrl,
        cache: true,
        headers: {
          'User-Agent': 'SecurePdfViewer/1.0',
        }
      });

      Toast.show({
        type: 'success',
        text1: 'PDF Loaded',
        text2: 'Tap to show/hide controls',
        visibilityTime: 3000,
      });

    } catch (err) {
      console.error('PDF setup error:', err);
      
      // Fallback: Try using the syllabusFileUrl directly if API fails
      if (syllabus?.syllabusFileUrl && retryCount === 0) {
        console.log('Trying fallback with syllabusFileUrl:', syllabus.syllabusFileUrl);
        setPdfSource({
          uri: syllabus.syllabusFileUrl,
          cache: true,
          headers: {
            'User-Agent': 'SecurePdfViewer/1.0',
          }
        });
        setRetryCount(1); // Prevent infinite retry loop
      } else {
        setError(err.message || 'Failed to load PDF');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load PDF',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPdf = async () => {
    // For super users or syllabuses that come from collection, use direct URL
    if (syllabus?.isFromCollection && syllabus?.syllabusFileUrl) {
      console.log('Using direct URL for collection syllabus:', syllabus.syllabusFileUrl);
      setPdfSource({
        uri: syllabus.syllabusFileUrl,
        cache: true,
        headers: {
          'User-Agent': 'SecurePdfViewer/1.0',
        }
      });
      setLoading(false);
    } else {
      // For normal users, fetch from API like web component
      await fetchPdfUrlFromApi();
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Exit PDF Viewer',
      'Are you sure you want to exit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exit',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
    return true;
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      resetControlsTimeout();
    }
  };

  const handleLoadComplete = (numberOfPages) => {
    setTotalPages(numberOfPages);
    setLoading(false);
    console.log(`PDF loaded with ${numberOfPages} pages`);
  };

  const handlePageChanged = (page) => {
    setCurrentPage(page);
    resetControlsTimeout();
  };

  const handleError = (error) => {
    console.error('PDF Error:', error);
    
    // Enhanced error handling with retry logic
    if (retryCount < 2) {
      setError(`Loading PDF... (Retry ${retryCount + 1}/2)`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
    } else {
      setError('Failed to load PDF. Please check your connection and try again.');
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'PDF Error',
        text2: 'Failed to load PDF document',
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError('');
    setLoading(true);
    setPdfSource(null);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages && pdfRef.current) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1 && pdfRef.current) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
    }
  };

  const handleZoomIn = () => {
    if (scale < 3.0) {
      setScale(scale + 0.25);
    }
  };

  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale(scale - 0.25);
    }
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#e74c3c" />
        
        <LinearGradient
          colors={['#e74c3c', '#c0392b']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PDF Viewer</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Failed to Load PDF</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.retryButtonGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <Toast />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#2c3e50"
        hidden={!showControls}
        translucent={true}
      />

      {/* Header - Only show when controls are visible */}
      {showControls && (
        <LinearGradient
          colors={['#3498db', '#2c3e50']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {syllabus?.syllabusTitle || 'PDF Syllabus'}
            </Text>
            {studentName && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {studentName}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                'PDF Information',
                `Title: ${syllabus?.syllabusTitle || 'N/A'}\nCategory: ${syllabus?.syllabusCategory || 'N/A'}\nPages: ${totalPages || 'Loading...'}\nSource: ${syllabus?.isFromCollection ? 'Collection' : 'API'}`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Icon name="information" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* PDF Viewer - Full screen container */}
      <View style={styles.pdfMainContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>
              {retryCount > 0 ? `Loading PDF... (Attempt ${retryCount + 1})` : 'Loading PDF...'}
            </Text>
          </View>
        ) : pdfSource ? (
          <Pdf
            ref={pdfRef}
            trustAllCerts={false}
            source={pdfSource}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            onPageSingleTap={toggleControls}
            style={styles.pdf}
            horizontal={false}
            enablePaging={true}
            spacing={0}
            minScale={0.5}
            maxScale={3.0}
            scale={scale}
            enableAnnotationRendering={true}
            password=""
            fitPolicy={0}
            singlePage={false}
            renderActivityIndicator={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Rendering PDF...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Initializing PDF viewer...</Text>
          </View>
        )}

        {/* Watermark Overlay */}
        {currentPage > 0 && pdfSource && (
          <View style={styles.watermarkContainer} pointerEvents="none">
            <Text style={styles.watermark}>
              {studentName || 'Secure Viewing'}
            </Text>
            <Text style={styles.watermarkSmall}>
              Protected Content
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Controls - Only show when controls are visible */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          <View style={styles.controlsContainer}>
            {/* Page Navigation */}
            <View style={styles.pageControls}>
              <TouchableOpacity 
                style={[styles.controlButton, currentPage === 1 && styles.controlButtonDisabled]}
                onPress={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <Icon name="chevron-left" size={24} color={currentPage === 1 ? "#bdc3c7" : "#fff"} />
              </TouchableOpacity>

              <View style={styles.pageIndicator}>
                <Text style={styles.pageText}>
                  {currentPage} / {totalPages || '...'}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.controlButton, currentPage === totalPages && styles.controlButtonDisabled]}
                onPress={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <Icon name="chevron-right" size={24} color={currentPage === totalPages ? "#bdc3c7" : "#fff"} />
              </TouchableOpacity>
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity 
                style={styles.zoomButton}
                onPress={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <Icon name="magnify-minus" size={24} color={scale <= 0.5 ? "#bdc3c7" : "#fff"} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.zoomButton}
                onPress={handleZoomReset}
              >
                <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.zoomButton}
                onPress={handleZoomIn}
                disabled={scale >= 3.0}
              >
                <Icon name="magnify-plus" size={24} color={scale >= 3.0 ? "#bdc3c7" : "#fff"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Icon name="shield-check" size={16} color="#27ae60" />
            <Text style={styles.securityText}>
              Secure viewing enabled • {syllabus?.isFromCollection ? 'Collection' : 'API'} Source
            </Text>
          </View>
        </View>
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  pdfMainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ecf0f1',
    marginTop: 2,
    textAlign: 'center',
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ecf0f1',
    fontWeight: '500',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.05,
    pointerEvents: 'none',
  },
  watermark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  watermarkSmall: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    transform: [{ rotate: '-45deg' }],
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderRadius: 25,
    marginHorizontal: 8,
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(127, 140, 141, 0.3)',
  },
  pageIndicator: {
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  pageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderRadius: 25,
    marginHorizontal: 8,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f7fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    marginBottom: 12,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SecurePdfViewer;