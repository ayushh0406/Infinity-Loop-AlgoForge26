import { motion } from 'framer-motion';

/**
 * ProblemMarquee Component
 * Auto-scrolling banner showing credit invisible stories
 */

const marqueeContent = [
  { story: 'SWIGGY DRIVER', detail: 'EARNS ₹42,000/MO', problem: 'REJECTED BY 6 BANKS' },
  { story: 'FREELANCER', detail: '3 YEARS INCOME', problem: 'NO CIBIL SCORE' },
  { story: 'STREET VENDOR', detail: 'DAILY UPI', problem: 'ZERO CREDIT ACCESS' },
  { story: 'DELIVERY PARTNER', detail: '₹38K/MO', problem: 'INVISIBLE TO EVERY BANK' },
  { story: 'TUTOR', detail: '50+ STUDENTS', problem: 'LOAN DENIED' },
  { story: 'CONTENT CREATOR', detail: '₹1L/MO', problem: 'NO CREDIT HISTORY' }
];

export default function ProblemMarquee() {
  const content = [...marqueeContent, ...marqueeContent]; // Duplicate for seamless loop

  return (
    <div className="relative bg-[rgba(255,255,255,0.02)] border-y border-[rgba(255,255,255,0.06)] py-4 overflow-hidden">
      <div className="marquee-track flex items-center whitespace-nowrap">
        {content.map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="font-mono text-[13px] text-white/30 mx-8">
              <span className="text-white/50">{item.story}</span>
              <span className="mx-2">·</span>
              <span>{item.detail}</span>
              <span className="mx-2">·</span>
              <span className="text-[#EF4444]/60">{item.problem}</span>
            </span>
            <span className="text-[#4F8EF7]/40 text-lg">◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
