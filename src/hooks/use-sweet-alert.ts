
"use client"

import { useState, useCallback, createContext, useContext } from "react"

type AlertType = "success" | "error" | "warning" | "info"

interface SweetAlertOptions {
  title: string
  description?: string
  type?: AlertType
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
}

interface SweetAlertContextType {
  showAlert: {
    (options: SweetAlertOptions): Promise<boolean>
    (title: string, description?: string, type?: AlertType, showCancel?: boolean): Promise<boolean>
  }
  hideAlert: () => void
}

export const SweetAlertContext = createContext<SweetAlertContextType | undefined>(undefined)

export function useSweetAlert() {
  const context = useContext(SweetAlertContext)
  if (!context) {
    throw new Error("useSweetAlert must be used within a SweetAlertProvider")
  }
  return context
}
