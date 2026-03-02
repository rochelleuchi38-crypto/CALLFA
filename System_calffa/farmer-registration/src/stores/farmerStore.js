// src/stores/farmerStore.js
import { defineStore } from 'pinia'

const API_BASE_URL = '/api/farmers'

export const useFarmerStore = defineStore('farmer', {
  state: () => ({
    farmers: [],
    loading: false,
    error: null,
    overview: {
      farmScore: 0,
      daysToHarvest: 0,
      yieldEstimate: 0,
      farmValue: 0
    },
    currentCrop: null,
    tasks: [],
    marketPrices: {
      rice: {
        price: 0,
        change: '',
        timestamp: ''
      }
    },
    weather: {
      today: {
        icon: '☀️',
        temp: 0,
        condition: '',
        advice: ''
      },
      tomorrow: {
        icon: '🌧️',
        temp: 0,
        condition: '',
        advice: ''
      }
    },
    mlInsights: {
      predictedYield: 0,
      healthIndex: 0,
      pestRisk: 0,
      recommendations: []
    },
    analytics: {
      cropPerformance: [],
      yieldTrends: [],
      healthMetrics: [],
      predictions: []
    }
  }),
  actions: {
    async addFarmer(farmer) {
      this.loading = true
      this.error = null
      
      try {
        // Map frontend field names to backend field names
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reference_number: farmer.referenceNumber,
            full_name: farmer.name,
            date_of_birth: farmer.dob,
            address: farmer.address,
            phone_number: farmer.phone,
            password: farmer.password
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Registration failed')
        }

        const data = await response.json()

        this.loading = false
        return { success: true, message: data.message }
      } catch (error) {
        this.error = error.message
        this.loading = false
        // Handle network errors
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            message: 'Cannot connect to server. Please make sure the backend is running on http://localhost:5000' 
          }
        }
        return { success: false, message: error.message }
      }
    },
    async deleteFarmer(farmerId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`${API_BASE_URL}/${farmerId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || `HTTP ${response.status}: Failed to delete farmer`)
        }

        const data = await response.json()
        
        // Remove farmer from local state
        this.farmers = this.farmers.filter(f => f.id !== farmerId)
        
        this.loading = false
        return { success: true, message: data.message }
      } catch (error) {
        this.error = error.message
        this.loading = false
        return { success: false, message: error.message }
      }
    },
    async getAllFarmers() {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`${API_BASE_URL}`)
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || `HTTP ${response.status}: Failed to fetch farmers`)
        }
        
        const data = await response.json()
        
        // Handle response format with farmers array
        const farmers = data.farmers || (Array.isArray(data) ? data : [])
        this.farmers = farmers
        this.loading = false
        return farmers
      } catch (error) {
        this.error = error.message
        this.loading = false
        throw error
      }
    },
    async getFarmData(farmerId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/${farmerId}`)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch farm data')
        }
        
        // Update state with dashboard data
        this.overview = data.overview
        this.currentCrop = data.currentCrop
        this.tasks = data.tasks
        this.marketPrices = data.marketPrices
        this.weather = data.weather
        
        this.loading = false
        return data
      } catch (error) {
        this.error = error.message
        this.loading = false
        throw error
      }
    },
    async getMarketPrices() {
      try {
        const response = await fetch(`${API_BASE_URL}/market-prices`)
        const data = await response.json()
        
        if (data.success) {
          this.marketPrices = data.prices
        }
        return data
      } catch (error) {
        console.error('Error fetching market prices:', error)
        return { success: false, error: error.message }
      }
    },
    async getWeather() {
      try {
        const response = await fetch(`${API_BASE_URL}/weather`)
        const data = await response.json()
        
        if (data.success) {
          this.weather = data.weather
        }
        return data
      } catch (error) {
        console.error('Error fetching weather:', error)
        return { success: false, error: error.message }
      }
    },
    async addTask(taskData) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        })
        const data = await response.json()
        
        if (data.success) {
          // Refresh tasks
          if (taskData.farmer_id) {
            await this.getFarmData(taskData.farmer_id)
          }
        }
        return data
      } catch (error) {
        console.error('Error adding task:', error)
        return { success: false, error: error.message }
      }
    },
    async updateTask(taskId, updates) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        })
        const data = await response.json()
        return data
      } catch (error) {
        console.error('Error updating task:', error)
        return { success: false, error: error.message }
      }
    },
    async addCrop(cropData) {
      try {
        const response = await fetch(`${API_BASE_URL}/crops`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cropData)
        })
        const data = await response.json()
        
        if (data.success && cropData.farmer_id) {
          // Refresh farm data
          await this.getFarmData(cropData.farmer_id)
        }
        return data
      } catch (error) {
        console.error('Error adding crop:', error)
        return { success: false, error: error.message }
      }
    },
    // Insights & analytics functions
    async getMLInsights(farmerId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`${API_BASE_URL}/ml/insights/${farmerId}`)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch insights')
        }
        
        this.mlInsights = data.insights || {
          predictedYield: data.insights?.predictedYield || 0,
          healthIndex: data.insights?.healthIndex || 0,
          pestRisk: data.insights?.pestRisk || 0,
          recommendations: data.insights?.recommendations || []
        }
        
        this.loading = false
        return data
      } catch (error) {
        this.error = error.message
        this.loading = false
        // Return mock data if API fails (for development)
        console.warn('Insights API not available, using mock data:', error.message)
        this.mlInsights = {
          predictedYield: 750,
          healthIndex: 85,
          pestRisk: 25,
          recommendations: [
            'Monitor soil moisture levels',
            'Apply organic fertilizer in 2 weeks',
            'Check for pest activity daily'
          ]
        }
        return { success: true, insights: this.mlInsights }
      }
    },
    async getAnalytics(farmerId, filters = {}) {
      this.loading = true
      this.error = null
      
      try {
        const queryParams = new URLSearchParams({
          farmer_id: farmerId,
          ...filters
        }).toString()
        
        const response = await fetch(`${API_BASE_URL}/analytics?${queryParams}`)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch analytics')
        }
        
        this.analytics = {
          cropPerformance: data.analytics?.cropPerformance || [],
          yieldTrends: data.analytics?.yieldTrends || [],
          healthMetrics: data.analytics?.healthMetrics || [],
          predictions: data.analytics?.predictions || []
        }
        
        this.loading = false
        return data
      } catch (error) {
        this.error = error.message
        this.loading = false
        // Return mock data if API fails (for development)
        console.warn('Analytics API not available, using mock data:', error.message)
        this.analytics = {
          cropPerformance: [
            { crop: 'Rice', yield: 4500, area: 2.5, efficiency: 92 },
            { crop: 'Corn', yield: 3200, area: 1.8, efficiency: 88 }
          ],
          yieldTrends: [
            { month: 'Jan', yield: 4000 },
            { month: 'Feb', yield: 4200 },
            { month: 'Mar', yield: 4500 },
            { month: 'Apr', yield: 4800 }
          ],
          healthMetrics: [
            { metric: 'Soil Health', value: 85, trend: 'up' },
            { metric: 'Crop Health', value: 90, trend: 'up' },
            { metric: 'Water Efficiency', value: 78, trend: 'stable' }
          ],
          predictions: [
            { type: 'Yield', value: 750, unit: 'kg', confidence: 92 },
            { type: 'Harvest Date', value: '2025-05-15', confidence: 88 }
          ]
        }
        return { success: true, analytics: this.analytics }
      }
    },
    async getCropPredictions(farmerId, cropId = null) {
      this.loading = true
      this.error = null
      
      try {
        const url = cropId 
          ? `${API_BASE_URL}/ml/predictions/${farmerId}?crop_id=${cropId}`
          : `${API_BASE_URL}/ml/predictions/${farmerId}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch predictions')
        }
        
        this.loading = false
        return data
      } catch (error) {
        this.error = error.message
        this.loading = false
        // Return mock data if API fails
        console.warn('Predictions API not available, using mock data:', error.message)
        return {
          success: true,
          predictions: {
            yield: 750,
            harvestDate: '2025-05-15',
            healthScore: 85,
            riskFactors: ['Low soil moisture', 'Potential pest activity'],
            recommendations: ['Increase irrigation', 'Apply preventive pest control']
          }
        }
      }
    }
  }
})