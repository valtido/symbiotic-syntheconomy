import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SearchIcon, FilterIcon, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

// Types for ritual submission data
interface RitualSubmission {
  id: string;
  title: string;
  esepScore: number;
  cedaScore: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  ipfsHash: string;
  txHash: string | null;
  submittedAt: string;
}

// Mock data - replace with actual API calls
const mockSubmissions: RitualSubmission[] = [
  {
    id: '1',
    title: 'Morning Meditation',
    esepScore: 0.85,
    cedaScore: 0.92,
    approvalStatus: 'approved',
    ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    txHash: '0x123...abc',
    submittedAt: '2023-11-01T10:30:00Z',
  },
  {
    id: '2',
    title: 'Evening Reflection',
    esepScore: 0.78,
    cedaScore: 0.65,
    approvalStatus: 'pending',
    ipfsHash: 'QmYaxYGoW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    txHash: null,
    submittedAt: '2023-11-02T18:45:00Z',
  },
  // Add more mock data as needed
];

const ValidationDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<RitualSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof RitualSubmission; direction: 'asc' | 'desc' | null }>({
    key: 'submittedAt',
    direction: 'desc',
  });
  const [selectedSubmission, setSelectedSubmission] = useState<RitualSubmission | null>(null);

  // Fetch submissions (mock API call)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSubmissions(mockSubmissions);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle sorting
  const handleSort = (key: keyof RitualSubmission) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];
    if (searchTerm) {
      result = result.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ipfsHash.includes(searchTerm) ||
        s.txHash?.includes(searchTerm)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.approvalStatus === statusFilter);
    }
    if (sortConfig.direction) {
      result.sort((a, b) => {
        if (sortConfig.direction === 'asc') {
          return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
        }
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
      });
    }
    return result;
  }, [submissions, searchTerm, statusFilter, sortConfig]);

  if (loading) {
    return <div className="p-6 text-center">Loading submissions...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ritual Validation Dashboard</h1>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by title, IPFS, or TX hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'bg-blue-100' : ''}
          >
            All
          </Button>
          <Button
            variant="outline"
            onClick={() => setStatusFilter('pending')}
            className={statusFilter === 'pending' ? 'bg-blue-100' : ''}
          >
            Pending
          </Button>
          <Button
            variant="outline"
            onClick={() => setStatusFilter('approved')}
            className={statusFilter === 'approved' ? 'bg-blue-100' : ''}
          >
            Approved
          </Button>
          <Button
            variant="outline"
            onClick={() => setStatusFilter('rejected')}
            className={statusFilter === 'rejected' ? 'bg-blue-100' : ''}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('title')} className="cursor-pointer">
                Title <ArrowUpDown size={16} className="inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('esepScore')} className="cursor-pointer">
                ESEP Score <ArrowUpDown size={16} className="inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('cedaScore')} className="cursor-pointer">
                CEDA Score <ArrowUpDown size={16} className="inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('approvalStatus')} className="cursor-pointer">
                Status <ArrowUpDown size={16} className="inline ml-1" />
              </TableHead>
              <TableHead>IPFS Hash</TableHead>
              <TableHead>TX Hash</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>{submission.esepScore.toFixed(2)}</TableCell>
                  <TableCell>{submission.cedaScore.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        submission.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : submission.approvalStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {submission.approvalStatus}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm truncate max-w-[150px]" title={submission.ipfsHash}>
                    {submission.ipfsHash.slice(0, 10)}...
                  </TableCell>
                  <TableCell className="font-mono text-sm truncate max-w-[150px]" title={submission.txHash || 'N/A'}>
                    {submission.txHash ? `${submission.txHash.slice(0, 6)}...` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      {selectedSubmission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedSubmission(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{selectedSubmission.title}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">ESEP Score</p>
                <p>{selectedSubmission.esepScore.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CEDA Score</p>
                <p>{selectedSubmission.cedaScore.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="capitalize">{selectedSubmission.approvalStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p>{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">IPFS Hash</p>
              <p className="font-mono text-sm break-all">{selectedSubmission.ipfsHash}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
              <p className="font-mono text-sm break-all">{selectedSubmission.txHash || 'Not available'}</p>
            </div>
            <Button onClick={() => setSelectedSubmission(null)} className="w-full mt-4">
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ValidationDashboard;
