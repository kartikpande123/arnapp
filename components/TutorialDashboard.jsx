import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import Video from "react-native-video";
import Icon from "react-native-vector-icons/MaterialIcons";
import API_BASE_URL from "./ApiConfig";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function TutorialDashboard() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);

  // Fetch all tutorials
  const fetchTutorials = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/getAllTutorials`);
      const allTutorials = Array.isArray(response.data) ? response.data : [];
      
      // Filter only android category
      const androidTutorials = allTutorials.filter(
        (tut) => tut.category === "android"
      );
      
      setTutorials(androidTutorials);
    } catch (error) {
      console.error("Error fetching tutorials:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load tutorials",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  // Handle video click
  const handleVideoClick = (tutorial) => {
    setSelectedVideo(tutorial);
    setVideoPaused(true); // Start paused
    setShowModal(true);
    
    // Auto-play after modal is visible
    setTimeout(() => {
      setVideoPaused(false);
    }, 300);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setVideoPaused(true); // Pause video first
    setShowModal(false);
    
    // Clear selected video after modal closes
    setTimeout(() => {
      setSelectedVideo(null);
    }, 300);
  };

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.loadingText}>Loading tutorials...</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="videocam" size={80} color="#9ca3af" />
      </View>
      <Text style={styles.emptyTitle}>No Tutorials Available</Text>
      <Text style={styles.emptyText}>
        Check back later for Android tutorial videos
      </Text>
    </View>
  );

  // Render tutorial card
  const renderTutorialCard = (tutorial) => (
    <TouchableOpacity
      key={tutorial.id}
      style={styles.tutorialCard}
      onPress={() => handleVideoClick(tutorial)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Video
          source={{ uri: tutorial.videoURL }}
          style={styles.thumbnail}
          paused={true}
          resizeMode="cover"
          repeat={false}
        />
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Icon name="play-arrow" size={30} color="#6366f1" />
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>Video</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.tutorialTitle} numberOfLines={2}>
          {tutorial.tutorialName}
        </Text>
        <View style={styles.tutorialMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{tutorial.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Android Guide Tutorial</Text>
          <Text style={styles.headerSubtitle}>
            Learn how to use our Android app with these video tutorials
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          renderLoading()
        ) : tutorials.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.tutorialsGrid}>
            {tutorials.map(renderTutorialCard)}
          </View>
        )}
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={showModal}
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
                {selectedVideo?.tutorialName}
              </Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.videoContainer}>
              {selectedVideo && (
                <Video
                  source={{ uri: selectedVideo.videoURL }}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerSection: {
    backgroundColor: "#1a3b5d",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 22,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  loadingText: {
    marginTop: 20,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    color: "#1e293b",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  tutorialsGrid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tutorialCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  thumbnailContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#000",
    position: "relative",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  durationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  cardBody: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  tutorialTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    lineHeight: 18,
  },
  tutorialMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
    paddingTop:40
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  videoPlayer: {
    width: screenWidth,
    height: screenHeight - 150, // Reduced height to prevent overlap with navigation
  },
});