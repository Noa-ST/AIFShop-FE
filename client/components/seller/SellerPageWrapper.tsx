import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SellerPageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for seller pages to provide consistent card styling
 */
export default function SellerPageWrapper({
  children,
  className = "",
}: SellerPageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl shadow-md p-8 lg:p-10 ${className}`}
    >
      {children}
    </motion.div>
  );
}
