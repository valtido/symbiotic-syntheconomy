import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Select, Tag, Spin, Alert } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// Types for ritual submission data
interface RitualSubmission {
  id: string;
  title: string;
  submitter: string;
  submissionDate: string;
  esepScore: number;
  cedaScore: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  ipfsHash: string;
  blockchainTx: string;
}

// Styled components
const DashboardContainer = styled.div`
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
`;

const DetailModalContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const ValidationDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<RitualSubmission[]>([]);
  const [filteredData, setFilteredData] = useState<RitualSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<RitualSubmission | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Mock data fetching (replace with real API call)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulated API response
        const mockData: RitualSubmission[] = [
          {
            id: '1',
            title: 'Healing Ritual',
            submitter: '0x123...456',
            submissionDate: '2023-10-01',
            esepScore: 85,
            cedaScore: 78,
            approvalStatus: 'approved',
            ipfsHash: 'QmX...abc',
            blockchainTx: '0x789...def',
          },
          {
            id: '2',
            title: 'Protection Ritual',
            submitter: '0x456...789',
            submissionDate: '2023-10-02',
            esepScore: 65,
            cedaScore: 70,
            approvalStatus: 'pending',
            ipfsHash: 'QmY...def',
            blockchainTx: '0xabc...123',
          },
          {
            id: '3',
            title: 'Prosperity Ritual',
            submitter: '0x789...abc',
            submissionDate: '2023-10-03',
            esepScore: 45,
            cedaScore: 50,
            approvalStatus: 'rejected',
            ipfsHash: 'QmZ...ghi',
            blockchainTx: '0xdef...456',
          },
        ];
        setSubmissions(mockData);
        setFilteredData(mockData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load submissions');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...submissions];
    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.submitter.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.approvalStatus === statusFilter);
    }
    setFilteredData(filtered);
  }, [searchText, statusFilter, submissions]);

  // Table columns configuration
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: RitualSubmission, b: RitualSubmission) => a.title.localeCompare(b.title),
    },
    {
      title: 'Submitter',
      dataIndex: 'submitter',
      key: 'submitter',
    },
    {
      title: 'Submission Date',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      sorter: (a: RitualSubmission, b: RitualSubmission) =>
        new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime(),
    },
    {
      title: 'ESEP Score',
      dataIndex: 'esepScore',
      key: 'esepScore',
      sorter: (a: RitualSubmission, b: RitualSubmission) => a.esepScore - b.esepScore,
    },
    {
      title: 'CEDA Score',
      dataIndex: 'cedaScore',
      key: 'cedaScore',
      sorter: (a: RitualSubmission, b: RitualSubmission) => a.cedaScore - b.cedaScore,
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status: string) => (
        <Tag
          color={
            status === 'approved' ? 'green' : status === 'pending' ? 'gold' : 'red'
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: RitualSubmission) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedSubmission(record);
            setModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardContainer>
        <Spin size="large" />
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Alert message={error} type="error" />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <h2>Ritual Validation Dashboard</h2>
      <FilterBar>
        <Input
          placeholder="Search by title or submitter"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Select
          defaultValue="all"
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 150 }}
          options=[
            { value: 'all', label: 'All Status' },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending' },
            { value: 'rejected', label: 'Rejected' },
          ]
        />
        <FilterOutlined />
      </FilterBar>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Ritual Submission Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedSubmission && (
          <DetailModalContent>
            <div><strong>Title:</strong> {selectedSubmission.title}</div>
            <div><strong>Submitter:</strong> {selectedSubmission.submitter}</div>
            <div><strong>Submission Date:</strong> {selectedSubmission.submissionDate}</div>
            <div><strong>ESEP Score:</strong> {selectedSubmission.esepScore}</div>
            <div><strong>CEDA Score:</strong> {selectedSubmission.cedaScore}</div>
            <div><strong>Status:</strong> {selectedSubmission.approvalStatus}</div>
            <div><strong>IPFS Hash:</strong> {selectedSubmission.ipfsHash}</div>
            <div><strong>Blockchain Tx:</strong> {selectedSubmission.blockchainTx}</div>
          </DetailModalContent>
        )}
      </Modal>
    </DashboardContainer>
  );
};

export default ValidationDashboard;
