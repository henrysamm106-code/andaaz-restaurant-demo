import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '../lib/router';
import { PAGE_TRANSITION } from '../lib/motion';

export function NotFoundPage() {
  return (
    <motion.div
      {...PAGE_TRANSITION}
      className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-24 sm:py-32 text-center space-y-5"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#7E4D54] font-medium">404</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#172332]">
        This page could not be found.
      </h1>
      <p className="text-base text-[#4F5D6A] max-w-md mx-auto">
        The address you followed is not part of the Andaaz Restaurant preview. Return to the main house or prepare a table request.
      </p>
      <div className="pt-4 flex flex-wrap justify-center gap-3.5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return Home
        </Link>
        <Link
          to="/reservations"
          className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 hover:bg-[#F2EDE3] text-[#172332] px-5 py-3 text-sm font-medium transition-colors"
        >
          Request a Table
        </Link>
      </div>
    </motion.div>
  );
}
