export const chartGradients = {
  blue: {
    light: ['#60a5fa', '#3b82f6'],
    dark: ['#93c5fd', '#60a5fa']
  },
  green: {
    light: ['#4ade80', '#10b981'],
    dark: ['#86efac', '#34d399']
  },
  amber: {
    light: ['#fbbf24', '#f59e0b'],
    dark: ['#fde047', '#fbbf24']
  },
  red: {
    light: ['#f87171', '#ef4444'],
    dark: ['#fca5a5', '#f87171']
  },
  purple: {
    light: ['#a78bfa', '#8b5cf6'],
    dark: ['#c4b5fd', '#a78bfa']
  },
  cyan: {
    light: ['#22d3ee', '#06b6d4'],
    dark: ['#67e8f9', '#22d3ee']
  },
  pink: {
    light: ['#f472b6', '#ec4899'],
    dark: ['#f9a8d4', '#f472b6']
  },
  teal: {
    light: ['#2dd4bf', '#14b8a6'],
    dark: ['#5eead4', '#2dd4bf']
  },
  orange: {
    light: ['#fb923c', '#f97316'],
    dark: ['#fdba74', '#fb923c']
  }
}

export function createLinearGradient(
  context: any,
  colors: string[],
  direction: 'vertical' | 'horizontal' = 'vertical'
) {
  const gradient = direction === 'vertical'
    ? context.createLinearGradient(0, 0, 0, 300)
    : context.createLinearGradient(0, 0, 300, 0)
  
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[1])
  
  return gradient
}

export function createRadialGradient(
  context: any,
  colors: string[],
  centerX = 0.5,
  centerY = 0.5,
  radius = 0.7
) {
  const gradient = context.createRadialGradient(
    centerX * 300, centerY * 300, 0,
    centerX * 300, centerY * 300, radius * 300
  )
  
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[1])
  
  return gradient
}