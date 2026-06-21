'use client'

import { motion, MotionConfig } from 'framer-motion'

/**
 * Envolve cada página com uma transição suave ao navegar, ajudando a
 * orientar quem não tem familiaridade com o digital. O MotionConfig
 * com reducedMotion="user" respeita quem pede menos animação no sistema.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                {children}
            </motion.div>
        </MotionConfig>
    )
}
