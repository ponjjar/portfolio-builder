import { useTheme } from '@/theme/ThemeContext';
import { X } from 'lucide-react-native';
import React from 'react';
import { Platform, Modal as RNModal, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
    variant?: 'modal' | 'popover';
}

export function TransparentModal({
    visible,
    onClose,
    title,
    size = 'md',
    children,
    footer,
    hideCloseButton = false,
    variant = 'modal'
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

    if (!visible) return null;

    const content = (
        <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            pointerEvents="box-none"
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
            <Animated.View
                pointerEvents="auto"
                entering={ZoomInRotate.withInitialValues({
                    scale: 2,
                    // rotate: "-0.005rad"
                    rotate: "-0.40rad",

                }).springify().damping(20).mass(0.8).duration(120)
                }
                exiting={FadeOutLeft.springify().damping(20).mass(0.8).duration(80).withTargetValues({
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
                    backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(24, 24, 27, 0.8)',
                    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px) saturate(10%)' } : {}) as any,
                }}
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
            </Animated.View>
        </Animated.View>
    );

    if (variant === 'popover') {
        return content;
    }

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="none" // We use Reanimated instead
            onRequestClose={onClose}
        >
            {content}
        </RNModal>
    );
}
