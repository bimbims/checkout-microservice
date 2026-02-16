import axios from 'axios';
import type { Booking, ApiResponse } from '../types';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_API_URL || 'http://localhost:3000';

class BookingReader {
  /**
   * Fetch booking details from main reservation system
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const response = await axios.get<ApiResponse<Booking>>(
        `${MAIN_APP_URL}/api/bookings/${bookingId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Booking not found');
      }

      const booking = response.data.data;

      // Validate booking status
      if (booking.status !== 'APPROVED') {
        throw new Error('Booking is not approved for payment');
      }

      return booking;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch booking:', error.message);
        if (error.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Validate booking ID format
   */
  isValidBookingId(bookingId: string): boolean {
    return /^REQ-\d{13}$/.test(bookingId);
  }
}

export default new BookingReader();
