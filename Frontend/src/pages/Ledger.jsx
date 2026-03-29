import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Footer from '../components/sections/Footer';
import { LEDGER_BLOCKS, CHAIN_STATS } from '../utils/mockData';
import { getBlockTypeStyles } from '../utils/scoreUtils';
import { formatCurrency, truncateHash, formatTimestamp } from '../utils/formatters';
import { Search, Copy, ExternalLink, Check, ChevronDown, Link as LinkIcon } from 'lucide-react';

/**
 * Ledger Page
 * Blockchain-inspired reputation ledger
 */

// Filter options
const filterOptions = ['All', 'Loans', 'Repayments', 'Score Updates', 'Deposits'];

export default function Ledger() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const chainScrollRef = useRef(null);

  // Auto-scroll to latest block
  useEffect(() => {
    if (chainScrollRef.current) {
      chainScrollRef.current.scrollLeft = chainScrollRef.current.scrollWidth;
    }
  }, []);

  // Filter blocks
  const filteredBlocks = LEDGER_BLOCKS.filter(block => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.hash.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = activeFilter === 'All' ||
      (activeFilter === 'Loans' && block.type === 'LOAN_DISBURSED') ||
      (activeFilter === 'Repayments' && block.type === 'REPAYMENT') ||
      (activeFilter === 'Score Updates' && block.type === 'SCORE_UPDATE') ||
      (activeFilter === 'Deposits' && block.type === 'DEPOSIT');

    return matchesSearch && matchesType;
  });

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#020817] pt-24"
    >
      <div className="container py-12">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="eyebrow mb-3">
              <span>⛓ BLOCKCHAIN LEDGER</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
              Immutable Reputation Ledger
            </h1>
            <p className="text-white/60 mt-2 max-w-lg">
              Every credit event is permanently recorded.
              No edits. No deletions. Tamper-proof by design.
            </p>
          </motion.div>

          {/* Live Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="sm" hover={false} className="inline-flex flex-col items-center">
              <span className="font-mono text-3xl font-bold text-white">
                {CHAIN_STATS.totalBlocks.toLocaleString()}
              </span>
              <span className="text-white/40 text-xs">Total Blocks</span>
              <span className="text-white/30 text-xs font-mono mt-1 flex items-center gap-1">
                Last block: {CHAIN_STATS.lastBlockTime}
                <span className="animate-pulse">▌</span>
              </span>
            </Card>
          </motion.div>
        </div>

        {/* Chain Visualizer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div 
            ref={chainScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
            }}
          >
            {LEDGER_BLOCKS.slice(0, 8).reverse().map((block, index, arr) => (
              <BlockCard 
                key={block.id} 
                block={block}
                isLatest={index === arr.length - 1}
              />
            ))}
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="text"
              placeholder="Search by block ID, user ID, or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl pl-12 pr-4 text-white font-mono text-sm placeholder:text-white/30 focus:border-[rgba(79,142,247,0.3)] focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeFilter === filter
                    ? 'bg-[#4F8EF7] text-white'
                    : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white/60 hover:border-[rgba(79,142,247,0.3)]'}
                `}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Transaction Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      Block ID
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      Timestamp
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      User
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      Hash
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlocks.map((block, index) => (
                    <TableRow 
                      key={block.id} 
                      block={block}
                      index={index}
                      isExpanded={expandedRow === block.id}
                      onToggle={() => setExpandedRow(expandedRow === block.id ? null : block.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Chain Integrity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid lg:grid-cols-2 gap-6 mt-12"
        >
          {/* How We Ensure Integrity */}
          <Card>
            <h3 className="text-white font-semibold text-lg mb-6">How We Ensure Integrity</h3>
            <div className="flex items-center justify-center gap-2">
              {/* Block Visualization */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-24 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg p-2 text-center">
                  <span className="text-white/40 text-[10px] font-mono block">Block N-1</span>
                  <div className="mt-2 text-[8px] font-mono text-white/20">
                    hash: abc...
                  </div>
                </div>
                <div className="text-[#4F8EF7]">→</div>
                <div className="w-20 h-24 bg-[rgba(79,142,247,0.08)] border border-[rgba(79,142,247,0.25)] rounded-lg p-2 text-center">
                  <span className="text-[#6BA3FF] text-[10px] font-mono block">Block N</span>
                  <div className="mt-2 text-[8px] font-mono text-white/30">
                    prev: abc...
                  </div>
                </div>
                <div className="text-[#4F8EF7]">→</div>
                <div className="w-20 h-24 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg p-2 text-center">
                  <span className="text-white/40 text-[10px] font-mono block">Block N+1</span>
                  <div className="mt-2 text-[8px] font-mono text-white/20">
                    prev: def...
                  </div>
                </div>
              </div>
            </div>
            <p className="text-white/40 text-sm text-center mt-6">
              Any change to Block N-1 invalidates Block N and all subsequent blocks.
            </p>
          </Card>

          {/* Chain Statistics */}
          <Card>
            <h3 className="text-white font-semibold text-lg mb-4">Chain Statistics</h3>
            <div className="space-y-3">
              <StatRow label="Total Blocks" value={CHAIN_STATS.totalBlocks.toLocaleString()} />
              <StatRow label="Chain Integrity" value="✓ Valid" valueColor="text-[#10B981]" />
              <StatRow label="Last Block" value={CHAIN_STATS.lastBlockTime} />
              <StatRow label="Total Value Recorded" value={formatCurrency(CHAIN_STATS.totalValueRecorded, true)} />
              <StatRow label="Hash Algorithm" value={CHAIN_STATS.hashAlgorithm} mono />
              <StatRow label="Avg Block Time" value={CHAIN_STATS.avgBlockTime} />
            </div>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </motion.main>
  );
}

