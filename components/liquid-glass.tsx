import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GLASS, GLASS_TINT, RADIUS } from '@/constants/design-tokens';

export type GlassVariant = 'subtle' | 'default' | 'strong' | 'bar';
export type GlassTint = 'none' | 'cyan' | 'magenta' | 'gold';

interface LiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accent?: string;
  variant?: GlassVariant;
  tint?: GlassTint;
  radius?: number;
  interactive?: boolean;
}

type GlassPreset = (typeof GLASS)[GlassVariant];

type WebGlassStyle = ViewStyle & {
  backdropFilter?: string;
  WebkitBackdropFilter?: string;
};

function webGlassStyle(preset: GlassPreset, radius: number): WebGlassStyle {
  const px = preset.webBlurPx;
  return {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius,
    overflow: 'hidden',
    backgroundColor: preset.fill,
    backdropFilter: `blur(${px}px) saturate(180%) contrast(1.04)`,
    WebkitBackdropFilter: `blur(${px}px) saturate(180%) contrast(1.04)`,
  };
}

/**
 * Single frosted layer — never stack blur + scrim + fill (that reads opaque).
 */
function GlassFrost({ preset, radius }: { preset: GlassPreset; radius: number }) {
  if (Platform.OS === 'web') {
    return <View pointerEvents="none" style={webGlassStyle(preset, radius)} />;
  }

  return (
    <>
      <BlurView
        pointerEvents="none"
        intensity={preset.blurIntensity}
        tint="systemUltraThinMaterialDark"
        {...(Platform.OS === 'android'
          ? {
              experimentalBlurMethod: 'dimezisBlurView' as const,
              blurReductionFactor: 3,
            }
          : {})}
        style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, overflow: 'hidden', backgroundColor: preset.fill },
        ]}
      />
    </>
  );
}

function GlassEdgeRefraction({ radius, strength }: { radius: number; strength: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <LinearGradient
        colors={[
          COLORS.alpha(COLORS.NEON_CYAN, strength * 0.85),
          COLORS.alpha(COLORS.NEON_CYAN, strength * 0.3),
          'transparent',
        ]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.35 }}
        style={styles.edgeTop}
      />
      <LinearGradient
        colors={['transparent', COLORS.alpha(COLORS.NEON_MAGENTA, strength * 0.7)]}
        start={{ x: 0.3, y: 0.6 }}
        end={{ x: 1, y: 1 }}
        style={styles.edgeBottomRight}
      />
    </View>
  );
}

function GlassSpecular({ radius, strength }: { radius: number; strength: number }) {
  if (strength <= 0) return null;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        COLORS.alpha(COLORS.NEON_CYAN, strength),
        COLORS.alpha(COLORS.NEON_CYAN, strength * 0.3),
        'transparent',
        'transparent',
      ]}
      locations={[0, 0.12, 0.38, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.75 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
    />
  );
}

function GlassInsets({
  radius,
  top,
  bottom,
  cyan,
  magenta,
}: {
  radius: number;
  top: number;
  bottom: number;
  cyan: number;
  magenta: number;
}) {
  if (top <= 0 && bottom <= 0 && cyan <= 0 && magenta <= 0) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      {top > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 1,
            backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, top),
          }}
        />
      )}
      {bottom > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            backgroundColor: COLORS.mixVoid(bottom),
          }}
        />
      )}
      {cyan > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, cyan),
          }}
        />
      )}
      {magenta > 0 && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: COLORS.alpha(COLORS.NEON_MAGENTA, magenta),
          }}
        />
      )}
    </View>
  );
}

function ChromaticRefraction({
  radius,
  opacity,
  cyanPct,
  magentaPct,
}: {
  radius: number;
  opacity: number;
  cyanPct: number;
  magentaPct: number;
}) {
  if (opacity <= 0) return null;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        COLORS.alpha(COLORS.NEON_CYAN, cyanPct),
        'transparent',
        'transparent',
        COLORS.alpha(COLORS.NEON_MAGENTA, magentaPct),
      ]}
      locations={[0, 0.32, 0.68, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, { borderRadius: radius, opacity }]}
    />
  );
}

export function LiquidGlass({
  children,
  style,
  contentStyle,
  accent = COLORS.NEON_CYAN,
  variant = 'default',
  tint = 'none',
  radius = RADIUS.XL,
  interactive = false,
}: LiquidGlassProps) {
  const preset = GLASS[variant];
  const tintPreset = tint !== 'none' ? GLASS_TINT[tint] : null;
  const specular = preset.specular + (interactive ? 0.02 : 0);
  const chromaticOpacity = preset.chromaticOpacity + (interactive ? 0.05 : 0);

  const outerShadow =
    preset.outerShadow !== 'transparent'
      ? {
          shadowColor: interactive ? accent : COLORS.BACKGROUND,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: interactive ? 0.2 : 0.35,
          shadowRadius: 16,
          elevation: 4,
        }
      : interactive
        ? {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }
        : {};

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius: radius,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: preset.border,
        },
        outerShadow,
        style,
      ]}
    >
      <GlassFrost preset={preset} radius={radius} />

      <ChromaticRefraction
        radius={radius}
        opacity={chromaticOpacity}
        cyanPct={preset.chromaticCyan}
        magentaPct={preset.chromaticMagenta}
      />

      {tintPreset && (
        <LinearGradient
          pointerEvents="none"
          colors={[...tintPreset.colors]}
          start={tintPreset.start}
          end={tintPreset.end}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}

      <GlassSpecular radius={radius} strength={specular} />
      <GlassEdgeRefraction radius={radius} strength={specular + 0.05} />

      <GlassInsets
        radius={radius}
        top={preset.insetTop}
        bottom={preset.insetBottom}
        cyan={preset.insetCyan}
        magenta={preset.insetMagenta}
      />

      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function GridBackdrop() {
  return (
    <View pointerEvents="none" style={styles.backdropRoot}>
      <LinearGradient
        colors={[COLORS.GLOW_TEAL, 'transparent', COLORS.GLOW_PURPLE]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowTeal} />
      <View style={styles.glowPurple} />
      <View style={styles.glowMagenta} />
    </View>
  );
}

export const liquidGlassStyles = StyleSheet.create({
  panel: { borderRadius: RADIUS.XL, overflow: 'hidden' },
  compact: { borderRadius: RADIUS.LG, overflow: 'hidden' },
});

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    minHeight: 0,
  },
  edgeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
  },
  edgeBottomRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '48%',
    height: '42%',
  },
  backdropRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BACKGROUND,
  },
  glowTeal: {
    position: 'absolute',
    left: '-32%',
    top: '-15%',
    width: '90%',
    height: '62%',
    borderRadius: 999,
    backgroundColor: COLORS.GLOW_TEAL,
  },
  glowPurple: {
    position: 'absolute',
    right: '-32%',
    top: '5%',
    width: '82%',
    height: '55%',
    borderRadius: 999,
    backgroundColor: COLORS.GLOW_PURPLE,
  },
  glowMagenta: {
    position: 'absolute',
    right: '-20%',
    bottom: '-18%',
    width: '85%',
    height: '58%',
    borderRadius: 999,
    backgroundColor: COLORS.GLOW_MAGENTA,
  },
});
