"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  delay?: number
}

export function GlassCard({ children, className, delay = 0, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "backdrop-blur-md bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl border border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
} 