import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, X } from 'lucide-react';
import Card from '../ui/Card';
import { COMPARISON_TABLE } from '../../utils/mockData';

/**
 * ComparisonTable Component
 * Feature comparison between CIBIL, Banks, and TrustPool
 */

export default function ComparisonTable() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const renderCell = (value, isTrustPool = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="flex items-center justify-center gap-1 text-[#10B981]">
          <Check size={16} />
          <span className="hidden md:inline text-sm">Yes</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-1 text-[rgba(239,68,68,0.5)]">
          <X size={16} />
          <span className="hidden md:inline text-sm">No</span>
        </span>
      );
    }
    return (
      <span className={isTrustPool ? 'text-white font-medium' : 'text-white/60'}>
        {value}
      </span>
    );
  };

  return (
    <section className="section bg-[#020817] relative" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="eyebrow justify-center mb-4">
            <span>COMPARISON</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white">
            TrustPool vs Traditional Credit
          </h2>
        </motion.div>

        {/* Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    {COMPARISON_TABLE.headers.map((header, index) => (
                      <th
                        key={index}
                        className={`
                          text-left px-6 py-4 text-[12px] font-mono uppercase tracking-wider
                          ${index === 3 
                            ? 'text-[#4F8EF7] bg-[rgba(79,142,247,0.08)] border-l-2 border-l-[#4F8EF7]' 
                            : 'text-white/40'}
                        `}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_TABLE.rows.map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ 
                        duration: 0.4, 
                        delay: 0.1 + rowIndex * 0.05 
                      }}
                      className={`
                        border-b border-[rgba(255,255,255,0.05)]
                        hover:bg-[rgba(79,142,247,0.03)]
                        transition-colors duration-200
                      `}
                    >
                      <td className="px-6 py-4 text-white/80 text-sm font-medium">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {renderCell(row.cibil)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {renderCell(row.banks)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center bg-[rgba(79,142,247,0.05)] border-l-2 border-l-[#4F8EF7]">
                        {renderCell(row.trustpool, true)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
