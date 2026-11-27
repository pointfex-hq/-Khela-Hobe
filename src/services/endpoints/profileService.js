import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeUser, toBackendSkillLevel } from '../../utils/dtoMappers';
import { uploadService } from './uploadService';
import { useAppStore } from '../../store/useAppStore';

function buildUpdateProfilePayload(payload = {}) {
  const dto = {};
  const fullName = payload.fullName ?? payload.name;
  if (fullName !== undefined && String(fullName).trim()) dto.fullName = String(fullName).trim();

  const profileImageUrl = payload.profileImageUrl ?? payload.avatar;
  if (profileImageUrl !== undefined && profileImageUrl !== null && String(profileImageUrl).trim()) {
    dto.profileImageUrl = String(profileImageUrl).trim();
  }

  if (payload.bio !== undefined) dto.bio = payload.bio;
  if (payload.city !== undefined) dto.city = payload.city;
  if (payload.area !== undefined) dto.area = payload.area;

  const phoneNumber = payload.phoneNumber ?? payload.phone;
  if (phoneNumber !== undefined) {
    const cleaned = String(phoneNumber || '').trim().replace(/[\s-]/g, '');
    dto.phoneNumber = cleaned || null;
  }

  if (payload.dateOfBirth !== undefined && payload.dateOfBirth) {
    dto.dateOfBirth = payload.dateOfBirth;
  }

  const skill = payload.primarySkillLevel ?? payload.skillLevel;
  if (skill) {
    dto.primarySkillLevel = toBackendSkillLevel(skill);
  }

  if (Array.isArray(payload.sportsPreferences)) {
    dto.sportsPreferences = payload.sportsPreferences
      .filter((s) => s?.sportId)
      .map((s) => ({
        sportId: s.sportId,
        skillLevel: toBackendSkillLevel(s.skillLevel || skill || 'INTERMEDIATE'),
        preferredPosition: (s.preferredPosition || s.preferredFormat || '').trim() || null,
      }));
  }
  return dto;
}

/**
 * Profile Management Service — backed by /users/me and /uploads
 */
export const profileService = {
  getMe: async () => {
    const response = await apiClient.get('/users/me');
    const normalized = normalizeUser(unwrapEnvelope(response));
    if (normalized) useAppStore.getState().setCachedUser(normalized);
    return { success: true, data: normalized };
  },

  getPlayerProfile: async (id) => {
    const path = !id || id === 'me' ? '/users/me' : `/users/${id}`;
    const response = await apiClient.get(path);
    const normalized = normalizeUser(unwrapEnvelope(response));
    if ((!id || id === 'me') && normalized) useAppStore.getState().setCachedUser(normalized);
    return { success: true, data: normalized };
  },

  updatePlayerProfile: async (payload) => {
    const dto = buildUpdateProfilePayload(payload);
    const response = await apiClient.patch('/users/me', dto);
    const normalized = normalizeUser(unwrapEnvelope(response));
    if (normalized) useAppStore.getState().setCachedUser(normalized);
    return {
      success: true,
      data: normalized,
      message: 'Profile changes saved successfully.',
    };
  },

  getOrganizerProfile: async (id) => {
    const path = !id || id === 'me' ? '/users/me' : `/users/${id}`;
    const response = await apiClient.get(path);
    return { success: true, data: normalizeUser(unwrapEnvelope(response)) };
  },

  updateOrganizerProfile: async (payload) => {
    const dto = buildUpdateProfilePayload(payload);
    const response = await apiClient.patch('/users/me', dto);
    return {
      success: true,
      data: normalizeUser(unwrapEnvelope(response)),
      message: 'Organizer profile updated successfully.',
    };
  },

  uploadProfileImage: async (file) => {
    const res = await uploadService.uploadImage(file, 'avatars');
    return {
      success: true,
      url: res.url,
      key: res.key,
      message: 'Profile picture uploaded to storage.',
    };
  },

  toggleParentalControl: async (enabled) => {
    const response = await apiClient.patch('/users/me', {
      parentalControlEnabled: Boolean(enabled),
    });
    const normalized = normalizeUser(unwrapEnvelope(response));
    if (normalized) useAppStore.getState().setCachedUser(normalized);
    return {
      success: true,
      data: normalized,
      message: enabled
        ? 'Parental Control enabled! Guardian oversight tools are now unlocked.'
        : 'Parental Control turned off.',
    };
  },

  toggleQuickMatchHost: async (enabled) => {
    const response = await apiClient.patch('/users/me', {
      quickMatchHostEnabled: Boolean(enabled),
    });
    const normalized = normalizeUser(unwrapEnvelope(response));
    if (normalized) useAppStore.getState().setCachedUser(normalized);
    return {
      success: true,
      data: normalized,
      message: enabled
        ? 'Quick Match Host mode enabled! You can now create quick matches and review applications.'
        : 'Quick Match Host mode turned off.',
    };
  },

  applyForOrganizer: async (payload = {}) => {
    const response = await apiClient.post('/users/me/apply-organizer', payload);
    const normalized = normalizeUser(unwrapEnvelope(response));
    if (normalized) useAppStore.getState().setCachedUser(normalized);
    return {
      success: true,
      data: normalized,
      message: 'Full Organizer application submitted for Admin approval!',
    };
  },

  deleteMyAccount: async () => {
    await apiClient.delete('/users/me');
    useAppStore.getState().clearCachedUser();
    return {
      success: true,
      message: 'Your account has been permanently deleted.',
    };
  },
};

export default profileService;
