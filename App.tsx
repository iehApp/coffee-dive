import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, SafeAreaView, BackHandler, Platform, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { requestTrackingPermissionsAsync, PermissionStatus } from 'expo-tracking-transparency';

const allowedUrls = ['https://coffeedive.ro', 'https://www.coffeedive.ro']; 

export default function App() {
  const [error, setError] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [trackingPermission, setTrackingPermission] = useState<PermissionStatus | null>(null);
  const webViewRef = useRef<WebView>(null);  
  const [userResponse, setUserResponse] = useState<String | null>(null);
  const [isPermissionChecked, setIsPermissionChecked] = useState(false); 
  const [currentUrl, setCurrentUrl] = useState('https://coffeedive.ro/'); 


  const reloadPage = () => {
    setError(false);
  };

  const handleBackButton = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  const checkTrackingPermission = async () => {
    const { status } = await requestTrackingPermissionsAsync();
    setTrackingPermission(status); 
    setIsPermissionChecked(true); 

    if (status === 'granted') {
      setUserResponse('granted');
    } else {
      setUserResponse('deny');
    }
  };
  
  useEffect(() => {

    checkTrackingPermission(); 

    const handleUrl = (event: LinkingEvent) => {
      const { url } = event;
      if (url && allowedUrls.some(allowedUrl => url.startsWith(allowedUrl))) {
        setCurrentUrl(url);
      } else {
        Alert.alert('Invalid URL', 'This URL is not allowed.');
      }
    };

    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && allowedUrls.some(allowedUrl => initialUrl.startsWith(allowedUrl))) {
        setCurrentUrl(initialUrl);
      }
    };
    getInitialURL();

    const subscription = Linking.addEventListener('url', handleUrl);

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', handleBackButton);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
    }
  }, []);

  const handleiOSBackButton = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };
  

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaTop} />
      {!isPermissionChecked ? (
        <View style={styles.imageContainer}>
          <Image source={require('./assets/coffeedive-icon.png')} style={styles.placeholderImage} />
        </View>
      ) : (
      <View style={styles.webViewContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>Ne cerem scuze, site-ul momentan este indisponibil.</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={reloadPage}>
              <Text style={styles.reloadButtonText}>Reîncearcă</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            style={styles.webView}
            source={{ uri: currentUrl }}
            onError={() => setError(true)}
            javaScriptEnabled={true}
            onScroll={(event) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              setIsScrollingDown(offsetY > scrollOffset);
              setScrollOffset(offsetY);
            }}
          />
        )}
      </View>
      )}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.backButton, { opacity: isScrollingDown && scrollOffset > 0 ? 1 : 0 }]}
          onPress={handleiOSBackButton}>
          <Icon name="arrow-back" size={18} color="#935e0f" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c6bba8',
  },
  safeAreaTop: {
    flex: 0,
    backgroundColor: '#c6bba8',
  },
  webViewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: '#935e0f',
    padding: 10,
    borderRadius: 5,
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
    backgroundColor: '#c6bba8',
    padding: 10,
    borderRadius: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

interface LinkingEvent {
  url: string;
}