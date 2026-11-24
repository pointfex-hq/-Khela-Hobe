import apiClient from '../api/apiClient';

let sportsCatalogStore = [
  {
    id: 'sp_football',
    name: 'Football & Futsal',
    slug: 'football',
    iconKey: 'futbol',
    formats: '5v5, 7v7, 11v11',
    defaultCapacity: 14,
    status: 'Active',
    totalMatches: 542,
    description: 'Outdoor turf, futsal cages, and natural grass grounds across Dhaka & Chattogram.',
    equipmentProvided: 'Match ball, referee whistle, corner flags, bibs',
  },
  {
    id: 'sp_badminton',
    name: 'Badminton',
    slug: 'badminton',
    iconKey: 'table-tennis-paddle-ball',
    formats: 'Singles & Doubles',
    defaultCapacity: 4,
    status: 'Active',
    totalMatches: 210,
    description: 'Indoor wooden courts and synthetic mat halls with competition-grade floodlights.',
    equipmentProvided: 'Nylon/feather shuttlecocks, spare racquets',
  },
  {
    id: 'sp_cricket',
    name: 'Cricket',
    slug: 'cricket',
    iconKey: 'baseball',
    formats: 'Tape-ball & Turf',
    defaultCapacity: 16,
    status: 'Active',
    totalMatches: 184,
    description: 'Short boundary turf cricket, taped tennis ball, and leather ball weekend fixtures.',
    equipmentProvided: 'Tape-balls, wooden bats, stumps with bails',
  },
  {
    id: 'sp_basketball',
    name: 'Basketball',
    slug: 'basketball',
    iconKey: 'basketball',
    formats: '3v3 Half-court & 5v5 Full-court',
    defaultCapacity: 10,
    status: 'Active',
    totalMatches: 95,
    description: 'Standard outdoor acrylic courts and university indoor gymnasiums.',
    equipmentProvided: 'Size 7 composite basketballs',
  },
  {
    id: 'sp_table_tennis',
    name: 'Table Tennis',
    slug: 'table-tennis',
    iconKey: 'table-tennis-paddle-ball',
    formats: 'Singles & Doubles',
    defaultCapacity: 4,
    status: 'Active',
    totalMatches: 38,
    description: 'ITTF-standard 25mm indoor boards in local clubs and community halls.',
    equipmentProvided: '3-star 40+ celluloid balls, standard paddles',
  },
];

export const sportsService = {
  /**
   * Get sports catalog list
   */
  getSports: async () => {
    try {
      const response = await apiClient.get('/admin/sports');
      return response.data;
    } catch {
      return {
        success: true,
        data: [...sportsCatalogStore],
        total: sportsCatalogStore.length,
      };
    }
  },

  /**
   * Add a new sport to the catalog
   */
  createSport: async (payload) => {
    try {
      const response = await apiClient.post('/admin/sports', payload);
      return response.data;
    } catch {
      const id = `sp_${Date.now()}`;
      const newSport = {
        id,
        name: payload.name || 'New Sport',
        slug: (payload.name || 'new-sport').toLowerCase().replace(/\s+/g, '-'),
        iconKey: payload.iconKey || 'futbol',
        formats: payload.formats || 'Standard',
        defaultCapacity: parseInt(payload.defaultCapacity || 10, 10),
        status: payload.status || 'Active',
        totalMatches: 0,
        description: payload.description || 'Newly added recreational sport.',
        equipmentProvided: payload.equipmentProvided || 'Standard sports equipment',
      };
      sportsCatalogStore = [newSport, ...sportsCatalogStore];
      return {
        success: true,
        data: newSport,
        message: `Sport "${newSport.name}" created successfully.`,
      };
    }
  },

  /**
   * Update an existing sport
   */
  updateSport: async (id, payload) => {
    try {
      const response = await apiClient.put(`/admin/sports/${id}`, payload);
      return response.data;
    } catch {
      const index = sportsCatalogStore.findIndex((s) => s.id === id);
      if (index !== -1) {
        sportsCatalogStore[index] = {
          ...sportsCatalogStore[index],
          ...payload,
        };
        return {
          success: true,
          data: sportsCatalogStore[index],
          message: `Sport "${sportsCatalogStore[index].name}" updated successfully.`,
        };
      }
      return { success: false, message: 'Sport not found.' };
    }
  },

  /**
   * Delete a sport from the catalog
   */
  deleteSport: async (id) => {
    try {
      const response = await apiClient.delete(`/admin/sports/${id}`);
      return response.data;
    } catch {
      const target = sportsCatalogStore.find((s) => s.id === id);
      sportsCatalogStore = sportsCatalogStore.filter((s) => s.id !== id);
      return {
        success: true,
        message: `Sport "${target?.name || id}" removed from platform catalog.`,
      };
    }
  },
};

export default sportsService;
