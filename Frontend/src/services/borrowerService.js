/**
 * API Service for Borrower Profile
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const borrowerService = {
  /**
   * Save or update borrower profile
   */
  async saveBorrowerProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/borrower/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Profile saved:', data);
      return data;
    } catch (error) {
      console.error('Error saving borrower profile:', error);
      throw error;
    }
  },

  /**
   * Get borrower profile and scores
   */
  async getBorrowerProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/borrower/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Profile doesn't exist
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Profile retrieved:', data);
      return data;
    } catch (error) {
      console.error('Error retrieving borrower profile:', error);
      throw error;
    }
  },

  /**
   * Check if borrower profile exists
   */
  async checkBorrowerProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/borrower/check-profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking borrower profile:', error);
      throw error;
    }
  },
};

export default borrowerService;
