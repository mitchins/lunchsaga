import { useEffect } from 'react'

export function useConfetti() {
  const triggerConfetti = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
    const confettiCount = 50
    const duration = 3000
    
    const confettiElements: HTMLDivElement[] = []
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.style.position = 'fixed'
      confetti.style.width = '10px'
      confetti.style.height = '10px'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.top = '-10px'
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'
      confetti.style.pointerEvents = 'none'
      confetti.style.zIndex = '9999'
      confetti.style.opacity = '0.8'
      
      const rotation = Math.random() * 360
      const xMovement = (Math.random() - 0.5) * 200
      const yMovement = window.innerHeight + 20
      
      confetti.animate([
        { 
          transform: `translate(0, 0) rotate(0deg)`,
          opacity: 0.8
        },
        { 
          transform: `translate(${xMovement}px, ${yMovement}px) rotate(${rotation}deg)`,
          opacity: 0
        }
      ], {
        duration: duration + Math.random() * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      })
      
      document.body.appendChild(confetti)
      confettiElements.push(confetti)
    }
    
    setTimeout(() => {
      confettiElements.forEach(el => el.remove())
    }, duration + 1000)
  }
  
  return { triggerConfetti }
}
