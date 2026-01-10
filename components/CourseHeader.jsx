import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import logo from "../Images/LOGO.jpg";

const { width } = Dimensions.get('window');

// Simple custom icons matching the web design
const HomeIcon = ({ size = 20, color = 'rgba(255, 255, 255, 0.9)' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.iconBase, { borderColor: color }]}>
      <View style={[styles.homeRoof, { backgroundColor: color }]} />
      <View style={[styles.homeBase, { backgroundColor: color }]} />
    </View>
  </View>
);

const VideoIcon = ({ size = 20, color = 'rgba(255, 255, 255, 0.9)' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.iconBase, { borderColor: color }]}>
      <View style={[styles.videoTriangle, { borderLeftColor: color }]} />
    </View>
  </View>
);

const ClipboardIcon = ({ size = 20, color = 'rgba(255, 255, 255, 0.9)' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.iconBase, { borderColor: color }]}>
      <View style={[styles.clipboardTop, { backgroundColor: color }]} />
      <View style={styles.clipboardLines}>
        <View style={[styles.clipboardLine, { backgroundColor: color }]} />
        <View style={[styles.clipboardLine, { backgroundColor: color, width: '70%' }]} />
        <View style={[styles.clipboardLine, { backgroundColor: color, width: '85%' }]} />
      </View>
    </View>
  </View>
);

