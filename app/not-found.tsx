'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-800 to-sky-500 p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-400/30 blur-3xl"
        animate={{
          x: [-100, 100],
          y: [-100, 100],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          repeatType: "reverse",
        }}
      />
      <motion.div 
        className="absolute w-[400px] h-[400px] rounded-full bg-purple-400/30 blur-3xl"
        animate={{
          x: [100, -100],
          y: [-100, 100],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          repeatType: "reverse",
        }}
      />
      
      {/* Glassmorphic card */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-4"
        >
          <motion.div
            className="text-center space-y-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1 
              className="text-8xl font-bold text-white"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              404
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-white/90">Page Not Found</h2>
              <p className="text-white/70 mt-2">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/" 
                className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium transition duration-300 ease-out border-2 border-white rounded-full shadow-md text-white hover:scale-105"
              >
                <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-white/20 group-hover:translate-x-0 ease">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                </span>
                <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">Return Home</span>
                <span className="relative invisible">Return Home</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 