import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SearchIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

// Types for ritual submission data
interface RitualSubmission {
  id: string;
  title: string;
  submitter: string;
  esepScore: number;
  cedaScore: number;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  ipfsHash: string;
  txHash: string;
  timestamp: number;
}

// Mock data - replace with actual API calls
const mockSubmissions: RitualSubmission[] = [
  {
    id: '1',
    title: 'Healing Circle',
    submitter: '0x123...456',
    esepScore: 85,
    cedaScore: 78,
    approvalStatus: 'Approved',
    ipfsHash: 'QmX...abc',
    txHash: '0x789...def',
    timestamp: Date.now() - 3600000,
  },
  {
    id: '2',
    title: 'Energy Transfer',
    submitter: '0x456...789',
    esepScore: 65,
    cedaScore: 72,
    approvalStatus: 'Pending',
    ipfsHash: 'QmY...def',
    txHash: 'Pending',
    timestamp: Date.now() - 7200000,
  },
];

const ValidationDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<RitualSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof RitualSubmission; direction: 'asc' | 'desc' | null }>({
    key: 'timestamp',
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
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.submitter.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
  }, [submissions, searchTerm, sortConfig]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ritual Validation Dashboard</h1>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by title or submitter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline">Filter by Status</Button>
      </div>

      {/* Submissions Table */}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('title')} className="cursor-pointer">
                Title {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </TableHead>
              <TableHead onClick={() => handleSort('submitter')} className="cursor-pointer">
                Submitter {sortConfig.key === 'submitter' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </TableHead>
              <TableHead onClick={() => handleSort('esepScore')} className="cursor-pointer">
                ESEP Score {sortConfig.key === 'esepScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </TableHead>
              <TableHead onClick={() => handleSort('cedaScore')} className="cursor-pointer">
                CEDA Score {sortConfig.key === 'cedaScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </TableHead>
              <TableHead onClick={() => handleSort('approvalStatus')} className="cursor-pointer">
                Status {sortConfig.key === 'approvalStatus' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSubmission(submission)}>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>{submission.submitter.slice(0, 8)}...</TableCell>
                  <TableCell>{submission.esepScore}</TableCell>
                  <TableCell>{submission.cedaScore}</TableCell>
                  <TableCell
                    className={`font-medium ${
                      submission.approvalStatus === 'Approved' ? 'text-green-600' : submission.approvalStatus === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    {submission.approvalStatus}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Details</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detailed View Modal */}
      {selectedSubmission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{selectedSubmission.title}</h2>
            <div className="space-y-2">
              <p><strong>Submitter:</strong> {selectedSubmission.submitter}</p>
              <p><strong>ESEP Score:</strong> {selectedSubmission.esepScore}</p>
              <p><strong>CEDA Score:</strong> {selectedSubmission.cedaScore}</p>
              <p><strong>Status:</strong> {selectedSubmission.approvalStatus}</p>
              <p><strong>IPFS Hash:</strong> <a href={`https://ipfs.io/ipfs/${selectedSubmission.ipfsHash}`} target="_blank" className="text-blue-500 hover:underline">{selectedSubmission.ipfsHash.slice(0, 8)}...</a></p>
              <p><strong>Transaction:</strong> {selectedSubmission.txHash === 'Pending' ? 'Pending' : <a href={`https://etherscan.io/tx/${selectedSubmission.txHash}`} target="_blank" className="text-blue-500 hover:underline">{selectedSubmission.txHash.slice(0, 8)}...</a>}</p>
            </div>
            <Button className="mt-4" onClick={() => setSelectedSubmission(null)}>Close</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ValidationDashboard;
