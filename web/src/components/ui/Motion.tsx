import { motion, type Variants, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

/* ── Easing curves ──────────────────────────────────────── */
export const easings = {
  smooth: [0.16, 1, 0.3, 1],
  spring: [0.34, 1.56, 0.64, 1],
  silk: [0.25, 0.46, 0.45, 0.94],
  gentle: [0.4, 0, 0.2, 1],
} as const;

/* ── Animation variants ─────────────────────────────────── */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: easings.smooth } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.smooth } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.smooth } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.3 } },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easings.spring } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easings.smooth } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easings.smooth } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: easings.spring } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.smooth } },
};

export const floatAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-5, 5, -5],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const pulseGlow: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(201, 120, 130, 0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(201, 120, 130, 0.4)',
      '0 0 20px 10px rgba(201, 120, 130, 0)',
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

/* ── Page transition wrapper ────────────────────────────── */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: easings.smooth },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: { duration: 0.3 },
  },
};

/* ── Glassmorphism card hover ───────────────────────────── */
export const glassCardHover = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 8px 32px rgba(122, 53, 64, 0.08)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 50px rgba(122, 53, 64, 0.15)',
    transition: { duration: 0.3, ease: easings.spring },
  },
  tap: {
    scale: 0.98,
  },
};

/* ── Component: FadeIn ──────────────────────────────────── */
interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  style?: CSSProperties;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className,
  style,
  ...props
}: FadeInProps) {
  const variants: Record<string, Variants> = {
    up: fadeInUp,
    down: fadeInDown,
    left: slideInLeft,
    right: slideInRight,
    none: fadeIn,
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[direction]}
      transition={{ delay }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Component: StaggerList ─────────────────────────────── */
interface StaggerListProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function StaggerList({ children, className, style }: StaggerListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div variants={staggerItem} className={className} style={style}>
      {children}
    </motion.div>
  );
}

/* ── Component: GlassCard ───────────────────────────────── */
interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      initial="rest"
      whileHover={hover ? 'hover' : undefined}
      whileTap={hover ? 'tap' : undefined}
      animate={glow ? 'animate' : 'rest'}
      variants={hover ? glassCardHover : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Component: PageTransition ──────────────────────────── */
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Component: FloatingElement ─────────────────────────── */
export function FloatingElement({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      variants={floatAnimation}
      initial="initial"
      animate="animate"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── Component: AnimatedCounter ─────────────────────────── */
export function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

/* ── Component: ParallaxImage ───────────────────────────── */
interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  intensity?: number;
}

export function ParallaxImage({
  src,
  alt,
  className,
  style,
  intensity = 0.1,
}: ParallaxImageProps) {
  return (
    <motion.div
      className={className}
      style={{ overflow: 'hidden', ...style }}
      whileHover={{ scale: 1 + intensity }}
      transition={{ duration: 0.6, ease: easings.smooth }}
    >
      <motion.img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        whileHover={{ scale: 1 + intensity * 2 }}
        transition={{ duration: 0.6, ease: easings.smooth }}
      />
    </motion.div>
  );
}

/* ── Component: MorphingBackground ──────────────────────── */
export function MorphingBackground({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at 20% 30%, rgba(244, 212, 216, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(201, 165, 90, 0.3) 0%, transparent 50%)',
        ...style,
      }}
      animate={{
        background: [
          'radial-gradient(ellipse at 20% 30%, rgba(244, 212, 216, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(201, 165, 90, 0.3) 0%, transparent 50%)',
          'radial-gradient(ellipse at 60% 20%, rgba(244, 212, 216, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(201, 165, 90, 0.3) 0%, transparent 50%)',
          'radial-gradient(ellipse at 20% 30%, rgba(244, 212, 216, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(201, 165, 90, 0.3) 0%, transparent 50%)',
        ],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ── Re-export AnimatePresence ──────────────────────────── */
export { AnimatePresence, motion };
