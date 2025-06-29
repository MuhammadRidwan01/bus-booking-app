"use client"

import { motion } from "framer-motion"
import { AnimatedHeading } from "@/components/ui/animated-heading"

export function AnimatedHero() {
  return (
    <>
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 -z-10 opacity-0 animate-fade-in">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5
          }}
        />
      </div>

      <div className="text-center mb-16">
        {/* Pre-rendered text for fast LCP */}
        <h1 className="max-w-3xl mx-auto mb-6 text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          Perjalanan Nyaman dengan Shuttle Bus Premium Ibis Hotels
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Nikmati layanan shuttle bus gratis dengan sistem booking modern dan tracking real-time
        </p>
      </div>
    </>
  )
} 