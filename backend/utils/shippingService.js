// Shipping Service for Zone-based Shipping Calculation
class ShippingService {
  constructor() {
    // Define shipping zones for Kenya with their base shipping costs
    this.zones = {
      // Zone 1: Nairobi and surrounding areas (lowest cost)
      'nairobi': {
        name: 'Nairobi Metropolitan',
        cities: ['Nairobi', 'Westlands', 'Karen', 'Kilimani', 'Langata', 'Parklands', 'Koinange Street', 'River Road', 'Luthuli Avenue'],
        baseCost: 200, // KSh 200
        estimatedDays: 2
      },

      // Zone 2: Major cities (medium cost)
      'major_cities': {
        name: 'Major Cities',
        cities: ['Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos', 'Nyeri', 'Meru', 'Kakamega', 'Kitale', 'Malindi', 'Garissa'],
        baseCost: 210, // KSh 350
        estimatedDays: 5
      },

      // Zone 3: Other towns and regions (higher cost)
      'regional': {
        name: 'Regional Areas',
        cities: ['Nanyuki', 'Isiolo', 'Marsabit', 'Wajir', 'Mandera', 'Lamu', 'Voi', 'Taveta', 'Hola', 'Moyale', 'Lokichogio', 'Lodwar', 'Kitale'],
        baseCost: 200, // KSh 500
        estimatedDays: 3
      },

      // Zone 4: Rural and remote areas (highest cost)
      'remote': {
        name: 'Remote Areas',
        cities: ['Mombasa Island', 'Diani Beach', 'Kilifi', 'Malindi', 'Watamu', 'Lamu Island', 'Pate Island', 'Kiwayu', 'Manda Island'],
        baseCost: 200, // KSh 700
        estimatedDays: 4
      }
    };

    // Weight-based surcharges (per kg)
    this.weightSurcharges = {
      '0-1': 0,      // 0-1kg: no surcharge
      '1-5': 50,     // 1-5kg: +KSh 50
      '5-10': 150,   // 5-10kg: +KSh 150
      '10+': 300     // 10kg+: +KSh 300
    };

    // Express delivery multiplier
    this.expressMultiplier = 1.5;
  }

  // Determine shipping zone based on city
  getShippingZone(city) {
    if (!city) return null;

    const normalizedCity = city.toLowerCase().trim();

    for (const [zoneKey, zoneData] of Object.entries(this.zones)) {
      const cityMatch = zoneData.cities.some(zoneCity =>
        zoneCity.toLowerCase().includes(normalizedCity) ||
        normalizedCity.includes(zoneCity.toLowerCase())
      );

      if (cityMatch) {
        return {
          zone: zoneKey,
          name: zoneData.name,
          baseCost: zoneData.baseCost,
          estimatedDays: zoneData.estimatedDays
        };
      }
    }

    // Default to regional zone if city not found
    return {
      zone: 'regional',
      name: this.zones.regional.name,
      baseCost: this.zones.regional.baseCost,
      estimatedDays: this.zones.regional.estimatedDays
    };
  }

  // Calculate weight-based surcharge
  getWeightSurcharge(totalWeight) {
    if (totalWeight <= 1) return this.weightSurcharges['0-1'];
    if (totalWeight <= 5) return this.weightSurcharges['1-5'];
    if (totalWeight <= 10) return this.weightSurcharges['5-10'];
    return this.weightSurcharges['10+'];
  }

  // Calculate shipping cost
  calculateShippingCost(shippingAddress, orderItems = [], options = {}) {
    try {
      const { isExpress = false, customWeight = null } = options;

      // Get shipping zone
      const zoneInfo = this.getShippingZone(shippingAddress.city);
      if (!zoneInfo) {
        throw new Error('Unable to determine shipping zone');
      }

      let baseCost = zoneInfo.baseCost;

      // Calculate total weight (assume average product weight if not specified)
      let totalWeight = customWeight;
      if (totalWeight === null && orderItems.length > 0) {
        // Estimate weight: assume 0.5kg per item on average
        totalWeight = orderItems.reduce((sum, item) => sum + (item.quantity * 0.5), 0);
      }

      // Add weight surcharge
      const weightSurcharge = totalWeight ? this.getWeightSurcharge(totalWeight) : 0;
      baseCost += weightSurcharge;

      // Apply express delivery multiplier
      if (isExpress) {
        baseCost = Math.round(baseCost * this.expressMultiplier);
      }

      return {
        zone: zoneInfo.zone,
        zoneName: zoneInfo.name,
        baseCost: zoneInfo.baseCost,
        weightSurcharge,
        expressSurcharge: isExpress ? Math.round(zoneInfo.baseCost * (this.expressMultiplier - 1)) : 0,
        totalCost: baseCost,
        estimatedDays: isExpress ? Math.max(1, zoneInfo.estimatedDays - 1) : zoneInfo.estimatedDays,
        currency: 'KSh',
        breakdown: {
          zoneCost: zoneInfo.baseCost,
          weightCost: weightSurcharge,
          expressCost: isExpress ? Math.round(zoneInfo.baseCost * (this.expressMultiplier - 1)) : 0
        }
      };

    } catch (error) {
      console.error('Shipping calculation error:', error);
      // Return default shipping cost
      return {
        zone: 'unknown',
        zoneName: 'Unknown Zone',
        baseCost: 500,
        weightSurcharge: 0,
        expressSurcharge: 0,
        totalCost: 500,
        estimatedDays: 3,
        currency: 'KSh',
        breakdown: {
          zoneCost: 500,
          weightCost: 0,
          expressCost: 0
        }
      };
    }
  }

  // Get all available zones
  getAllZones() {
    return Object.entries(this.zones).map(([key, zone]) => ({
      zone: key,
      name: zone.name,
      baseCost: zone.baseCost,
      estimatedDays: zone.estimatedDays,
      cities: zone.cities
    }));
  }

  // Validate shipping address for zone coverage
  validateShippingAddress(shippingAddress) {
    const zoneInfo = this.getShippingZone(shippingAddress.city);

    return {
      isValid: true, // All addresses are valid, we just assign zones
      zone: zoneInfo.zone,
      zoneName: zoneInfo.name,
      estimatedDelivery: `${zoneInfo.estimatedDays} business days`,
      shippingCost: zoneInfo.baseCost
    };
  }
}

module.exports = new ShippingService();