import { ThemeId, useTheme } from '@/theme/ThemeContext';
import { Eclipse, Flame, Moon, Palette, Sun, Terminal, Waves } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/theme/colors';


export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<View>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleFastClick = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    buttonRef.current?.measure((_fx, _fy, width, height, px, py) => {
      const originX = px + width / 2;
      const originY = py + height / 2;
      setTheme(nextTheme, originX, originY);
    });

    setShowTooltip(true);
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
      setShowTooltip(false);
    }, 3500);
  };

  const handleLongPress = () => {
    buttonRef.current?.measure((_fx, _fy, width, height, px, py) => {
      setMenuLayout({ x: px, y: py, width, height });
      setIsOpen(true);
      setShowTooltip(false);
    });
  };

  const handleSelect = (id: ThemeId) => {
    setIsOpen(false);
    const originX = menuLayout.x + menuLayout.width / 2;
    const originY = menuLayout.y + menuLayout.height / 2;
    setTheme(id, originX, originY);
  };

  const themes: { id: ThemeId; color: string; Icon: any }[] = [
    { id: 'dark', color: '#666666', Icon: Moon },
    { id: 'light', color: '#f7f7f5', Icon: Sun },
    { id: 'lava', color: '#dc7b26', Icon: Flame },
    { id: 'amoled', color: '#320047ff', Icon: Eclipse },
    { id: 'terminal', color: '#036419ff', Icon: Terminal },
    { id: 'ocean', color: '#1757b8', Icon: Waves },
  ];

  const currentThemeColor = themes.find(t => t.id === theme)?.color || '#222222';
  const POPUP_WIDTH = 340;
  const windowWidth = Dimensions.get('window').width;
  const hasLeftSpace = menuLayout.x >= POPUP_WIDTH;

  const popupStyle = hasLeftSpace
    ? { right: windowWidth - menuLayout.x + 12, top: menuLayout.y }
    : { right: 24, top: menuLayout.y + menuLayout.height + 12 };

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        onPress={handleFastClick}
        onLongPress={handleLongPress}
        delayLongPress={350}
        className="w-10 h-10 items-center justify-center rounded-full bg-surface border border-border"
        accessibilityLabel={t('theme.change_theme')}
      >
        <Palette size={18} color={useThemeColor('--text')} />
      </TouchableOpacity>

      {/* Tooltip */}
      {showTooltip && (
        <View
          className="absolute bg-surface-elevated border border-border rounded-lg shadow-lg px-3 py-2 z-50"
          style={{ top: 56, right: 0 }}
        >
          <Text className="text-text text-xs whitespace-nowrap">{t('theme.hold_to_select')}</Text>
        </View>
      )}

      {/* Long Press Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable onPress={() => setIsOpen(false)} style={StyleSheet.absoluteFill}>
          <View
            className="absolute border border-border rounded-full shadow-lg p-3 flex-row items-center gap-3"
            style={{
              backgroundColor: currentThemeColor,
              ...popupStyle,
            }}
          >
            {themes.map((th) => {
              const isSelected = theme === th.id;
              const iconColor = th.id === 'light' ? '#000000' : '#ffffff';
              return (
                <TouchableOpacity
                  key={th.id}
                  onPress={() => handleSelect(th.id)}
                  style={{ backgroundColor: th.color }}
                  className={`w-10 h-10 rounded-full items-center justify-center border-2 shadow-sm ${isSelected ? 'border-primary' : 'border-border'}`}
                >
                  <th.Icon size={18} color={iconColor} />
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
