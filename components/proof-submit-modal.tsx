import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/design-tokens';
import { MeterBar } from '@/components/system-shell';
import { LiquidGlass } from '@/components/liquid-glass';
import { uploadProofPhoto, type ProofPhotoUpload } from '@/lib/proof-storage';
import type { Quest } from '@/lib/types';

interface ProofSubmitModalProps {
  quest: Quest | null;
  visible: boolean;
  isProcessing: boolean;
  reviewMessage?: string | null;
  onClose: () => void;
  onSubmit: (proof: string) => Promise<boolean>;
}

const confidenceOptions = ['LOW', 'SOLID', 'HIGH'] as const;

function getProofHint(quest: Quest) {
  const type = String(quest.verification_type || 'text').toUpperCase();
  if (type === 'GITHUB') return 'You cannot downgrade this. Provide the repository and a specific commit or pull request.';
  if (type === 'URL') return 'Provide a public or shareable artifact link and explain what the system should inspect.';
  if (type === 'FITBIT') return 'Provide traceable activity data: source, duration, distance, heart-rate zone, steps, or workout log.';
  if (type === 'PHOTO') return 'Provide a contextual photo reference with timestamp, equipment, or before/after state.';
  return 'Provide concrete written evidence with measurable details and completion notes.';
}

function getEvidenceLabel(quest: Quest) {
  const type = String(quest.verification_type || 'text').toUpperCase();
  if (type === 'GITHUB') return 'Repository / Commit URL';
  if (type === 'URL') return 'Shareable Artifact URL';
  if (type === 'FITBIT') return 'Activity Source / Metric';
  if (type === 'PHOTO') return 'Photo Reference';
  return 'Evidence Reference';
}

function getEvidencePlaceholder(quest: Quest) {
  const type = String(quest.verification_type || 'text').toUpperCase();
  if (type === 'GITHUB') return 'https://github.com/user/repo + commit or PR URL';
  if (type === 'URL') return 'Shareable artifact URL, document URL, published link, or demo URL...';
  if (type === 'FITBIT') return 'Fitbit/activity URL, workout ID, screenshot note, device source...';
  if (type === 'PHOTO') return 'Photo reference plus what it shows and when it was captured...';
  return 'Evidence reference, note, artifact title, or exact output...';
}

function getMetricPlaceholder(quest: Quest) {
  const type = String(quest.verification_type || 'text').toUpperCase();
  if (type === 'GITHUB') return 'Files changed, commits, tests passed, issue closed...';
  if (type === 'FITBIT') return 'Duration, distance, steps, calories, sets, reps, heart-rate zone...';
  if (type === 'PHOTO') return 'Quantity, duration, before/after count, completed set...';
  return '45 minutes, 800 words, 3 commits, 5 sets...';
}

function includesUrl(value: string) {
  return /https?:\/\/\S+/i.test(value) || /\b\w+\.\w{2,}\S*/i.test(value);
}

function getClientMissing(type: string, summary: string, evidence: string, metric: string, friction: string, hasPhotoUpload = false) {
  const missing: string[] = [];
  const cleanSummary = summary.trim();
  const cleanEvidence = evidence.trim();
  const cleanMetric = metric.trim();
  const cleanFriction = friction.trim();

  if (cleanSummary.length < 12) missing.push('a short completion summary');

  if (type === 'GITHUB') {
    if (!/github\.com/i.test(cleanEvidence)) missing.push('a GitHub repository link');
    if (!/(commit|pull|\/pr\/|\/commit\/|branch)/i.test(cleanEvidence)) missing.push('a specific commit, PR, or branch reference');
    if (cleanMetric.length < 3) missing.push('files changed, tests, issue closed, or another measurable code result');
  } else if (type === 'URL') {
    if (!includesUrl(cleanEvidence)) missing.push('a shareable artifact URL');
    if (cleanSummary.length < 20) missing.push('what the URL proves');
  } else if (type === 'FITBIT') {
    if (cleanEvidence.length < 6) missing.push('fitness source, activity reference, or device note');
    if (cleanMetric.length < 3) missing.push('duration, distance, steps, heart-rate zone, sets, or reps');
  } else if (type === 'PHOTO') {
    if (!hasPhotoUpload) missing.push('uploaded photo evidence');
    if (cleanEvidence.length < 6) missing.push('photo context or upload note');
    if (cleanMetric.length < 3) missing.push('visible result, timestamp, count, duration, or before/after detail');
  } else {
    if (cleanSummary.length < 20) missing.push('specific written evidence');
    if (cleanMetric.length < 3 && cleanFriction.length < 10) missing.push('a measurable result or hard-to-fake detail');
  }

  return missing;
}

