/*
 * Copyright (C) 2026 SPORT-SERVICE RS★R
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VLCPlayer } from 'react-native-vlc-media-player';
import { useActiveCameraState } from '../store/GoProStore';
import { goProWiFi } from '../network/GoProWiFiManager';
import { useTranslation } from 'react-i18next';

const GOPRO_STREAM_URL = 'udp://@:8554';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const PreviewPlayer: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const wifiStatus = useActiveCameraState((cs) => cs.wifiStatus);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playSessionId, setPlaySessionId] = useState<number>(0);
  const [isMounting, setIsMounting] = useState<boolean>(false);
  // Controls cancellation of the in-flight connect sequence (AP on → wait → connect → stream).
  const abortRef = useRef<AbortController | null>(null);

  const isConnecting = isMounting || wifiStatus === 'connecting';

  useEffect(() => {
    if (!visible) {
      setIsPlaying(false);
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const startConnection = async () => {
      setIsMounting(true);
      setErrorMsg(null);
      try {
        // Each step below is cancellable: connectToCameraWiFi checks the signal
        // between sub-steps and the long AP-broadcast wait aborts instantly.
        const connected = await goProWiFi.connectToCameraWiFi(signal);
        if (!mounted || signal.aborted) return;
        if (!connected) {
          setErrorMsg(t('preview.wifiFailed'));
          return;
        }

        const streamStarted = await goProWiFi.startPreviewStream(signal);
        if (!mounted || signal.aborted) {
          // User left while the stream was starting — stop it so the camera
          // doesn't keep broadcasting.
          goProWiFi.stopPreviewStream().catch(() => {});
          return;
        }

        if (streamStarted) {
          setPlaySessionId((prev) => prev + 1);
          setIsPlaying(true);
        } else {
          setErrorMsg(t('preview.streamFailed'));
        }
      } finally {
        if (mounted) setIsMounting(false);
      }
    };

    startConnection();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [visible]);

  // Close/cancel: works at any point, including mid-connection. Aborts the
  // in-flight sequence immediately and tears down in the background so the modal
  // never blocks on a long-running Wi-Fi operation.
  const handleClose = () => {
    abortRef.current?.abort();
    const wasPlaying = isPlaying;
    setIsPlaying(false); // unmount VLC first (begin native destruction)

    // Best-effort teardown; never awaited so the UI closes right away.
    void (async () => {
      await goProWiFi.stopPreviewStream();
      await goProWiFi.disconnectFromCameraWiFi();
    })();

    if (wasPlaying) {
      // Give the native VLC view a moment to detach before unmounting the modal.
      setTimeout(() => onClose(), 400);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('preview.title')}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={isConnecting ? t('common.cancel') : t('preview.close')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>
              {isConnecting ? t('common.cancel') : t('preview.close')}
            </Text>
          </TouchableOpacity>
        </View>

        {wifiStatus !== 'connected' || !isPlaying ? (
          <View style={styles.placeholder}>
            {isConnecting ? (
              <>
                <ActivityIndicator size="large" color="#ffffff" style={{ marginBottom: 12 }} />
                <Text style={styles.placeholderText}>{t('preview.connecting')}</Text>
                <Text style={styles.cancelHintText}>{t('preview.cancelHint')}</Text>
              </>
            ) : (
              <>{errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}</>
            )}
          </View>
        ) : (
          <View style={styles.videoContainer}>
            <VLCPlayer
              key={`vlc-${playSessionId}`}
              style={styles.video}
              videoAspectRatio="16:9"
              source={{ uri: GOPRO_STREAM_URL, initType: 2 }}
              autoplay={true}
              {...({
                initOptions: [
                  '--network-caching=150',
                  '--clock-synchronization=0',
                  '--drop-late-frames',
                  '--skip-frames',
                ],
              } as any)}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 全画面黒背景
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  placeholderText: {
    color: '#868e96',
    fontSize: 16,
  },
  cancelHintText: {
    color: '#5c6066',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#fa5252',
    fontSize: 16,
    textAlign: 'center',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
