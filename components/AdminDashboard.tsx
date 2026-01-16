import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Shield, Flag, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, X, Clock, Search, Filter, BarChart3, MessageSquare, Link as LinkIcon, Eye, EyeOff, Trash2, Download, RefreshCw, ArrowUpRight, ChevronDown, Calendar, Ban, Ghost, FileText, UserX } from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { Report as ReportType, WarnedUser as WarnedUserType } from '../types';
import * as moderationApi from '../services/moderationApi';
import { useLocation, useNavigate } from 'react-router-dom';
import FilterSelect, { FilterOption } from './FilterSelect';

interface AdminDashboardProps {
  onBack: () => void;
}

// Separate component for warning badge to ensure proper re-renders
interface WarningBadgeProps {
  address: string;
  tokenId?: string;
  warnedUsers: WarnedUserType[];
  isActive: boolean;
  warningsVersion: number; // Force remount when this changes
}

const WarningBadge: React.FC<WarningBadgeProps> = ({ address, tokenId, warnedUsers, isActive, warningsVersion }) => {
  if (!isActive) return null;

  const warningCount = warnedUsers.filter(w =>
    w.address.toLowerCase() === address.toLowerCase() &&
    w.isActive &&
    (tokenId ? w.tokenId === tokenId : !w.tokenId)
  ).length;

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${
      warningCount >= 3
        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
        : warningCount >= 2
          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
    }`}>
      {warningCount}/3 Warnings
    </span>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    reports,
    tokens,
    comments,
    resolveReport,
    delistToken,
    relistToken,
    banUser,
    unbanUser,
    warnUser,
    clearWarning,
    isUserBanned,
    adminActions,
    bannedUsers,
    warnedUsers,
    addNotification
  } = useStore();

  // Get tab from URL hash, default to 'overview'
  const getTabFromHash = useCallback((): 'overview' | 'token-reports' | 'comment-reports' | 'admin-actions' | 'banned-users' | 'delisted-tokens' | 'warnings' => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['overview', 'token-reports', 'comment-reports', 'admin-actions', 'banned-users', 'delisted-tokens', 'warnings'];
    return validTabs.includes(hash) ? (hash as any) : 'overview';
  }, [location.hash]);

  const [activeTab, setActiveTab] = useState<'overview' | 'token-reports' | 'comment-reports' | 'admin-actions' | 'banned-users' | 'delisted-tokens' | 'warnings'>(getTabFromHash());

  // Update hash when tab changes
  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, [getTabFromHash]);

  const handleTabChange = (tab: 'overview' | 'token-reports' | 'comment-reports' | 'admin-actions' | 'banned-users' | 'delisted-tokens' | 'warnings') => {
    navigate(`#${tab}`, { replace: true });
  };

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUserForWarning, setSelectedUserForWarning] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [warningNotes, setWarningNotes] = useState('');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionTaken, setActionTaken] = useState<ReportType['actionTaken']>('resolved');
  const [showActionModal, setShowActionModal] = useState(false);
  const [warningsVersion, setWarningsVersion] = useState(0); // Force re-renders of badges

  const statusOptions: FilterOption[] = useMemo(() => ([
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' }
  ]), []);

  const reasonOptions: FilterOption[] = useMemo(() => ([
    { value: 'all', label: 'All Reasons' },
    { value: 'scam', label: 'Scam' },
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate', label: 'Inappropriate' },
    { value: 'other', label: 'Other' }
  ]), []);

  const sortOptions: FilterOption[] = useMemo(() => ([
    { value: 'timestamp', label: 'Sort by Time' },
    { value: 'status', label: 'Sort by Status' }
  ]), []);

  // Calculate statistics
  const stats = useMemo(() => {
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const dismissedReports = reports.filter(r => r.status === 'dismissed').length;
    const tokenReports = reports.filter(r => r.tokenId).length;
    // Comment reports include actual comment reports AND trollbox reports (detected by description format)
    const commentReports = reports.filter(r =>
      r.commentId ||
      (r.description.includes('Comment by') && r.description.match(/Comment by .+? at .+?:\n/)) ||
      (r.description.includes('Message from') && r.description.match(/Message from .+? at .+?:\n/))
    ).length;

    const reasonCounts = reports.reduce((acc, report) => {
      acc[report.reason] = (acc[report.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentReports = reports
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      total: reports.length,
      pending: pendingReports,
      resolved: resolvedReports,
      dismissed: dismissedReports,
      tokenReports,
      commentReports,
      reasonCounts,
      recentReports
    };
  }, [reports]);

  // Get delisted tokens
  const delistedTokens = useMemo(() => {
    return tokens.filter(t => t.delisted).sort((a, b) => (b.delistedAt || 0) - (a.delistedAt || 0));
  }, [tokens]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Apply filters based on report type
    if (activeTab === 'token-reports') {
      filtered = filtered.filter(r => r.type === 'token');
    } else if (activeTab === 'comment-reports') {
      // Include comment reports and user reports (trollbox)
      filtered = filtered.filter(r => r.type === 'comment' || r.type === 'user');
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterReason !== 'all') {
      filtered = filtered.filter(r => r.reason === filterReason);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reportedUser.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      } else {
        const statusOrder = { 'pending': 0, 'reviewing': 1, 'resolved': 2, 'dismissed': 3 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder];
        const bOrder = statusOrder[b.status as keyof typeof statusOrder];
        return sortOrder === 'desc' ? bOrder - aOrder : aOrder - bOrder;
      }
    });

    return filtered;
  }, [reports, activeTab, filterStatus, filterReason, searchQuery, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'reviewing': return 'text-doge bg-doge/10 border-doge/20';
      case 'resolved': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'dismissed': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'reviewing': return <Eye size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      case 'dismissed': return <XCircle size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  const getReportTypeIcon = (report: ReportType) => {
    if (report.commentId) return <MessageSquare size={16} className="text-doge" />;
    return <TrendingUp size={16} className="text-purple-400" />;
  };

  // Helper function to count warnings for a user/token combination
  const getWarningCount = (address: string, tokenId?: string) => {
    const count = warnedUsers.filter(w =>
      w.address.toLowerCase() === address.toLowerCase() &&
      w.isActive &&
      (tokenId ? w.tokenId === tokenId : !w.tokenId)
    ).length;
    console.log('[COUNT] Warning count for address:', address, 'tokenId:', tokenId || 'user', 'Count:', count);
    return count;
  };

  // Group warnings by user and count them
  const warningsByUser = useMemo(() => {
    const grouped = new Map<string, { userWarnings: number; tokenWarnings: number; tokenIds: string[] }>();

    warnedUsers.forEach(warning => {
      const key = warning.address.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, { userWarnings: 0, tokenWarnings: 0, tokenIds: [] });
      }
      const data = grouped.get(key)!;

      if (warning.tokenId) {
        data.tokenWarnings++;
        if (!data.tokenIds.includes(warning.tokenId)) {
          data.tokenIds.push(warning.tokenId);
        }
      } else {
        data.userWarnings++;
      }
    });

    return grouped;
  }, [warnedUsers]);

  // Calculate warning count for modal display
  const modalWarningCount = useMemo(() => {
    if (!selectedUserForWarning) return 0;
    const pendingTokenId = (window as any).pendingWarningTokenId;
    return getWarningCount(selectedUserForWarning, pendingTokenId);
  }, [selectedUserForWarning, showWarningModal, warnedUsers]);

  const handleResolveReport = async (reportId: string, resolution: string, adminNotes?: string, actionTaken?: ReportType['actionTaken']) => {
    try {
      await resolveReport(reportId, resolution, 'resolved', adminNotes, actionTaken);
      closeActionModal();
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
  };

  const handleDismissReport = async (reportId: string, adminNotes?: string) => {
    try {
      await resolveReport(reportId, 'Dismissed by admin', 'dismissed', adminNotes, 'dismissed');
      closeActionModal();
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to dismiss report:', error);
    }
  };

  const handleIssueWarning = () => {
    if (!selectedUserForWarning || !warningReason.trim()) {
      console.log('[ADMIN DASHBOARD] Cannot issue warning - missing address or reason');
      return;
    }

    const pendingTokenId = (window as any).pendingWarningTokenId;
    console.log('[ADMIN DASHBOARD] Issuing warning - Address:', selectedUserForWarning, 'TokenId:', pendingTokenId, 'Reason:', warningReason);

    // Always call warnUser - it will handle the 3-strike rule automatically
    // At 3 warnings, it will ban/delist instead of adding a 4th warning
    warnUser(selectedUserForWarning, warningReason, warningNotes, pendingTokenId);

    // Clear the pending tokenId
    delete (window as any).pendingWarningTokenId;

    // Increment version to force badge updates
    setWarningsVersion(prev => prev + 1);

    console.log('[ADMIN DASHBOARD] Closing modal');
    closeWarningModal();
  };

  const openWarningModal = (userAddress?: string, tokenId?: string) => {
    setSelectedUserForWarning(userAddress || null);
    setWarningReason('');
    setWarningNotes('');
    // Store tokenId for token-specific warnings
    if (tokenId) {
      (window as any).pendingWarningTokenId = tokenId;
    }
    setShowWarningModal(true);
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
    setSelectedUserForWarning(null);
    setWarningReason('');
    setWarningNotes('');
    // Clear the pending tokenId
    delete (window as any).pendingWarningTokenId;
  };

  const handleClearWarning = (userAddress: string) => {
    clearWarning(userAddress);
    // Increment version to force badge updates
    setWarningsVersion(prev => prev + 1);
  };

  const openActionModal = (report: ReportType) => {
    setSelectedReport(report);
    setShowActionModal(true);
    setAdminNotes('');
    setActionTaken('resolved');
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setAdminNotes('');
    setActionTaken('resolved');
  };

  const handleDelistToken = () => {
    if (selectedReport?.tokenId) {
      delistToken(selectedReport.tokenId, `Reported as ${selectedReport.reason}`, adminNotes);
      resolveReport(selectedReport.id, 'Token delisted', 'resolved', adminNotes, 'token_delisted');
      closeActionModal();
      setSelectedReport(null);
    }
  };

  const handleBanUser = () => {
    if (selectedReport?.reportedUser) {
      banUser(selectedReport.reportedUser, selectedReport.reason, adminNotes, true);
      resolveReport(selectedReport.id, 'User banned', 'resolved', adminNotes, 'user_banned');
      closeActionModal();
      setSelectedReport(null);
    }
  };

  const handleWarnUser = () => {
    if (selectedReport?.reportedUser) {
      // For token reports, use the token's creator address instead of display name
      let targetAddress = selectedReport.reportedUser;
      if (selectedReport.tokenId) {
        const token = tokens.find(t => t.id === selectedReport.tokenId);
        if (token) {
          // Map "You" to the actual demo user wallet address
          targetAddress = token.creator === 'You' ? '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' : token.creator;
        }
      }

      warnUser(targetAddress, selectedReport.reason, adminNotes, selectedReport.tokenId);
      resolveReport(selectedReport.id, 'User warned', 'resolved', adminNotes, 'warned');
      // Increment version to force badge updates
      setWarningsVersion(prev => prev + 1);
      closeActionModal();
      setSelectedReport(null);
    }
  };

  const handleRelistToken = (tokenId: string, tokenName: string) => {
    const notes = prompt(`Re-list "${tokenName}"?\n\nAdd notes (optional):`);
    if (notes !== null) {
      relistToken(tokenId, notes);
    }
  };

  const handleUnbanUser = (userAddress: string) => {
    const notes = prompt(`Unban user ${userAddress}?\n\nAdd notes (optional):`);
    if (notes !== null) {
      unbanUser(userAddress, notes);
    }
  };

  const getReportDetails = (report: ReportType) => {
    if (report.tokenId) {
      const token = tokens.find(t => t.id === report.tokenId);
      return {
        type: 'Token',
        name: token?.name || 'Unknown Token',
        ticker: token?.ticker || '',
        link: `/token/${report.tokenId}`
      };
    } else if (report.commentId) {
      const comment = comments.find(c => c.id === report.commentId);

      // Check if this is a trollbox report (comment not in array and description has message format)
      const isTrollbox = !comment && report.description.includes('Message from') &&
                          report.description.match(/Message from .+? at .+?:\n/);

      if (isTrollbox) {
        // Extract user from trollbox description
        const userMatch = report.description.match(/Message from (.+?) at /);
        const userName = userMatch ? userMatch[1] : report.reportedUser;
        return {
          type: 'Trollbox Message',
          name: `Trollbox: ${userName}`,
          ticker: '',
          link: '#' // Trollbox messages don't have direct links
        };
      }

      return {
        type: 'Comment',
        name: comment?.user || 'Unknown User',
        ticker: '',
        link: `/token/${report.tokenId}#comment-${report.commentId}`
      };
    } else if (report.description.includes('Comment by') && report.description.match(/Comment by .+? at .+?:\n/)) {
      // Comment report without commentId (new format - comments use timestamp IDs)
      const userMatch = report.description.match(/Comment by (.+?) at /);
      const userName = userMatch ? userMatch[1] : report.reportedUser;
      return {
        type: 'Comment',
        name: `Comment: ${userName}`,
        ticker: '',
        link: '#' // Can't link to specific comment since it uses timestamp ID
      };
    } else if (report.description.includes('Message from') && report.description.match(/Message from .+? at .+?:\n/)) {
      // Trollbox report without commentId (new format)
      const userMatch = report.description.match(/Message from (.+?) at /);
      const userName = userMatch ? userMatch[1] : report.reportedUser;
      return {
        type: 'Trollbox Message',
        name: `Trollbox: ${userName}`,
        ticker: '',
        link: '#'
      };
    }
    return { type: 'Unknown', name: 'Unknown', link: '#' };
  };

  const exportReports = () => {
    const csvContent = [
      'Type,ID,Reporter,Reported User,Reason,Description,Status,Timestamp,Link',
      ...filteredReports.map(report => {
        const details = getReportDetails(report);
        return [
          details.type,
          report.id,
          report.reporter,
          report.reportedUser,
          report.reason,
          `"${report.description.replace(/"/g, '""')}"`,
          report.status,
          new Date(report.timestamp).toISOString(),
          `${window.location.origin}${details.link}`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all moderation data? This will permanently delete all warnings, bans, and admin actions from the database.')) {
      return;
    }

    if (!confirm('This action cannot be undone. Are you REALLY sure?')) {
      return;
    }

    try {
      addNotification({
        type: 'info',
        title: 'Resetting Data',
        message: 'Clearing all moderation data from database...',
        duration: 5000
      });

      await moderationApi.resetModerationData();

      addNotification({
        type: 'success',
        title: 'Data Reset Complete',
        message: 'All moderation data has been cleared. The page will now reload.',
        duration: 3000
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Reset Failed',
        message: error instanceof Error ? error.message : 'Failed to reset moderation data',
        duration: 5000
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowUpRight size={20} className="rotate-180" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-xl text-red-500">
                  <Shield size={20} className="sm:hidden" />
                  <Shield size={24} className="hidden sm:block" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-xs sm:text-sm text-gray-400">Moderation and Report Management</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button onClick={() => window.location.reload()} className="px-3 py-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-2 text-sm">
                <RefreshCw size={14} className="sm:hidden" />
                <RefreshCw size={16} className="hidden sm:block" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button onClick={handleResetData} className="px-3 py-2 sm:px-4 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Trash2 size={14} className="sm:hidden" />
                <Trash2 size={16} className="hidden sm:block" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button onClick={exportReports} className="px-3 py-2 sm:px-4 sm:py-2 bg-doge hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm">
                <Download size={14} className="sm:hidden" />
                <Download size={16} className="hidden sm:block" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Reports</span>
              <Flag size={20} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white text-center">{stats.total}</div>
          </div>
          <div className="bg-[#050505] border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pending</span>
              <Clock size={20} className="text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-400 text-center">{stats.pending}</div>
          </div>
          <div className="bg-[#050505] border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Resolved</span>
              <CheckCircle size={20} className="text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-400 text-center">{stats.resolved}</div>
          </div>
          <div className="bg-[#050505] border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Token Reports</span>
              <TrendingUp size={20} className="text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-400 text-center">{stats.tokenReports}</div>
          </div>
          <div className="bg-[#050505] border border-doge/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Comment Reports</span>
              <MessageSquare size={20} className="text-doge" />
            </div>
            <div className="text-3xl font-bold text-doge text-center">{stats.commentReports}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#050505] border border-white/10 rounded-xl p-1 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            <button
              onClick={() => handleTabChange('overview')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange('token-reports')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                activeTab === 'token-reports'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Token Reports
            </button>
            <button
              onClick={() => handleTabChange('comment-reports')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                activeTab === 'comment-reports'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Comment Reports
            </button>
            <button
              onClick={() => handleTabChange('admin-actions')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'admin-actions'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText size={14} className="hidden sm:inline" />
              <span>Actions</span>
            </button>
            <button
              onClick={() => handleTabChange('banned-users')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'banned-users'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserX size={14} className="hidden sm:inline" />
              <span className="truncate">Banned</span>
            </button>
            <button
              onClick={() => handleTabChange('delisted-tokens')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'delisted-tokens'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Ghost size={14} className="hidden sm:inline" />
              <span>Delisted</span>
            </button>
            <button
              onClick={() => handleTabChange('warnings')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'warnings'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle size={14} className="hidden sm:inline" />
              <span>Warnings</span>
              {warnedUsers.filter(w => w.isActive).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                  {warnedUsers.filter(w => w.isActive).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#050505] border border-white/10 rounded-xl p-3 sm:p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="admin-reports-search"
                name="reportsSearch"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-white/20 outline-none text-sm"
              />
            </div>
            <FilterSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusOptions}
              placeholder="All Status"
              ariaLabel="Filter by status"
            />
            <FilterSelect
              value={filterReason}
              onChange={setFilterReason}
              options={reasonOptions}
              placeholder="All Reasons"
              ariaLabel="Filter by reason"
            />
            <FilterSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as 'timestamp' | 'status')}
              options={sortOptions}
              placeholder="Sort by Time"
              ariaLabel="Sort reports"
            />
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 whitespace-nowrap"
              aria-label="Toggle sort order"
            >
              <ChevronDown size={16} className={`transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Reports List */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Reports</h3>
              <div className="space-y-4">
                {stats.recentReports.slice(0, 5).map((report) => {
                  const details = getReportDetails(report);
                  return (
                    <div
                      key={report.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getReportTypeIcon(report)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">{details.name}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                                {report.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{report.reason}</p>
                            {report.description && (
                              <p className="text-xs text-gray-500">{report.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(report.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(report.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'token-reports' || activeTab === 'comment-reports' ? (
          <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Report</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Type</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Reporter</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Reason</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Status</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Date</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report, index) => {
                  const details = getReportDetails(report);
                  return (
                    <tr key={report.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 min-w-0">
                          {getReportTypeIcon(report)}
                          <span className="text-white font-medium text-xs sm:text-sm truncate">{details.name}</span>
                          {details.ticker && (
                            <span className="text-gray-500 text-xs hidden sm:inline">({details.ticker})</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-gray-300 whitespace-nowrap">
                          {details.type}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-300 truncate max-w-[100px] sm:max-w-none">{report.reporter}</td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-300 truncate max-w-[80px] sm:max-w-none">{report.reason}</td>
                      <td className="p-3 sm:p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="hidden xs:inline">{report.status}</span>
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-1 bg-doge/10 text-doge rounded hover:bg-doge/20 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {report.status !== 'resolved' && report.status !== 'dismissed' && (
                            <>
                              <button
                                onClick={() => openActionModal(report)}
                                className="p-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                                title="Take Action"
                              >
                                <CheckCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Admin Actions History */}
        {activeTab === 'admin-actions' && (
          <div className="bg-[#050505] border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Admin Action History</h3>
              <span className="text-xs sm:text-sm text-gray-400">{adminActions.length} actions</span>
            </div>
            {adminActions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No admin actions yet</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[700px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">Time</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">Action</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">Target</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">Admin</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">Reason</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminActions.map((action) => (
                      <tr key={action.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-400 text-xs sm:text-sm">
                          <div className="truncate" title={new Date(action.timestamp).toLocaleString()}>
                            {new Date(action.timestamp).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            action.type === 'delist_token' ? 'bg-red-500/10 text-red-400' :
                            action.type === 'relist_token' ? 'bg-green-500/10 text-green-400' :
                            action.type === 'ban_user' ? 'bg-orange-500/10 text-orange-400' :
                            action.type === 'unban_user' ? 'bg-green-500/10 text-green-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {action.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-white text-xs sm:text-sm font-mono">
                          {action.targetType === 'token' ? (
                            <span className="truncate block max-w-[150px]">
                              Token: {tokens.find(t => t.id === action.targetId)?.name || action.targetId}
                            </span>
                          ) : (
                            <span className="truncate block max-w-[100px]" title={action.targetId}>
                              {action.targetId.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-400 text-xs sm:text-sm" title={action.adminAddress}>
                          {action.adminAddress.slice(0, 8)}...
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-300 text-xs sm:text-sm max-w-[120px] truncate" title={action.reason}>
                          {action.reason}
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-400 text-xs sm:text-sm max-w-[120px] truncate" title={action.notes}>
                          {action.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Banned Users */}
        {activeTab === 'banned-users' && (
          <div className="bg-[#050505] border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Banned Users</h3>
              <span className="text-xs sm:text-sm text-gray-400">{bannedUsers.length} banned</span>
            </div>
            {bannedUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No banned users</p>
            ) : (
              <div className="space-y-4">
                {bannedUsers.map((banned) => (
                  <div key={banned.address} className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Ban size={14} className="text-red-400 flex-shrink-0" />
                          <span className="font-mono text-white text-xs sm:text-sm break-all">{banned.address}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${banned.permanent ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {banned.permanent ? 'Permanent' : 'Temporary'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 mb-1"><strong>Reason:</strong> {banned.reason}</p>
                        {banned.notes && <p className="text-xs sm:text-sm text-gray-500 mb-1"><strong>Notes:</strong> {banned.notes}</p>}
                        <p className="text-xs text-gray-500">
                          Banned by {banned.bannedBy} on {new Date(banned.bannedAt).toLocaleDateString()}
                        </p>
                        {!banned.permanent && banned.expiresAt && (
                          <p className="text-xs text-yellow-400 mt-1">
                            Expires: {new Date(banned.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleUnbanUser(banned.address)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 whitespace-nowrap"
                      >
                        Unban
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delisted Tokens */}
        {activeTab === 'delisted-tokens' && (
          <div className="bg-[#050505] border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-white">Delisted Tokens</h3>
                <span className="text-xs sm:text-sm text-gray-400">{delistedTokens.length} delisted</span>
              </div>
            </div>
            {delistedTokens.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No delisted tokens</p>
            ) : (
              <div className="space-y-4">
                {delistedTokens.map((token) => (
                  <div key={token.id} className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3">
                          <img
                            src={token.imageUrl}
                            alt={token.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Ghost size={14} className="text-red-400 flex-shrink-0" />
                              <span className="font-bold text-white text-sm sm:text-base truncate">{token.name}</span>
                              <span className="text-gray-400 text-xs sm:text-sm">${token.ticker}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              ID: {token.id}
                            </div>
                          </div>
                        </div>
                        {token.delistedReason && (
                          <p className="text-xs sm:text-sm text-gray-400 mb-2">
                            <strong>Reason:</strong> {token.delistedReason}
                          </p>
                        )}
                        {token.delistedBy && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-1">
                            <strong>Delisted by:</strong> {token.delistedBy}
                          </p>
                        )}
                        {token.delistedAt && (
                          <p className="text-xs text-gray-500">
                            Delisted: {new Date(token.delistedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2">
                        <Button
                          onClick={() => handleRelistToken(token.id, token.name)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                        >
                          <CheckCircle size={14} className="sm:mr-1" />
                          <span className="hidden sm:inline">Reinstate</span>
                          <span className="sm:hidden">Add Back</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Warnings Section */}
        {activeTab === 'warnings' && (
          <div className="bg-[#050505] border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-white">Warnings</h3>
                <span className="text-xs sm:text-sm text-gray-400">{warnedUsers.filter(w => w.isActive).length} active</span>
              </div>
            </div>

            {warnedUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No warnings issued</p>
            ) : (
              <div className="space-y-4">
                {warnedUsers.map((warning) => {
                  const userWarnings = warningsByUser.get(warning.address.toLowerCase())?.userWarnings || 0;
                  const tokenWarnings = warningsByUser.get(warning.address.toLowerCase())?.tokenWarnings || 0;
                  const totalWarnings = userWarnings + tokenWarnings;
                  const thisWarningCount = getWarningCount(warning.address, warning.tokenId);

                  // Check if user is already banned
                  const isBanned = bannedUsers.some(b => b.address.toLowerCase() === warning.address.toLowerCase());

                  // Use a simpler key - the WarningBadge component will update properly when warnedUsers changes
                  const uniqueKey = `${warning.address}-${warning.tokenId || 'user'}-${warning.warnedAt}`;

                  return (
                    <div key={uniqueKey} className={`bg-white/5 border ${warning.isActive ? 'border-yellow-500/20' : 'border-white/10'} rounded-lg p-3 sm:p-4`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                            <AlertTriangle size={14} className={`${warning.isActive ? "text-yellow-400" : "text-gray-500"} flex-shrink-0`} />
                            <span className="font-mono text-white text-xs break-all">{warning.address}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${warning.isActive ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-500'}`}>
                              {warning.isActive ? 'Active' : 'Cleared'}
                            </span>
                            {isBanned && (
                              <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-red-500/10 text-red-400">
                                Banned
                              </span>
                            )}
                            {warning.tokenId && (
                              <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-purple-500/10 text-purple-400">
                                Token Warning
                              </span>
                            )}
                            {warning.acknowledgedAt && (
                              <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-500/10 text-green-400 hidden sm:inline">
                                Acknowledged
                              </span>
                            )}
                            {/* Warning Count Badge - now using separate component for proper updates */}
                            <span key={`${warning.address}-${warning.tokenId || 'user'}-${warningsVersion}`} className="flex-shrink-0">
                              <WarningBadge
                                address={warning.address}
                                tokenId={warning.tokenId}
                                warnedUsers={warnedUsers}
                                isActive={warning.isActive}
                                warningsVersion={warningsVersion}
                              />
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1"><strong>Reason:</strong> {warning.reason}</p>
                          {warning.notes && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-1"><strong>Notes:</strong> {warning.notes}</p>
                          )}
                          <div className="flex items-center gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-gray-500 flex-wrap">
                            <span>Warned by {warning.warnedBy}</span>
                            <span>{new Date(warning.warnedAt).toLocaleDateString()}</span>
                            {warning.expiresAt && (
                              <span className={warning.expiresAt < Date.now() ? 'text-red-400' : ''}>
                                Expires: {new Date(warning.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {/* Show total warnings for this user */}
                          {totalWarnings > 1 && (
                            <div className="mt-2 text-[10px] sm:text-xs">
                              <span className="text-gray-400">
                                Total: {totalWarnings} ({userWarnings} user{userWarnings !== 1 ? 's' : ''}, {tokenWarnings} token{tokenWarnings !== 1 ? 's' : ''})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2">
                          {warning.isActive && !isBanned && (
                            <>
                              <Button
                                onClick={() => openWarningModal(warning.address, warning.tokenId)}
                                className={`px-3 py-2 sm:px-3 sm:py-1.5 text-xs ${
                                  thisWarningCount >= 3
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                }`}
                              >
                                <AlertTriangle size={12} className="sm:mr-1" />
                                <span className="hidden sm:inline">Add</span>
                              </Button>
                              <Button
                                onClick={() => handleClearWarning(warning.address)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 sm:px-3 sm:py-1.5 text-xs"
                              >
                                <CheckCircle size={12} className="sm:mr-1" />
                                <span className="hidden sm:inline">Clear</span>
                              </Button>
                            </>
                          )}
                          {isBanned && (
                            <Button
                              onClick={() => handleUnbanUser(warning.address)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-3 sm:py-1.5 text-xs"
                            >
                              Unban
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeWarningModal}></div>
            <div className="relative bg-[#0A0A0A] border border-yellow-500/30 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={20} className="sm:hidden text-yellow-500" />
                  <AlertTriangle size={24} className="hidden sm:block text-yellow-500" />
                  Issue Warning
                </h2>
                <button
                  onClick={closeWarningModal}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedUserForWarning && (() => {
                  const pendingTokenId = (window as any).pendingWarningTokenId;
                  const currentCount = modalWarningCount;
                  const newWarningNumber = currentCount + 1;
                  const willAutoPenalty = currentCount >= 3; // Already has 3 warnings, will auto-apply penalty

                  return (
                    <>
                      {/* Warning Count Info */}
                      <div className={`p-4 rounded-xl border ${willAutoPenalty ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={20} className={willAutoPenalty ? 'text-red-400' : 'text-yellow-400'} />
                          <span className={`font-bold ${willAutoPenalty ? 'text-red-400' : 'text-yellow-400'}`}>
                            {willAutoPenalty
                              ? (pendingTokenId ? '⛔ AUTOMATIC DELIST' : '🚫 AUTOMATIC BAN')
                              : `Warning ${newWarningNumber} of 3`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {willAutoPenalty
                            ? (
                              <>
                                This user has already received <strong>3 warnings</strong>. Clicking "Add Warning" will <strong>
                                  {pendingTokenId ? 'automatically delist the token' : 'automatically ban the user and delist all their tokens'}
                                </strong> from the platform.
                              </>
                            )
                            : (
                              <>
                                This will be the <strong>{newWarningNumber}{newWarningNumber === 1 ? 'st' : newWarningNumber === 2 ? 'nd' : 'rd'}</strong> warning for this user{pendingTokenId ? ' (token warning)' : ''}.
                                {newWarningNumber < 3 && ` ${3 - newWarningNumber} more warning${3 - newWarningNumber > 1 ? 's' : ''} before automatic penalties are applied.`}
                                {newWarningNumber === 3 && ' The next warning will automatically ban the user and delist all their tokens.'}
                              </>
                            )
                          }
                        </p>
                      </div>

                      {/* User Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">User Address</label>
                        <p className="text-white font-mono text-sm bg-white/5 px-3 py-2 rounded">{selectedUserForWarning}</p>
                      </div>

                      {pendingTokenId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Token ID</label>
                          <p className="text-white font-mono text-sm bg-white/5 px-3 py-2 rounded">{pendingTokenId}</p>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Warning Reason *</label>
                  <select
                    value={warningReason}
                    onChange={(e) => setWarningReason(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-yellow-500/50 outline-none"
                  >
                    <option value="">Select a reason...</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="scam">Scam or Fraud</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Additional Notes</label>
                  <textarea
                    value={warningNotes}
                    onChange={(e) => setWarningNotes(e.target.value)}
                    placeholder="Optional additional context..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-yellow-500/50 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={closeWarningModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleIssueWarning}
                    disabled={!warningReason.trim()}
                    className={`flex-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                      modalWarningCount >= 3
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    <AlertTriangle size={16} className="mr-1" />
                    Add Warning
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Report Type</label>
                  <div className="flex items-center gap-2">
                    {getReportTypeIcon(selectedReport)}
                    <span className="text-white">{getReportDetails(selectedReport).name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reporter</label>
                  <p className="text-white">{selectedReport.reporter}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reported User</label>
                  <p className="text-white">{selectedReport.reportedUser}</p>
                </div>

                {selectedReport.commentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Reported Comment</label>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      {(() => {
                        const comment = comments.find(c => c.id === selectedReport.commentId);

                        // Trollbox messages aren't in the comments array, so parse from description
                        if (!comment) {
                          // Check if this is a trollbox report by parsing the description
                          const trollboxMatch = selectedReport.description.match(/Message from (.+?) at (.+?):\n([\s\S]+)$/);

                          if (trollboxMatch) {
                            const [, user, timestamp, message] = trollboxMatch;
                            return (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="font-medium text-white">{user}</span>
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-doge/10 text-doge border border-doge/20">
                                    Trollbox Message
                                  </span>
                                  <span className="text-gray-500 text-xs">{timestamp}</span>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
                              </>
                            );
                          }

                          return <span className="text-gray-500 italic">Comment not found (may have been deleted)</span>;
                        }

                        return (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-medium text-white">{comment.user}</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reason</label>
                  <p className="text-white">{selectedReport.reason}</p>
                </div>

                {selectedReport.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <p className="text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    {selectedReport.status}
                  </span>
                </div>

                {(selectedReport.adminNotes || selectedReport.actionTaken) && (
                  <>
                    {selectedReport.actionTaken && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Action Taken</label>
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-doge/10 text-doge border border-doge/20">
                          {selectedReport.actionTaken === 'token_delisted' && <Ghost size={14} />}
                          {selectedReport.actionTaken === 'user_banned' && <Ban size={14} />}
                          {selectedReport.actionTaken === 'resolved' && <CheckCircle size={14} />}
                          {selectedReport.actionTaken === 'dismissed' && <XCircle size={14} />}
                          {selectedReport.actionTaken?.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {selectedReport.adminNotes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Admin Notes</label>
                        <p className="text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3">
                          {selectedReport.adminNotes}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                  <p className="text-gray-400">
                    {new Date(selectedReport.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' ? (
                    <>
                      <Button
                        onClick={() => openActionModal(selectedReport)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Take Action
                      </Button>
                      <Button
                        onClick={() => {
                          const reportDetails = getReportDetails(selectedReport);
                          window.open(`${window.location.origin}${reportDetails.link}`, '_blank');
                        }}
                        className="flex-1 bg-doge hover:bg-purple-700 text-white"
                      >
                        <LinkIcon size={16} className="mr-2" />
                        View {getReportDetails(selectedReport).type}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        const reportDetails = getReportDetails(selectedReport);
                        window.open(`${window.location.origin}${reportDetails.link}`, '_blank');
                      }}
                      className="w-full bg-doge hover:bg-purple-700 text-white"
                    >
                      <LinkIcon size={16} className="mr-2" />
                      View {getReportDetails(selectedReport).type}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Action Modal */}
        {showActionModal && selectedReport && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeActionModal}></div>
            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="sm:hidden text-purple-400" />
                  <Shield size={24} className="hidden sm:block text-purple-400" />
                  Take Admin Action
                </h2>
                <button
                  onClick={closeActionModal}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-doge/5 border border-doge/10 rounded-lg p-4">
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold">Report:</span> {selectedReport.reason} by {selectedReport.reporter}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Target: {selectedReport.tokenId ? 'Token' : 'User'} ({selectedReport.tokenId || selectedReport.reportedUser})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Action</label>
                  <select
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value as ReportType['actionTaken'])}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-all"
                  >
                    <option value="resolved">✅ Resolve - No Action</option>
                    <option value="dismissed">❌ Dismiss Report</option>
                    {/* Only show "Delist Token" for token reports (reports without a commentId) */}
                    {!selectedReport.commentId && <option value="token_delisted">👻 Delist Token</option>}
                    {/* Only show "Ban User" for comment reports (reports with a commentId) */}
                    {selectedReport.commentId && <option value="user_banned">🚫 Ban User</option>}
                    <option value="warned">⚠️ Warn User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Admin Notes <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes explaining the action taken... These notes will be stored for future reference."
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-800 resize-none"
                    rows={4}
                  />
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4">
                  <p className="text-xs text-yellow-200 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {actionTaken === 'token_delisted'
                      ? 'This will permanently delist the token. It will no longer be visible in the marketplace and all trading will be disabled.'
                      : actionTaken === 'user_banned'
                      ? 'This will ban the user from commenting and interacting with the platform. Their existing content will remain visible.'
                      : 'This action will be logged and stored for audit purposes.'}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={closeActionModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (actionTaken === 'token_delisted') {
                        handleDelistToken();
                      } else if (actionTaken === 'user_banned') {
                        handleBanUser();
                      } else if (actionTaken === 'warned') {
                        handleWarnUser();
                      } else if (actionTaken === 'dismissed') {
                        handleDismissReport(selectedReport.id, adminNotes);
                      } else {
                        handleResolveReport(selectedReport.id, 'Resolved by admin', adminNotes, actionTaken);
                      }
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Confirm Action
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};