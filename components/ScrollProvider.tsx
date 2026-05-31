'use client'

import { ReactNode, useEffect } from 'react'

export default function ScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Smooth scroll behavior via CSS is already defined in globals.css
    // This component is a placeholder for future smooth scroll libraries
    // Current smooth scroll is handled by: html { scroll-behavior: smooth; }
    
    return () => {
      // Cleanup
    }
  }, [])

  return <>{children}</>
}
