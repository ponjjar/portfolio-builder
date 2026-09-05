
import { useTheme } from '@/theme/ThemeContext';
import { X } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Modal as RNModal, ScrollView, Text, TouchableOpacity, useWindowDimensions, View, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, FadeOutLeft, ZoomInRotate } from 'react-native-reanimated';
import { useThemeColor } from '@/theme/colors';


export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
  variant?: "solid" | "popover";
}

export function Modal({
  visible,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  hideCloseButton = false,
  variant = "solid"
}: ModalProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const getMaxWidthValue = () => {
    switch (size) {
      case 'sm': return 512;
      case 'md': return 672;
      case 'lg': return 896;
      case 'xl': return 1024;
      default: return 672;
    }
  };

  const [showModal, setShowModal] = React.useState(visible);

  React.useEffect(() => {
    if (visible) {
      setShowModal(true);
    } else {
      // Delay unmounting the native modal to allow Reanimated exit animations to finish
      const timeout = setTimeout(() => setShowModal(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (

    variant === "popover"
      ?
      <RNModal
        visible={showModal}
        transparent
        animationType="none" // We use Reanimated instead
        onRequestClose={onClose}
      >
        {visible && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            pointerEvents="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: Platform.OS === 'web' ? '100vh' as any : '100%',
              width: Platform.OS === 'web' ? '100vw' as any : '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: variant === 'popover' && !isSmallScreen ? 'flex-start' : 'center',
              padding: isSmallScreen ? 0 : 16,
              paddingLeft: variant === 'popover' && !isSmallScreen ? 340 : (isSmallScreen ? 0 : 16),
              paddingBottom: isSmallScreen ? 0 : 16,
              backgroundColor: variant === 'popover'
                ? 'transparent'
                : 'rgba(0,0,0,0.3)',
              zIndex: 9999,
            }}
          >
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={onClose}
            />
            <Animated.View
              pointerEvents="auto"
              entering={ZoomInRotate.withInitialValues({
                scale: 2.2,
                rotate: "-0.35rad",
              }).springify().damping(20).mass(0.8).duration(100)}
              exiting={FadeOutLeft.springify().damping(20).mass(0.8).withTargetValues({
                translateX: -100,
              })}
              style={{
                width: '100%',
                maxWidth: isSmallScreen ? '100%' : `${getMaxWidthValue()}px`,
                height: isSmallScreen ? '100%' : (variant === 'popover' ? 'auto' : '85%'),
                maxHeight: isSmallScreen ? '100%' : '90%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.3,
                shadowRadius: 32,
                elevation: 20,
                borderRadius: isSmallScreen ? 0 : 20,
                backgroundColor: Platform.OS === 'web' 
                  ? (theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(24, 24, 27, 0.8)')
                  : (theme === 'light' ? '#F7F7F5' : '#292A2D'),
                ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px) saturate(10%)' } : {}) as any,
              }}
            >
              <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
                <KeyboardAvoidingView 
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={{ flex: 1, width: '100%' }}
                >
                  <View
                    className={`w-full border-border overflow-hidden flex-col theme-${theme}`}
                    style={{
                      height: isSmallScreen ? '100%' : '100%',
                      borderWidth: isSmallScreen ? 0 : 1,
                      borderRadius: isSmallScreen ? 0 : 20
                    }}
                  >
                    {/* Header */}
                    {(title || (!hideCloseButton && onClose)) && (
                      <View className="flex-row items-center justify-between p-4 border-b border-border" style={{ backgroundColor: 'transparent' }}>
                        <Text className="text-text font-bold text-lg">{title}</Text>
                        {!hideCloseButton && onClose && (
                          <TouchableOpacity onPress={onClose} className="p-2">
                            <X color={useThemeColor('--text')} size={20} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Body */}
                    <ScrollView
                      style={{ flexShrink: 1, width: '100%' }}
                      contentContainerStyle={{ padding: 16 }}
                      keyboardShouldPersistTaps="handled"
                    >
                      {children}
                    </ScrollView>

                    {/* Footer */}
                    {footer && (
                      <View className="p-4 border-t border-border flex-row justify-end items-center gap-3" style={{ backgroundColor: 'transparent' }}>
                        {footer}
                      </View>
                    )}
                  </View>
                </KeyboardAvoidingView>
              </SafeAreaView>
            </Animated.View>
          </Animated.View>
        )}
      </RNModal>

      :
      <RNModal
        visible={visible}
        transparent
        animationType="fade" // We use Reanimated instead
        onRequestClose={onClose}
      >
        {/* Overlay background */}
        <Animated.View
          // entering={FadeInUp.duration(100).springify().damping(18).stiffness(150)}
          // exiting={FadeOutUp.duration(100).springify().damping(18).stiffness(150)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: Platform.OS === 'web' ? '100vh' as any : '100%',
            width: Platform.OS === 'web' ? '100vw' as any : '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isSmallScreen ? 0 : 16,
            backgroundColor: isSmallScreen
              ? (theme === 'light' ? '#ffffff' : '#121212') // Solid background on small screens
              : (theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)'),
            ...(Platform.OS === 'web' && !isSmallScreen ? { backdropFilter: 'blur(8px)' } : {}) as any,
            zIndex: 9999, // Ensure it sits on top
          }}
        >
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onClose}
          />
          {/* Modal Container */}
          <Animated.View
            // entering={FadeInUp.duration(100).springify().damping(18).stiffness(150)}
            // exiting={FadeOutUp.duration(50).springify().damping(18).stiffness(150)}
            style={{
              width: '100%',
              maxWidth: isSmallScreen ? '100%' : getMaxWidthValue(),
              height: isSmallScreen ? '100%' : '85%',
            }}
          >
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1, width: '100%' }}
              >
                <View
                  className={`w-full h-full bg-surface border-border overflow-hidden flex-col theme-${theme}`}
                  style={{
                    borderWidth: isSmallScreen ? 0 : 1,
                    borderRadius: isSmallScreen ? 0 : 12
                  }}
                >
                  {/* Header */}
                  {(title || (!hideCloseButton && onClose)) && (
                    <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface-elevated">
                      <Text className="text-text font-bold text-lg">{title}</Text>
                      {!hideCloseButton && onClose && (
                        <TouchableOpacity onPress={onClose} className="p-2">
                          <X color={useThemeColor('--text')} size={20} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Body */}
                  <ScrollView
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={{ padding: 16 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {children}
                  </ScrollView>

                  {/* Footer */}
                  {footer && (
                    <View className="p-4 border-t border-border bg-surface-elevated flex-row justify-end items-center gap-3">
                      {footer}
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </RNModal>
  );
}
