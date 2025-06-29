"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedHeadingProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedHeading({ children, className, delay = 0 }: AnimatedHeadingProps) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 100
      }}
      className={cn("text-4xl font-bold tracking-tight", className)}
    >
      {children}
    </motion.h2>
  )
} 