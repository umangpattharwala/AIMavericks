'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export default function FloatingPanel({ title, isOpen, onToggle, side = 'right', children }: Props) {
  const isRight = side === 'right';

  return (
    <>
      {/* Collapsed vertical tab */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={`fixed ${isRight ? 'right-0' : 'left-0'} top-[10%] bottom-[10%] z-40 w-8 flex flex-col items-center justify-center gap-2 bg-white/90 backdrop-blur-md border ${isRight ? 'border-l rounded-l-xl' : 'border-r rounded-r-xl'} border-surface-200 shadow-sm hover:bg-brand-50 transition-colors`}
        >
          {isRight ? <ChevronLeft size={11} className="text-brand-400" /> : <ChevronRight size={11} className="text-brand-400" />}
          <span
            className="text-[10px] font-bold text-brand-500 tracking-widest whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {title}
          </span>
        </button>
      )}

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: isRight ? 40 : -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isRight ? 40 : -40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed ${isRight ? 'right-3' : 'left-3'} top-[10%] bottom-[10%] z-50 w-72 flex flex-col rounded-2xl bg-white/95 backdrop-blur-xl border border-surface-200 shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
              <h3 className="text-xs font-bold text-brand-800">{title}</h3>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-brand-300 hover:text-brand-600 hover:bg-surface-100 transition"
              >
                <X size={13} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
