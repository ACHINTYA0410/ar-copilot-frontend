import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastDisplay } from '../shared/ToastDisplay'

export function AppLayout() {
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const revealSelector = [
      '.rounded-xl',
      '.rounded-2xl',
      'tbody tr',
      '[class*="grid-cols"] > div',
    ].join(',')

    const applyRevealTargets = () => {
      shell.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
        if (
          element.closest('aside') ||
          element.classList.contains('aurora-orb') ||
          element.classList.contains('scroll-progress')
        ) {
          return
        }
        element.classList.add('scroll-reveal')
      })
    }

    const updateScrollProgress = () => {
      const scrollers = Array.from(shell.querySelectorAll<HTMLElement>('.overflow-y-auto'))
      const activeScroller =
        scrollers.find((node) => node.scrollHeight > node.clientHeight && node.scrollTop > 0) ??
        scrollers.find((node) => node.scrollHeight > node.clientHeight)

      if (!activeScroller) {
        shell.style.setProperty('--scroll-progress', '0%')
        shell.style.setProperty('--scroll-depth', '0')
        return
      }

      const maxScroll = activeScroller.scrollHeight - activeScroller.clientHeight
      const progress = maxScroll > 0 ? activeScroller.scrollTop / maxScroll : 0
      shell.style.setProperty('--scroll-progress', `${Math.min(progress * 100, 100)}%`)
      shell.style.setProperty('--scroll-depth', progress.toFixed(4))
    }

    applyRevealTargets()
    updateScrollProgress()

    const mutationObserver = new MutationObserver(() => {
      applyRevealTargets()
      updateScrollProgress()
    })
    mutationObserver.observe(shell, { childList: true, subtree: true })

    shell.addEventListener('scroll', updateScrollProgress, { passive: true, capture: true })
    window.addEventListener('resize', updateScrollProgress)

    return () => {
      mutationObserver.disconnect()
      shell.removeEventListener('scroll', updateScrollProgress, true)
      window.removeEventListener('resize', updateScrollProgress)
    }
  }, [])

  return (
    <div ref={shellRef} className="app-shell flex h-screen bg-gray-50 overflow-hidden">
      <div className="scroll-progress" />
      <div className="aurora-orb aurora-orb-one" />
      <div className="aurora-orb aurora-orb-two" />
      <div className="aurora-orb aurora-orb-three" />
      <Sidebar />
      <div className="app-content flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      <ToastDisplay />
    </div>
  )
}
