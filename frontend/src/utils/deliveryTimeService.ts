import axios from 'axios';

// Shiprocket API configuration
const SR_BASE = "https://apiv2.shiprocket.in/v1/external";
const SR_BEARER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjc0ODgwODAsInNvdXJjZSI6InNyLWF1dGgtaW50IiwiZXhwIjoxNzU3MDYyODE3LCJqdGkiOiI3Z0JrMDRvSVFNWWFyOFY1IiwiaWF0IjoxNzU2MTk4ODE3LCJpc3MiOiJodHRwczovL3NyLWF1dGguc2hpcHJvY2tldC5pbi9hdXRob3JpemUvdXNlciIsIm5iZiI6MTc1NjE5ODgxNywiY2lkIjo3MjUzMzg5LCJ0YyI6MzYwLCJ2ZXJib3NlIjpmYWxzZSwidmVuZG9yX2lkIjowLCJ2ZW5kb3JfY29kZSI6IiJ9.iL8StPB3lXto4riWxWnI5CkARh7xlAiCV9uS-GavzQk";

// Your warehouse/shop pincode (update this to your actual location)
const WAREHOUSE_PINCODE = "400001"; // Mumbai - update this to your actual location

export interface DeliveryEstimate {
  estimatedDays: number;
  estimatedDate: Date;
  deliveryType: 'same_city' | 'same_state' | 'different_state' | 'remote';
  isAvailable: boolean;
  message: string;
}

export interface PincodeInfo {
  pincode: string;
  city: string;
  state: string;
  isServiceable: boolean;
}

/**
 * Check if pincode is serviceable by Shiprocket
 */
export async function checkPincodeServiceability(pincode: string): Promise<boolean> {
  try {
    const response = await axios.get(`${SR_BASE}/courier/serviceability`, {
      params: {
        pickup_postcode: WAREHOUSE_PINCODE,
        delivery_postcode: pincode,
        weight: 1, // Default weight in kg
        cod: 0, // Prepaid
        is_pickup: 0
      },
      headers: {
        Authorization: `Bearer ${SR_BEARER}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    return data.status === 200 && data.data?.available_courier_companies?.length > 0;
  } catch (error) {
    console.error('Error checking pincode serviceability:', error);
    return false;
  }
}

/**
 * Get delivery time estimate based on pincode distance
 */
export function calculateDeliveryTime(pincode: string): DeliveryEstimate {
  // Extract first 2 digits of pincode to determine region
  const pincodePrefix = pincode.substring(0, 2);
  const warehousePrefix = WAREHOUSE_PINCODE.substring(0, 2);
  
  let estimatedDays: number;
  let deliveryType: 'same_city' | 'same_state' | 'different_state' | 'remote';
  
  if (pincode === WAREHOUSE_PINCODE) {
    // Same pincode - same day delivery
    estimatedDays = 1;
    deliveryType = 'same_city';
  } else if (pincodePrefix === warehousePrefix) {
    // Same city/region - 1-2 days
    estimatedDays = 2;
    deliveryType = 'same_city';
  } else if (isSameState(pincodePrefix, warehousePrefix)) {
    // Same state - 2-3 days
    estimatedDays = 3;
    deliveryType = 'same_state';
  } else if (isNearbyState(pincodePrefix, warehousePrefix)) {
    // Nearby state - 3-4 days
    estimatedDays = 4;
    deliveryType = 'different_state';
  } else {
    // Remote state - 5-7 days
    estimatedDays = 6;
    deliveryType = 'remote';
  }
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  
  return {
    estimatedDays,
    estimatedDate,
    deliveryType,
    isAvailable: true,
    message: getDeliveryMessage(estimatedDays, deliveryType)
  };
}

/**
 * Get delivery time estimate from Shiprocket API (more accurate)
 */
export async function getShiprocketDeliveryEstimate(
  pickupPincode: string, 
  deliveryPincode: string, 
  weight: number = 1
): Promise<DeliveryEstimate> {
  try {
    const response = await axios.get(`${SR_BASE}/courier/serviceability`, {
      params: {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight,
        cod: 0,
        is_pickup: 0
      },
      headers: {
        Authorization: `Bearer ${SR_BEARER}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    
    if (data.status === 200 && data.data?.available_courier_companies?.length > 0) {
      // Get the fastest available courier
      const fastestCourier = data.data.available_courier_companies.reduce((fastest: any, current: any) => {
        return (current.estimated_delivery_days < fastest.estimated_delivery_days) ? current : fastest;
      });
      
      const estimatedDays = fastestCourier.estimated_delivery_days || 3;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
      
      return {
        estimatedDays,
        estimatedDate,
        deliveryType: getDeliveryTypeFromDays(estimatedDays),
        isAvailable: true,
        message: getDeliveryMessage(estimatedDays, getDeliveryTypeFromDays(estimatedDays))
      };
    } else {
      return {
        estimatedDays: 0,
        estimatedDate: new Date(),
        deliveryType: 'remote',
        isAvailable: false,
        message: 'Delivery not available at this pincode'
      };
    }
  } catch (error) {
    console.error('Error getting Shiprocket delivery estimate:', error);
    // Fallback to calculated estimate
    return calculateDeliveryTime(deliveryPincode);
  }
}

/**
 * Helper function to determine if pincodes are in same state
 */
function isSameState(pincode1: string, pincode2: string): boolean {
  // Maharashtra pincodes (40-44)
  if ((pincode1 >= '40' && pincode1 <= '44') && (pincode2 >= '40' && pincode2 <= '44')) return true;
  // Add more state mappings as needed
  return false;
}

/**
 * Helper function to determine if pincodes are in nearby states
 */
function isNearbyState(pincode1: string, pincode2: string): boolean {
  // Maharashtra (40-44) and nearby states
  const maharashtra = pincode1 >= '40' && pincode1 <= '44';
  const nearby = (pincode2 >= '30' && pincode2 <= '39') || // Gujarat, Rajasthan
                 (pincode2 >= '45' && pincode2 <= '49') || // Madhya Pradesh
                 (pincode2 >= '50' && pincode2 <= '59');   // Karnataka, Telangana
  return (maharashtra && nearby) || (nearby && maharashtra);
}

/**
 * Helper function to get delivery type from estimated days
 */
function getDeliveryTypeFromDays(days: number): 'same_city' | 'same_state' | 'different_state' | 'remote' {
  if (days <= 1) return 'same_city';
  if (days <= 2) return 'same_city';
  if (days <= 3) return 'same_state';
  if (days <= 5) return 'different_state';
  return 'remote';
}

/**
 * Helper function to get user-friendly delivery message
 */
function getDeliveryMessage(days: number, type: string): string {
  if (days === 1) return 'Same day delivery';
  if (days === 2) return 'Next day delivery';
  if (days <= 3) return `Delivery in ${days} days`;
  if (days <= 5) return `Delivery in ${days} days`;
  return `Delivery in ${days} days`;
}

/**
 * Format delivery date for display
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get delivery time range for display
 */
export function getDeliveryTimeRange(estimatedDays: number): string {
  if (estimatedDays === 1) return 'Same day';
  if (estimatedDays === 2) return '1-2 days';
  if (estimatedDays <= 3) return '2-3 days';
  if (estimatedDays <= 5) return '3-5 days';
  return '5-7 days';
}