const MenuIcon = ({ size = 24, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={styles.menuIcon}>
      <View style={[styles.menuLine, { backgroundColor: color }]} />
      <View style={[styles.menuLine, { backgroundColor: color }]} />
      <View style={[styles.menuLine, { backgroundColor: color }]} />
    </View>
  </View>
);

const CloseIcon = ({ size = 24, color = '#ffffff' }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={styles.closeIcon}>
      <View style={[styles.closeLine, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.closeLine, { backgroundColor: color, transform: [{ rotate: '-45deg' }] }]} />
    </View>
  </View>
);

const CourseHeader = () => {
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-100))[0];

  const handleHomeClick = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
    closeMenu();
  };

  const handleGMeetClick = () => {
    navigation.navigate('CourseGmeetFinder');
    closeMenu();
  };

  const handleStatusClick = () => {
    navigation.navigate('CourseStatusCheck');
    closeMenu();
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuOpen(false);
    });
  };

  return (
    <>
      <StatusBar
        backgroundColor="#1a3b5d"
        barStyle="light-content"
        translucent={false}
      />
      <View style={styles.container}>
        {/* Header Container */}
        <View style={styles.headerContainer}>
          {/* Logo and Brand Section - All in one line */}
          <View style={styles.brandRow}>
            <TouchableOpacity 
              style={styles.brandContainer} 
              onPress={handleHomeClick}
              activeOpacity={0.8}
            >
              {/* Logo */}
              <View style={styles.logoWrapper}>
                <Image
                  source={logo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              {/* Brand Text - Next to logo */}
              <View style={styles.brandContent}>
                <Text style={styles.brandText}>ARN Pvt Exam Conduct</Text>
                <Text style={styles.brandSubText}>Online Course Dashboard</Text>
              </View>
            </TouchableOpacity>

            {/* Hamburger Menu for Mobile */}
            {width <= 768 && (
              <TouchableOpacity 
                style={styles.menuButton} 
                onPress={toggleMenu}
                activeOpacity={0.7}
              >
                {menuOpen ? (
                  <CloseIcon size={24} />
                ) : (
                  <MenuIcon size={24} />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Navigation Items - Only show on larger screens */}
          {width > 768 && (
            <View style={styles.navContainer}>
              <TouchableOpacity 
                style={styles.navItem} 
                onPress={handleHomeClick}
                activeOpacity={0.7}
              >
                <HomeIcon size={20} />
                <Text style={styles.navText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.navItem} 
                onPress={handleGMeetClick}
                activeOpacity={0.7}
              >
                <VideoIcon size={20} />
                <Text style={styles.navText}>G-Meet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.navItem} 
                onPress={handleStatusClick}
                activeOpacity={0.7}
              >
                <ClipboardIcon size={20} />
                <Text style={styles.navText}>Track Admission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Mobile Dropdown Menu */}
        {menuOpen && width <= 768 && (
          <Animated.View 
            style={[
              styles.dropdownMenu,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={handleHomeClick}
              activeOpacity={0.7}
            >
              <HomeIcon size={20} />
              <Text style={styles.dropdownText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={handleGMeetClick}
              activeOpacity={0.7}
            >
              <VideoIcon size={20} />
              <Text style={styles.dropdownText}>G-Meet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={handleStatusClick}
              activeOpacity={0.7}
            >
              <ClipboardIcon size={20} />
              <Text style={styles.dropdownText}>Track Admission</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a3b5d',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical:12,
    minHeight: 85,
    paddingTop:50
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginRight: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  brandContent: {
    flexDirection: 'column',
    gap: 2,
  },
  brandText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 110,
    justifyContent: 'center',
  },
  navText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginLeft: 10,
  },
  dropdownMenu: {
    backgroundColor: '#1a3b5d',
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  dropdownText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },

  // Custom Icon Styles
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBase: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Home Icon
  homeRoof: {
    position: 'absolute',
    top: -3,
    left: '25%',
    width: '50%',
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  homeBase: {
    position: 'absolute',
    bottom: 3,
    left: '20%',
    width: '60%',
    height: 3,
  },

  // Video Icon
  videoTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },

  // Clipboard Icon
  clipboardTop: {
    position: 'absolute',
    top: -1,
    left: '30%',
    width: '40%',
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  clipboardLines: {
    marginTop: 8,
    alignItems: 'center',
    gap: 2,
  },
  clipboardLine: {
    height: 2,
    width: '60%',
    borderRadius: 1,
  },

  // Menu Icon
  menuIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
  },
  menuLine: {
    width: '100%',
    height: 2,
    borderRadius: 1,
  },

  // Close Icon
  closeIcon: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  closeLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    borderRadius: 1,
    top: '50%',
    left: 0,
  },
});

// Responsive styles for mobile
const responsiveStyles = StyleSheet.create({
  headerContainer: width <= 768 ? {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 75,
  } : {},
  
  logoWrapper: width <= 768 ? {
    width: 50,
    height: 50,
    borderRadius: 8,
    padding: 3,
    marginRight: 10,
  } : {},
  
  brandText: width <= 768 ? {
    fontSize: 16,
    lineHeight: 20,
  } : {},
  
  brandSubText: width <= 768 ? {
    fontSize: 11,
    lineHeight: 13,
  } : {},
  
  brandContent: width <= 768 ? {
    gap: 1,
  } : {},
  
  menuButton: width <= 768 ? {
    width: 38,
    height: 38,
    padding: 6,
  } : {},
  
  headerContainerSmall: width <= 576 ? {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
  } : {},
  
  logoWrapperSmall: width <= 576 ? {
    width: 45,
    height: 45,
    borderRadius: 7,
    marginRight: 8,
  } : {},
  
  brandTextSmall: width <= 576 ? {
    fontSize: 14,
    lineHeight: 18,
  } : {},
  
  brandSubTextSmall: width <= 576 ? {
    fontSize: 10,
    lineHeight: 12,
  } : {},
});

// Merge all styles
const mergedStyles = StyleSheet.create({
  ...styles,
  headerContainer: {
    ...styles.headerContainer,
    ...(width <= 768 && responsiveStyles.headerContainer),
    ...(width <= 576 && responsiveStyles.headerContainerSmall),
  },
  logoWrapper: {
    ...styles.logoWrapper,
    ...(width <= 768 && responsiveStyles.logoWrapper),
    ...(width <= 576 && responsiveStyles.logoWrapperSmall),
  },
  brandText: {
    ...styles.brandText,
    ...(width <= 768 && responsiveStyles.brandText),
    ...(width <= 576 && responsiveStyles.brandTextSmall),
  },
  brandSubText: {
    ...styles.brandSubText,
    ...(width <= 768 && responsiveStyles.brandSubText),
    ...(width <= 576 && responsiveStyles.brandSubTextSmall),
  },
  brandContent: {
    ...styles.brandContent,
    ...(width <= 768 && responsiveStyles.brandContent),
  },
  menuButton: {
    ...styles.menuButton,
    ...(width <= 768 && responsiveStyles.menuButton),
  },
});

export default CourseHeader;