/**
 * Block Card Component
 */
function BlockCard({ block, isLatest }) {
  const styles = getBlockTypeStyles(block.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative flex-shrink-0 w-44
        bg-[rgba(255,255,255,0.04)] border rounded-xl overflow-hidden
        ${isLatest 
          ? 'border-[rgba(79,142,247,0.4)] shadow-[0_0_30px_rgba(79,142,247,0.2)]' 
          : 'border-[rgba(255,255,255,0.08)]'}
      `}
    >
      {/* Latest Badge */}
      {isLatest && (
        <div className="absolute top-2 right-2">
          <Badge variant="accent" size="sm">LATEST</Badge>
        </div>
      )}

      {/* Header */}
      <div className="bg-[rgba(79,142,247,0.08)] px-3 py-2">
        <span className="font-mono text-xs text-[#6BA3FF]">{block.id}</span>
        <div className="mt-1">
          <Badge variant={block.type === 'LOAN_DISBURSED' ? 'accent' : block.type === 'REPAYMENT' ? 'success' : 'warning'} size="sm">
            {block.type.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-3 border-t border-[rgba(255,255,255,0.05)]">
        {block.amount && (
          <div className="font-mono text-lg font-medium text-white">
            {formatCurrency(block.amount)}
          </div>
        )}
        {block.scoreChange && (
          <div className={`font-mono text-lg font-medium ${block.scoreChange.startsWith('+') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            Score {block.scoreChange}
          </div>
        )}
        <div className="text-white/40 text-xs font-mono mt-1">{block.userId}</div>
        <div className="text-white/30 text-[10px] mt-1">
          {new Date(block.timestamp).toLocaleDateString()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-[rgba(0,0,0,0.2)] border-t border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="text-white/20">HASH</span>
          <span className="text-[#6BA3FF]">{truncateHash(block.hash, 4)}</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1 text-[#10B981] text-[10px] font-mono">
          <Check size={10} />
          VERIFIED
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Table Row Component
 */
function TableRow({ block, index, isExpanded, onToggle }) {
  const [copied, setCopied] = useState(false);
  const styles = getBlockTypeStyles(block.type);

  const copyHash = () => {
    navigator.clipboard.writeText(block.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 * index }}
        onClick={onToggle}
        className={`
          cursor-pointer transition-all duration-200
          ${index % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : 'bg-[rgba(255,255,255,0.02)]'}
          hover:bg-[rgba(79,142,247,0.05)]
          ${isExpanded ? 'border-l-2 border-l-[#4F8EF7]' : 'border-l-2 border-l-transparent'}
        `}
      >
        <td className="px-6 py-4 font-mono text-sm text-[#6BA3FF]">{block.id}</td>
        <td className="px-6 py-4 font-mono text-xs text-white/60">
          {formatTimestamp(block.timestamp)}
        </td>
        <td className="px-6 py-4">
          <Badge 
            variant={block.type === 'LOAN_DISBURSED' ? 'accent' : block.type === 'REPAYMENT' ? 'success' : block.type === 'SCORE_UPDATE' ? 'warning' : 'glass'}
            size="sm"
          >
            {block.type.replace('_', ' ')}
          </Badge>
        </td>
        <td className="px-6 py-4 font-mono text-xs text-white/60">{block.userId}</td>
        <td className="px-6 py-4 font-mono text-sm text-white">
          {block.amount ? formatCurrency(block.amount) : block.scoreChange || '—'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 group">
            <span className="font-mono text-xs text-white/40">{truncateHash(block.hash, 6)}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); copyHash(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="flex items-center gap-1 text-[#10B981] font-mono text-xs">
            <Check size={12} />
            Verified
          </span>
        </td>
      </motion.tr>

      {/* Expanded Row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={7} className="px-6 py-4 bg-[rgba(0,0,0,0.3)]">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <pre className="text-xs font-mono p-4 bg-[rgba(0,0,0,0.3)] rounded-lg overflow-x-auto">
                  <code>
                    {`{
  `}<span className="text-[#6BA3FF]">"block_id"</span>{`: `}<span className="text-white">"{block.id}"</span>{`,
  `}<span className="text-[#6BA3FF]">"type"</span>{`: `}<span className="text-white">"{block.type}"</span>{`,
  `}<span className="text-[#6BA3FF]">"user_id"</span>{`: `}<span className="text-white">"{block.userId}"</span>{`,
  `}<span className="text-[#6BA3FF]">"amount"</span>{`: `}<span className="text-[#10B981]">{block.amount || 'null'}</span>{`,
  `}<span className="text-[#6BA3FF]">"timestamp"</span>{`: `}<span className="text-white">"{block.timestamp}"</span>{`,
  `}<span className="text-[#6BA3FF]">"prev_hash"</span>{`: `}<span className="text-white/60">"{block.prevHash}"</span>{`,
  `}<span className="text-[#6BA3FF]">"hash"</span>{`: `}<span className="text-[#6BA3FF]">"{block.hash}"</span>{`,
  `}<span className="text-[#6BA3FF]">"status"</span>{`: `}<span className="text-[#10B981]">"verified"</span>{`
}`}
                  </code>
                </pre>
                <div className="flex gap-3 mt-4">
                  <Button variant="ghost" size="sm" onClick={copyHash}>
                    <Copy size={14} className="mr-2" />
                    Copy Hash
                  </Button>
                  <Button variant="ghost" size="sm" disabled className="opacity-50">
                    <ExternalLink size={14} className="mr-2" />
                    View On Chain
                  </Button>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Stat Row Component
 */
function StatRow({ label, value, valueColor = 'text-white', mono = false }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <span className="text-white/50 text-sm">{label}</span>
      <span className={`${valueColor} ${mono ? 'font-mono' : ''} text-sm font-medium`}>
        {value}
      </span>
    </div>
  );
}
