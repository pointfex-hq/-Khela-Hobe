import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faBaseball,
  faBasketball,
  faTableTennisPaddleBall,
  faPlus,
  faPenToSquare,
  faTrashCan,
  faCheck,
  faGears,
  faUsers,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { sportsService } from '../../services/endpoints/sportsService';
import { uploadService } from '../../services/endpoints/uploadService';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';

export const SportsManagementPage = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [formats, setFormats] = useState('');
  const [defaultCapacity, setDefaultCapacity] = useState('14');
  const [description, setDescription] = useState('');
  const [equipmentProvided, setEquipmentProvided] = useState('');
  const [status, setStatus] = useState('Active');
  const [iconKey, setIconKey] = useState('futbol');
  const [customIcon, setCustomIcon] = useState('⚽');
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Delete Dialog State
  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false,
    sport: null,
  });

  const fetchSports = async () => {
    try {
      setLoading(true);
      const res = await sportsService.getSports();
      if (res.success) {
        setSports(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load sports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const openAddModal = () => {
    setEditingSport(null);
    setName('');
    setFormats('');
    setDefaultCapacity('14');
    setDescription('');
    setEquipmentProvided('');
    setStatus('Active');
    setIconKey('futbol');
    setCustomIcon('⚽');
    setIsModalOpen(true);
  };

  const openEditModal = (sport) => {
    setEditingSport(sport);
    setName(sport.name);
    setFormats(sport.formats);
    setDefaultCapacity(sport.defaultCapacity?.toString() || '14');
    setDescription(sport.description || '');
    setEquipmentProvided(sport.equipmentProvided || '');
    setStatus(sport.status || 'Active');
    setIconKey(sport.iconKey || 'futbol');
    setCustomIcon(sport.iconUrl || '⚽');
    setIsModalOpen(true);
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastService.error('Icon image must be 2 MB or smaller.');
      return;
    }
    setUploadingIcon(true);
    try {
      const res = await uploadService.uploadImage(file, 'sports-icons');
      if (res?.url) {
        setCustomIcon(res.url);
        toastService.success('Custom sport icon uploaded!');
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to upload custom icon.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toastService.error('Please enter a sport name.');
      return;
    }

    try {
      setSubmitting(true);
      const fallbackEmojiMap = {
        futbol: '⚽',
        baseball: '🏏',
        basketball: '🏀',
        'table-tennis-paddle-ball': '🏸',
      };
      const resolvedIconUrl = customIcon.trim() || fallbackEmojiMap[iconKey] || '⚽';
      const payload = {
        name: name.trim(),
        formats: formats.trim() || 'Standard format',
        defaultCapacity: parseInt(defaultCapacity, 10) || 10,
        description: description.trim(),
        equipmentProvided: equipmentProvided.trim(),
        status,
        iconKey,
        iconUrl: resolvedIconUrl,
      };

      if (editingSport) {
        const res = await sportsService.updateSport(editingSport.id, payload);
        if (res.success) {
          toastService.success(res.message);
          setIsModalOpen(false);
          fetchSports();
        }
      } else {
        const res = await sportsService.createSport(payload);
        if (res.success) {
          toastService.success(res.message);
          setIsModalOpen(false);
          fetchSports();
        }
      }
    } catch {
      toastService.error('Failed to save sport.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (sport) => {
    setDeleteDialogState({
      isOpen: true,
      sport,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogState.sport) return;

    try {
      const res = await sportsService.deleteSport(deleteDialogState.sport.id);
      if (res.success) {
        toastService.success(res.message);
        fetchSports();
      }
    } catch {
      toastService.error('Failed to remove sport.');
    } finally {
      setDeleteDialogState({ isOpen: false, sport: null });
    }
  };

  const getSportIcon = (key) => {
    switch (key) {
      case 'baseball':
      case 'cricket':
        return faBaseball;
      case 'basketball':
        return faBasketball;
      case 'table-tennis-paddle-ball':
      case 'badminton':
      case 'table-tennis':
        return faTableTennisPaddleBall;
      case 'futbol':
      default:
        return faFutbol;
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl w-full mx-auto pb-16">
      {/* Header Bar (Reference lines 184-190 in UIUX/sports_management/code.html) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
            Sports Catalogue
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Configure playable sports, team formats, and default capacity rules across Bangladesh.
          </p>
        </div>

        <Button variant="primary" size="md" icon={faPlus} onClick={openAddModal}>
          Add Sport
        </Button>
      </div>

      {/* Sports Grid (Reference lines 192-240) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px]">
          <LoadingSpinner size="lg" text="Loading sports catalog..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => {
            const icon = getSportIcon(sport.iconKey);
            const isActive = sport.status === 'Active';

            return (
              <article
                key={sport.id}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center text-lg shadow-inner overflow-hidden">
                      {sport.iconUrl && /^https?:\/\//i.test(sport.iconUrl) ? (
                        <img src={sport.iconUrl} alt={sport.name} className="w-7 h-7 object-contain" />
                      ) : sport.iconUrl ? (
                        <span className="text-xl leading-none">{sport.iconUrl}</span>
                      ) : (
                        <FontAwesomeIcon icon={icon} />
                      )}
                    </span>
                    <Badge variant={isActive ? 'success' : 'secondary'} size="sm" hasDot={isActive}>
                      {sport.status}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                      {sport.name}
                    </h2>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-1">
                      {sport.formats} • Default cap: {sport.defaultCapacity}
                    </p>
                  </div>

                  {sport.description && (
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted line-clamp-2">
                      {sport.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono text-light-muted dark:text-dark-muted pt-2 border-t border-light-border dark:border-dark-border">
                    <span>{sport.totalMatches || 0} Matches Held</span>
                    <span>Cap: {sport.defaultCapacity} Players</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-light-border dark:border-dark-border">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={faPenToSquare}
                    onClick={() => openEditModal(sport)}
                  >
                    Edit Sport
                  </Button>
                  <button
                    type="button"
                    onClick={() => openDeleteDialog(sport)}
                    className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center text-light-muted dark:text-dark-muted hover:border-error hover:text-error transition-colors"
                    aria-label={`Delete ${sport.name}`}
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Sport Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSport ? `Edit Sport: ${editingSport.name}` : 'Add New Sport to Catalog'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="sportName" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
              Sport Name
            </label>
            <input
              id="sportName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Futsal 5v5"
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="sportFormats" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Play Formats
              </label>
              <input
                id="sportFormats"
                type="text"
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
                placeholder="e.g. 5v5, 7v7, 11v11"
                className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sportCapacity" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Default Player Capacity
              </label>
              <input
                id="sportCapacity"
                type="number"
                min="2"
                max="50"
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(e.target.value)}
                className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="sportIconKey" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Default Category
              </label>
              <select
                id="sportIconKey"
                value={iconKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setIconKey(val);
                  const map = {
                    futbol: '⚽',
                    baseball: '🏏',
                    basketball: '🏀',
                    'table-tennis-paddle-ball': '🏸',
                  };
                  if (map[val] && (!customIcon || Object.values(map).includes(customIcon))) {
                    setCustomIcon(map[val]);
                  }
                }}
                className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="futbol">Football / Futsal</option>
                <option value="baseball">Cricket</option>
                <option value="table-tennis-paddle-ball">Badminton / Table Tennis</option>
                <option value="basketball">Basketball</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sportStatus" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Status
              </label>
              <select
                id="sportStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="sportCustomIcon" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
              Custom Icon (Emoji, Symbol, Image URL, or Upload)
            </label>
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex items-center justify-center shrink-0 overflow-hidden">
                {customIcon && /^https?:\/\//i.test(customIcon) ? (
                  <img src={customIcon} alt="Custom icon" className="w-7 h-7 object-contain" />
                ) : (
                  <span className="text-xl leading-none">{customIcon || '⚽'}</span>
                )}
              </span>
              <input
                id="sportCustomIcon"
                type="text"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder="Paste emoji (e.g. 🏐, 🎾) or https://... icon URL"
                className="flex-1 px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleIconUpload}
                disabled={uploadingIcon}
                className="text-xs font-body text-light-muted dark:text-dark-muted file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-light-border dark:file:border-dark-border file:bg-light-surface-elevated dark:file:bg-dark-surface-elevated file:font-label file:text-xs"
              />
              {uploadingIcon && <span className="text-xs text-primary font-label">Uploading...</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sportDescription" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
              Catalog Description
            </label>
            <textarea
              id="sportDescription"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of turf specifications, court requirements, etc."
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting} icon={faCheck}>
              {editingSport ? 'Save Changes' : 'Create Sport'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogState.isOpen}
        onClose={() => setDeleteDialogState({ isOpen: false, sport: null })}
        onConfirm={handleConfirmDelete}
        title={`Remove ${deleteDialogState.sport?.name}?`}
        message={`Are you sure you want to remove "${deleteDialogState.sport?.name}" from the active platform sports catalog? New matches will not be able to select this sport.`}
        confirmText="Remove Sport"
        confirmVariant="danger"
      />
    </div>
  );
};

export default SportsManagementPage;
