import { motion } from 'motion/react';
import { useState } from 'react';

interface FoodIcon3DProps {
  type: 'sushi' | 'pizza' | 'burger' | 'thai';
  size?: number;
}

export function FoodIcon3D({ type, size = 60 }: FoodIcon3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  const icons = {
    sushi: (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <motion.g
          animate={isHovered ? { y: -5, rotateZ: 5 } : { y: 0, rotateZ: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {/* Plate */}
          <ellipse cx="30" cy="48" rx="24" ry="4" fill="#E0E0E0" opacity="0.6" />
          
          {/* Sushi rice base */}
          <motion.ellipse
            cx="30"
            cy="35"
            rx="18"
            ry="12"
            fill="#FFF8DC"
            stroke="#F4E4C1"
            strokeWidth="1.5"
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
          />
          
          {/* Salmon topping */}
          <motion.path
            d="M 15 28 Q 30 22 45 28 Q 30 34 15 28"
            fill="#FF8A80"
            stroke="#FF5252"
            strokeWidth="1"
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            style={{ transformOrigin: '30px 28px' }}
          />
          
          {/* Shine effect */}
          <motion.ellipse
            cx="25"
            cy="26"
            rx="6"
            ry="3"
            fill="white"
            opacity={isHovered ? 0.6 : 0.3}
          />
          
          {/* Nori strip */}
          <rect x="27" y="32" width="6" height="12" rx="1" fill="#2D5016" opacity="0.8" />
        </motion.g>
      </svg>
    ),
    pizza: (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <motion.g
          animate={isHovered ? { y: -5, rotate: 10 } : { y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {/* Shadow */}
          <ellipse cx="30" cy="50" rx="22" ry="3" fill="#000" opacity="0.15" />
          
          {/* Pizza slice base */}
          <motion.path
            d="M 30 10 L 50 45 L 10 45 Z"
            fill="#FFD54F"
            stroke="#FFC107"
            strokeWidth="2"
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            style={{ transformOrigin: '30px 30px' }}
          />
          
          {/* Cheese */}
          <motion.path
            d="M 30 10 L 50 45 L 10 45 Z"
            fill="url(#pizzaGradient)"
            opacity="0.7"
          />
          
          {/* Pepperoni 1 */}
          <motion.circle
            cx="28"
            cy="28"
            r="4"
            fill="#E53935"
            stroke="#C62828"
            strokeWidth="1"
            animate={isHovered ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
          />
          
          {/* Pepperoni 2 */}
          <motion.circle
            cx="32"
            cy="35"
            r="3.5"
            fill="#E53935"
            stroke="#C62828"
            strokeWidth="1"
            animate={isHovered ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          />
          
          {/* Pepperoni 3 */}
          <motion.circle
            cx="22"
            cy="35"
            r="3"
            fill="#E53935"
            stroke="#C62828"
            strokeWidth="1"
            animate={isHovered ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          />
          
          {/* Shine */}
          <motion.ellipse
            cx="25"
            cy="20"
            rx="8"
            ry="4"
            fill="white"
            opacity={isHovered ? 0.5 : 0.25}
          />
        </motion.g>
        <defs>
          <linearGradient id="pizzaGradient" x1="30" y1="10" x2="30" y2="45">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFD54F" />
          </linearGradient>
        </defs>
      </svg>
    ),
    burger: (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <motion.g
          animate={isHovered ? { y: -8 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {/* Shadow */}
          <ellipse cx="30" cy="52" rx="20" ry="3" fill="#000" opacity="0.2" />
          
          {/* Top bun */}
          <motion.path
            d="M 15 25 Q 15 18 30 18 Q 45 18 45 25 L 44 28 L 16 28 Z"
            fill="#F4A460"
            stroke="#D2691E"
            strokeWidth="1.5"
            animate={isHovered ? { y: -3 } : { y: 0 }}
            transition={{ delay: 0.1 }}
          />
          
          {/* Sesame seeds */}
          {[18, 25, 32, 39].map((x, i) => (
            <motion.ellipse
              key={i}
              cx={x}
              cy={23}
              rx="1.5"
              ry="1"
              fill="#F5DEB3"
              animate={isHovered ? { y: -3, scale: 1.2 } : { y: 0, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.02 }}
            />
          ))}
          
          {/* Lettuce */}
          <motion.path
            d="M 14 28 L 46 28 L 45 32 L 15 32 Z"
            fill="#81C784"
            animate={isHovered ? { y: -2 } : { y: 0 }}
            transition={{ delay: 0.07 }}
          />
          
          {/* Cheese */}
          <motion.path
            d="M 13 32 L 47 32 L 46 36 L 14 36 Z"
            fill="#FFD54F"
            stroke="#FFC107"
            strokeWidth="1"
            animate={isHovered ? { y: -1.5 } : { y: 0 }}
            transition={{ delay: 0.05 }}
          />
          
          {/* Patty */}
          <motion.ellipse
            cx="30"
            cy="38"
            rx="18"
            ry="4"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="1.5"
            animate={isHovered ? { y: -1 } : { y: 0 }}
            transition={{ delay: 0.03 }}
          />
          
          {/* Bottom bun */}
          <motion.path
            d="M 12 42 L 48 42 Q 48 48 30 48 Q 12 48 12 42"
            fill="#D2691E"
            stroke="#A0522D"
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>
    ),
    thai: (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <motion.g
          animate={isHovered ? { y: -5, rotate: -5 } : { y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {/* Shadow */}
          <ellipse cx="30" cy="50" rx="18" ry="3" fill="#000" opacity="0.15" />
          
          {/* Bowl */}
          <motion.path
            d="M 12 28 Q 12 45 30 45 Q 48 45 48 28 L 46 26 L 14 26 Z"
            fill="#E8F5E9"
            stroke="#4CAF50"
            strokeWidth="2"
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            style={{ transformOrigin: '30px 35px' }}
          />
          
          {/* Soup/Curry */}
          <motion.ellipse
            cx="30"
            cy="30"
            rx="16"
            ry="6"
            fill="#FF9800"
            opacity="0.7"
            animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
            style={{ transformOrigin: '30px 30px' }}
          />
          
          {/* Chili pepper */}
          <motion.g
            animate={isHovered ? { rotate: 15, x: 2, y: -2 } : { rotate: 0, x: 0, y: 0 }}
            style={{ transformOrigin: '35px 25px' }}
            transition={{ delay: 0.05 }}
          >
            <path
              d="M 34 20 Q 36 22 35 26 L 33 26 Q 32 22 34 20"
              fill="#F44336"
              stroke="#C62828"
              strokeWidth="1"
            />
            <circle cx="34.5" cy="19.5" r="1" fill="#4CAF50" />
          </motion.g>
          
          {/* Lime slice */}
          <motion.g
            animate={isHovered ? { rotate: -15, x: -2, y: -2 } : { rotate: 0, x: 0, y: 0 }}
            style={{ transformOrigin: '22px 24px' }}
            transition={{ delay: 0.08 }}
          >
            <circle cx="22" cy="24" r="4" fill="#AED581" stroke="#8BC34A" strokeWidth="1" />
            <path d="M 22 20 L 22 28 M 18 24 L 26 24" stroke="#8BC34A" strokeWidth="0.5" />
          </motion.g>
          
          {/* Herb garnish */}
          <motion.g
            animate={isHovered ? { y: -3, scale: 1.1 } : { y: 0, scale: 1 }}
            style={{ transformOrigin: '30px 22px' }}
            transition={{ delay: 0.1 }}
          >
            <path d="M 28 20 Q 30 18 32 20" stroke="#4CAF50" strokeWidth="1.5" fill="none" />
            <path d="M 29 22 Q 30 20 31 22" stroke="#4CAF50" strokeWidth="1" fill="none" />
          </motion.g>
          
          {/* Steam */}
          {isHovered && (
            <>
              <motion.path
                d="M 24 18 Q 23 14 24 10"
                stroke="#B0BEC5"
                strokeWidth="1.5"
                fill="none"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0, 0.6, 0], y: -5 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path
                d="M 30 16 Q 29 12 30 8"
                stroke="#B0BEC5"
                strokeWidth="1.5"
                fill="none"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0, 0.6, 0], y: -5 }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.path
                d="M 36 18 Q 37 14 36 10"
                stroke="#B0BEC5"
                strokeWidth="1.5"
                fill="none"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0, 0.6, 0], y: -5 }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}
        </motion.g>
      </svg>
    ),
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer"
      style={{
        filter: isHovered
          ? 'drop-shadow(0 10px 20px rgba(88, 86, 214, 0.4))'
          : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
      }}
    >
      {icons[type]}
    </motion.div>
  );
}
