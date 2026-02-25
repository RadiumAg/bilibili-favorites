import React from 'react'
import { useFavoriteData } from '@/hooks'
import { useMemoizedFn } from 'ahooks'

const { useState, useEffect } = React

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
  const { favoriteData } = useFavoriteData()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 4

  const markAsCompleted = useMemoizedFn(() => {
    chrome.storage.local.set({ [TOURIST_STORAGE_KEY]: true })
    setIsVisible(false)
    setCurrentStep(0)
  })

  const nextStep = useMemoizedFn(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      markAsCompleted()
    }
  })

  const prevStep = useMemoizedFn(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  })

  const skipTourist = useMemoizedFn(() => {
    markAsCompleted()
  })

  const completeTourist = useMemoizedFn(() => {
    markAsCompleted()
  })

  const resetTourist = useMemoizedFn(() => {
    chrome.storage.local.remove([TOURIST_STORAGE_KEY])
    setIsVisible(true)
    setCurrentStep(0)
  })

  useEffect(() => {
    if (favoriteData == null || favoriteData.length === 0) {
      return
    }

    chrome.storage.local.get([TOURIST_STORAGE_KEY]).then((result) => {
      const hasCompleted = result[TOURIST_STORAGE_KEY] === true
      if (!hasCompleted) {
        setIsVisible(true)
      }
    })
  }, [favoriteData])

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
