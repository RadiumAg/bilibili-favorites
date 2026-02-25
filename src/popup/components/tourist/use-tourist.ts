import { useState, useEffect, useCallback } from 'react'

const TOURIST_STORAGE_KEY = 'bilibili_favorites_tourist_completed'

interface UseTouristReturn {
  isVisible: boolean
  currentStep: number
  totalSteps: number
  nextStep: () => void
  prevStep: () => void
  skipTourist: () => void
  completeTourist: () => void
  resetTourist: () => void
}

export const useTourist = (): UseTouristReturn => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 4

  useEffect(() => {
    chrome.storage.local.get([TOURIST_STORAGE_KEY]).then((result) => {
      const hasCompleted = result[TOURIST_STORAGE_KEY] === true
      if (!hasCompleted) {
        setIsVisible(true)
      }
    })
  }, [])

  const markAsCompleted = useCallback(() => {
    chrome.storage.local.set({ [TOURIST_STORAGE_KEY]: true })
    setIsVisible(false)
    setCurrentStep(0)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      markAsCompleted()
    }
  }, [currentStep, totalSteps, markAsCompleted])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const skipTourist = useCallback(() => {
    markAsCompleted()
  }, [markAsCompleted])

  const completeTourist = useCallback(() => {
    markAsCompleted()
  }, [markAsCompleted])

  const resetTourist = useCallback(() => {
    chrome.storage.local.remove([TOURIST_STORAGE_KEY])
    setIsVisible(true)
    setCurrentStep(0)
  }, [])

  return {
    isVisible,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTourist,
    completeTourist,
    resetTourist,
  }
}