function getReviewDetails(message?: string | null) {
  if (!message || (!message.includes('[ PROOF REJECTED ]') && !message.includes('[ SYSTEM ERROR ]'))) return null;
  return message
    .replace('[ PROOF REJECTED ]', 'Proof rejected')
    .replace('[ SYSTEM ERROR ]', 'System error')
    .trim();
}

export const ProofSubmitModal: React.FC<ProofSubmitModalProps> = ({
  quest,
  visible,
  isProcessing,
  reviewMessage,
  onClose,
  onSubmit,
}) => {
  const [summary, setSummary] = useState('');
  const [evidence, setEvidence] = useState('');
  const [metric, setMetric] = useState('');
  const [friction, setFriction] = useState('');
  const [confidence, setConfidence] = useState<(typeof confidenceOptions)[number]>('SOLID');
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<ProofPhotoUpload | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const activeProofType = String(quest?.verification_type || 'text').toUpperCase();

  // Reset form inputs whenever the modal becomes visible or the quest changes
  React.useEffect(() => {
    if (visible) {
      setSummary('');
      setEvidence('');
      setMetric('');
      setFriction('');
      setConfidence('SOLID');
      setPhotoAsset(null);
      setUploadedPhoto(null);
      setPhotoUploadError(null);
    }
  }, [visible, quest?.id]);

  const proofStrength = useMemo(() => {
    let score = 0;
    if (summary.trim().length >= 20) score += 35;
    if (activeProofType === 'PHOTO') {
      if (photoAsset || uploadedPhoto) score += 25;
    } else if (evidence.trim().length >= 8) {
      score += 25;
    }
    if (metric.trim().length >= 3) score += 20;
    if (friction.trim().length >= 10) score += 10;
    if (confidence === 'HIGH') score += 10;
    if (confidence === 'LOW') score -= 10;
    return Math.max(0, Math.min(100, score));
  }, [activeProofType, summary, evidence, metric, friction, confidence, photoAsset, uploadedPhoto]);

  if (!visible || !quest) return null;

  const sheetMaxHeight = Dimensions.get('window').height * 0.92;
  const scrollMaxHeight = Dimensions.get('window').height * 0.52;

  const isRequired = quest.verification_required;
  const proofType = String(quest.verification_type || 'text').toUpperCase();
  const isPhotoProof = proofType === 'PHOTO';
  const clientMissing = isRequired ? getClientMissing(proofType, summary, evidence, metric, friction, !!photoAsset || !!uploadedPhoto) : [];
  const canSubmit = !isProcessing && !isUploadingPhoto && clientMissing.length === 0;
  const reviewDetails = getReviewDetails(reviewMessage);
  const strengthColor =
    proofStrength >= 75 ? COLORS.NEON_GREEN : proofStrength >= 45 ? COLORS.NEON_CYAN : proofStrength >= 25 ? COLORS.NEON_GOLD : COLORS.NEON_RED;

  const pickPhoto = async () => {
    setPhotoUploadError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoUploadError('Photo library access is required to upload photo proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.86,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.type && asset.type !== 'image') {
      setPhotoUploadError('Only image files can be used as photo proof.');
      return;
    }

    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      setPhotoUploadError('Photo proof must be 10 MB or smaller.');
      return;
    }

    setPhotoAsset(asset);
    setUploadedPhoto(null);
  };

  const submitProof = async () => {
    const cleanEvidence = evidence.trim();
    let proofPhoto = uploadedPhoto;

    if (isPhotoProof) {
      if (!photoAsset && !proofPhoto) {
        setPhotoUploadError('Upload a photo before transmitting this proof.');
        return;
      }

      if (!proofPhoto && photoAsset) {
        setIsUploadingPhoto(true);
        setPhotoUploadError(null);
        const upload = await uploadProofPhoto(quest.id, photoAsset);
        setIsUploadingPhoto(false);

        if (!upload.success || !upload.data) {
          setPhotoUploadError(upload.error || 'Photo upload failed.');
          return;
        }

        proofPhoto = upload.data;
        setUploadedPhoto(upload.data);
      }
    }

    const proofMeta =
      proofType === 'URL' && cleanEvidence
        ? [
            `Required reality signal: URL`,
            `Reality anchor: URL signal present`,
            `Reality anchor URL: ${cleanEvidence}`,
          ]
        : proofType === 'PHOTO' && proofPhoto
          ? [
              `Required reality signal: PHOTO`,
              `Reality anchor: photo upload present`,
              `Uploaded photo URL: ${proofPhoto.url}`,
              `Uploaded photo path: ${proofPhoto.path}`,
              `Uploaded photo file: ${proofPhoto.fileName}`,
              `Uploaded photo MIME: ${proofPhoto.mimeType}`,
              `Uploaded photo dimensions: ${proofPhoto.width || 'unknown'}x${proofPhoto.height || 'unknown'}`,
            ]
        : [`Required reality signal: ${proofType}`];

    const proof = [
      `Quest: ${quest.title}`,
      `Verification type: ${proofType}`,
      ...proofMeta,
      `Structured proof fields:`,
      `- Completion summary: ${summary.trim() || 'Not provided'}`,
      `- ${getEvidenceLabel(quest)}: ${cleanEvidence || proofPhoto?.fileName || 'Not provided'}`,
      `- Metric or measurable result: ${metric.trim() || 'Not provided'}`,
      `- Hard-to-fake detail: ${friction.trim() || 'Not provided'}`,
      `Self confidence: ${confidence}`,
      `Client proof strength estimate: ${proofStrength}/100`,
    ].join('\n');

    const accepted = await onSubmit(proof);
    if (accepted) {
      setSummary('');
      setEvidence('');
      setMetric('');
      setFriction('');
      setConfidence('SOLID');
      setPhotoAsset(null);
      setUploadedPhoto(null);
      setPhotoUploadError(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <Pressable style={styles.backdropTap} onPress={onClose} disabled={isProcessing} accessibilityLabel="Close proof modal" />
        <LiquidGlass
          variant="strong"
          style={[styles.sheet, { maxHeight: sheetMaxHeight }]}
          contentStyle={styles.sheetContent}
          interactive
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>VERIFICATION PROTOCOL</Text>
              <Text style={styles.title} numberOfLines={2}>{quest.title}</Text>
              <Text style={styles.subtitle}>
                Required payload: <Text style={styles.goldText}>{proofType}</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isProcessing} accessibilityLabel="Close proof modal">
              <MaterialCommunityIcons name="close" size={18} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Proof is assigned by NYXIS</Text>
              <Text style={styles.noticeText}>{getProofHint(quest)}</Text>
            </View>

            {reviewDetails && (
              <View style={styles.reviewPanel}>
                <View style={styles.reviewHeader}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.NEON_RED} />
                  <Text style={styles.reviewTitle}>Verification Result</Text>
                </View>
                <Text style={styles.reviewText}>{reviewDetails}</Text>
              </View>
            )}

            {photoUploadError && (
              <View style={styles.reviewPanel}>
                <View style={styles.reviewHeader}>
                  <MaterialCommunityIcons name="image-off-outline" size={16} color={COLORS.NEON_RED} />
                  <Text style={styles.reviewTitle}>Photo Upload</Text>
                </View>
                <Text style={styles.reviewText}>{photoUploadError}</Text>
              </View>
            )}

            <View style={styles.questPanel}>
              <Text style={styles.questDesc}>{quest.description}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>TYPE {quest.type}</Text>
                <Text style={styles.badge}>XP +{quest.xp_reward}</Text>
                <Text style={styles.badge}>STAT {quest.stat_focus}</Text>
              </View>
            </View>

            <ProofField label="What did you complete?" sub="Plain language. One concrete outcome.">
              <TextInput
                style={[styles.input, styles.multiInput]}
                placeholder="Specific outcome, artifact, or action completed..."
                placeholderTextColor={COLORS.TEXT_DIM}
                value={summary}
                onChangeText={setSummary}
                multiline
                editable={!isProcessing}
                selectionColor={COLORS.NEON_CYAN}
              />
            </ProofField>

            <ProofField label={getEvidenceLabel(quest)} sub="Evidence required">
              {isPhotoProof && (
                <View style={styles.photoUploadPanel}>
                  {photoAsset ? (
                    <Image source={{ uri: photoAsset.uri }} style={styles.photoPreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.photoEmpty}>
                      <MaterialCommunityIcons name="image-plus" size={24} color={COLORS.NEON_CYAN} />
                    </View>
                  )}
                  <View style={styles.photoUploadCopy}>
                    <Text style={styles.photoUploadTitle}>
                      {photoAsset ? photoAsset.fileName || 'Photo selected' : 'Upload photo proof'}
                    </Text>
                    <Text style={styles.photoUploadText}>
                      {uploadedPhoto
                        ? 'Uploaded and ready for verification.'
                        : photoAsset
                          ? 'Selected. It will upload when you transmit proof.'
                          : 'Attach the visible result, equipment, before/after state, or timestamped evidence.'}
                    </Text>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={pickPhoto}
                      disabled={isProcessing || isUploadingPhoto}
                    >
                      <MaterialCommunityIcons name={photoAsset ? 'image-refresh-outline' : 'image-plus'} size={15} color={COLORS.BG_PRIMARY} />
                      <Text style={styles.photoButtonText}>{photoAsset ? 'Replace Photo' : 'Select Photo'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <TextInput
                style={styles.input}
                placeholder={getEvidencePlaceholder(quest)}
                placeholderTextColor={COLORS.TEXT_DIM}
                value={evidence}
                onChangeText={setEvidence}
                editable={!isProcessing}
                autoCapitalize="none"
                selectionColor={COLORS.NEON_CYAN}
              />
            </ProofField>

            <ProofField label="Measurable result" sub="Numbers, output, before/after">
              <TextInput
                style={styles.input}
                placeholder={getMetricPlaceholder(quest)}
                placeholderTextColor={COLORS.TEXT_DIM}
                value={metric}
                onChangeText={setMetric}
                editable={!isProcessing}
                selectionColor={COLORS.NEON_CYAN}
              />
            </ProofField>

            <ProofField label="What made it real?" sub="Hard-to-fake detail">
              <TextInput
                style={[styles.input, styles.multiInput]}
                placeholder="Obstacle, decision, tradeoff, or detail that makes this hard to fake..."
                placeholderTextColor={COLORS.TEXT_DIM}
                value={friction}
                onChangeText={setFriction}
                multiline
                editable={!isProcessing}
                selectionColor={COLORS.NEON_CYAN}
              />
            </ProofField>

            <ProofField label="Confidence" sub="Self-assessed strength">
              <View style={styles.segmented}>
                {confidenceOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.segment, confidence === option && styles.segmentActive]}
                    onPress={() => setConfidence(option)}
                    disabled={isProcessing}
                  >
                    <Text style={[styles.segmentText, confidence === option && styles.segmentTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ProofField>

            {clientMissing.length > 0 && (
              <View style={styles.requirementBox}>
                <MaterialCommunityIcons name="alert-outline" size={14} color={COLORS.NEON_GOLD} />
                <Text style={styles.requirement}>
                  Missing before submit: {clientMissing.join(', ')}.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.MD) + SPACING.SM }]}>
            <View style={styles.strengthHeader}>
              <View>
                <Text style={styles.strengthLabel}>Evidence Strength</Text>
                <Text style={styles.strengthHint}>Updates as you write</Text>
              </View>
              <Text style={[styles.strengthValue, { color: strengthColor }]}>{proofStrength}%</Text>
            </View>
            <MeterBar value={proofStrength} color={strengthColor} />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
                onPress={submitProof}
                disabled={!canSubmit}
              >
                {isProcessing || isUploadingPhoto ? (
                  <ActivityIndicator color={COLORS.BG_PRIMARY} />
                ) : (
                  <Text style={styles.submitText}>Transmit</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isProcessing}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LiquidGlass>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function ProofField({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subLabel}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.mixVoid(0.88),
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: COLORS.NEON_CYAN,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: COLORS.NEON_CYAN,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    letterSpacing: TYPOGRAPHY.SPACING.ULTRA,
    marginBottom: SPACING.XS,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.LARGE,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    lineHeight: 20,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    marginTop: SPACING.XS,
  },
  goldText: {
    color: COLORS.NEON_GOLD,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
  },
  notice: {
    borderWidth: 1,
    borderColor: COLORS.alpha(COLORS.NEON_GOLD, 0.34),
    backgroundColor: COLORS.alpha(COLORS.NEON_GOLD, 0.055),
    borderRadius: 18,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  noticeTitle: {
    color: COLORS.NEON_GOLD,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
    marginBottom: SPACING.XS,
  },
  noticeText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    lineHeight: 15,
  },
  reviewPanel: {
    borderWidth: 1,
    borderColor: COLORS.alpha(COLORS.NEON_RED, 0.42),
    backgroundColor: COLORS.alpha(COLORS.NEON_RED, 0.055),
    borderRadius: 18,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  reviewTitle: {
    color: COLORS.NEON_RED,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
  },
  reviewText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    lineHeight: 16,
  },
  questPanel: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: COLORS.alpha(COLORS.TEXT_PRIMARY, 0.035),
    borderRadius: 18,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  questDesc: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    lineHeight: 18,
    marginBottom: SPACING.MD,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  badge: {
    color: COLORS.NEON_CYAN,
    backgroundColor: 'rgba(0, 210, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.22)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    fontSize: TYPOGRAPHY.SIZE.MICRO,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
  },
  field: {
    marginBottom: SPACING.MD,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  label: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
    flex: 1,
  },
  subLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.MICRO,
    textAlign: 'right',
  },
  input: {
    backgroundColor: COLORS.alpha(COLORS.BG_VOID, 0.24),
    borderWidth: 1,
    borderColor: COLORS.alpha(COLORS.TEXT_PRIMARY, 0.12),
    borderRadius: 16,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    padding: SPACING.MD,
  },
  multiInput: {
    minHeight: 64,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  photoUploadPanel: {
    flexDirection: 'row',
    gap: SPACING.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    backgroundColor: COLORS.alpha(COLORS.TEXT_PRIMARY, 0.035),
    padding: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  photoPreview: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  photoEmpty: {
    width: 82,
    height: 82,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  photoUploadCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.XS,
  },
  photoUploadTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  photoUploadText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    lineHeight: 15,
  },
  photoButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    borderRadius: 14,
    backgroundColor: COLORS.mixGlass(0.35),
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginTop: SPACING.XS,
  },
  photoButtonText: {
    color: COLORS.BG_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.MICRO,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
  },
  segmented: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.alpha(COLORS.TEXT_PRIMARY, 0.035),
  },
  segmentActive: {
    borderColor: COLORS.NEON_CYAN,
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
  },
  segmentText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
  },
  segmentTextActive: {
    color: COLORS.NEON_CYAN,
  },
  requirementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  requirement: {
    color: COLORS.NEON_GOLD,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    lineHeight: 15,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: COLORS.alpha(COLORS.BG_VOID, 0.55),
    paddingTop: SPACING.MD,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.SM,
  },
  strengthLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
  },
  strengthHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    marginTop: SPACING.XS,
  },
  strengthValue: {
    fontFamily: TYPOGRAPHY.MONO,
    fontSize: TYPOGRAPHY.SIZE.HEADING,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginTop: SPACING.MD,
  },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.NEON_CYAN,
    paddingVertical: SPACING.MD,
  },
  submitDisabled: {
    backgroundColor: COLORS.TEXT_MUTED,
  },
  submitText: {
    color: COLORS.BG_VOID,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
  },
  cancelButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  cancelText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    textTransform: 'uppercase',
  },
});
