import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faUsers,
  faFilter,
  faBan,
  faShieldHalved,
  faCheckCircle,
  faClock,
  faRotateRight,
  faEye,
  faUserSlash,
  faCircleInfo,
  faXmark,
  faUser,
  faPhone,
  faEnvelope,
  faLocationDot,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { userService } from '../../services/endpoints/userService';
import { adminService } from '../../services/endpoints/adminService';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import Pagination from '../../components/common/Pagination';

export const UserManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewTab, setViewTab] = useState(
    searchParams.get('tab') === 'approvals' ? 'approvals' : 'all'
  );
  const [users, setUsers] = useState([]);
  const [pendingOrganizerCount, setPendingOrganizerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [approvingId, setApprovingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Confirmation banner
  const [actionNotice, setActionNotice] = useState(null);

  // User detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Moderation Dialog
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    user: null,
    action: 'restrict', // 'restrict', 'suspend', 'reactivate'
  });

  const fetchUsers = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        approvalStatus: viewTab === 'approvals' ? 'PENDING' : 'ALL',
        page: targetPage - 1,
        size: 15,
      });
      if (res.success) {
        setUsers(res.data || []);
        setPendingOrganizerCount(res.pendingOrganizerCount ?? 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, viewTab]);

  useEffect(() => {
    fetchUsers(page);
  }, [roleFilter, statusFilter, viewTab, page]);

  const handleOrganizerApproval = async (user, decision) => {
    setApprovingId(user.id);
    try {
      const res = await adminService.approveOrganizer(user.id, decision);
      toastService.success(res.message);
      setActionNotice(
        `${user.name} organizer verification ${decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'}.`
      );
      fetchUsers();
    } catch (err) {
      toastService.error(err?.message || 'Failed to update organizer verification.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openActionDialog = (user, action) => {
    setDialogState({
      isOpen: true,
      user,
      action,
    });
  };

  const handleConfirmModeration = async () => {
    if (!dialogState.user) return;
    const { user, action } = dialogState;

    try {
      if (action === 'delete') {
        const res = await userService.deleteUser(user.id);
        setActionNotice(`${user.name} (${user.id}) permanently deleted.`);
        toastService.success(res.message);
        setIsDetailModalOpen(false);
        fetchUsers();
      } else {
        const res = await userService.updateUserStatus(user.id, { action });
        if (res.success) {
          const actionLabel =
            action === 'restrict'
              ? 'Restricted from match hosting'
              : action === 'suspend'
              ? 'Account Suspended'
              : 'Reactivated to Active Status';

          setActionNotice(`${user.name} (${user.id}) updated: ${actionLabel}.`);
          toastService.success(res.message);
          fetchUsers();
        }
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to update user.');
    } finally {
      setDialogState({ isOpen: false, user: null, action: 'restrict' });
    }
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl w-full mx-auto pb-16">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
            User Management
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Review account roles, moderation status, and enforce community safety actions.
          </p>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>All Roles</option>
            <option>Player</option>
            <option>Organizer</option>
            <option>Guardian</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Restricted</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      {/* Tabs: Directory vs Organizer Approval Requests */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setViewTab('all');
            setSearchParams({});
          }}
          className={`px-4 py-2 rounded-md font-label text-xs font-semibold transition-colors ${
            viewTab === 'all'
              ? 'bg-primary text-on-primary'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border'
          }`}
        >
          All Accounts
        </button>
        <button
          type="button"
          onClick={() => {
            setViewTab('approvals');
            setSearchParams({ tab: 'approvals' });
          }}
          className={`px-4 py-2 rounded-md font-label text-xs font-semibold flex items-center gap-2 transition-colors ${
            viewTab === 'approvals'
              ? 'bg-accent text-on-accent'
              : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border'
          }`}
        >
          <span>Organizer Approval Queue</span>
          {pendingOrganizerCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-dark-background/20 font-mono text-[10px] font-bold">
              {pendingOrganizerCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, ID (e.g. USR-1042), or district..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface placeholder:text-light-muted dark:placeholder:text-dark-muted font-body text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-3 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      {/* Action Confirmation Banner (Reference lines 246-252 in UIUX/user_management/code.html) */}
      {actionNotice && (
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-primary p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCircleInfo} className="text-primary text-base" />
            <p className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface">
              {actionNotice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="px-3 py-1 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated font-label text-xs hover:text-primary transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Users Table */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <LoadingSpinner size="lg" text="Filtering user directory..." />
          </div>
        ) : users.length > 0 ? (
          <>
            {/* Mobile Card Directory (< md) */}
            <div className="md:hidden divide-y divide-light-border dark:divide-dark-border">
              {users.map((u) => {
                const isActive = u.status === 'Active';
                const isRestricted = u.status === 'Restricted';
                const isSuspended = u.status === 'Suspended';

                return (
                  <div key={`mob-${u.id}`} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-light-border dark:border-dark-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center font-label font-bold text-xs text-primary shrink-0">
                            {u.initials || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openUserDetails(u)}
                            className="font-label text-sm font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary text-left truncate block"
                          >
                            {u.name}
                          </button>
                          <p className="font-mono text-[11px] text-light-muted dark:text-dark-muted truncate">
                            {u.roles?.join(', ')} • {u.area}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full font-label text-xs font-semibold shrink-0 ${
                          isActive
                            ? 'bg-success text-on-success'
                            : isRestricted
                            ? 'bg-warning text-on-warning'
                            : 'bg-error text-on-error'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-light-muted dark:text-dark-muted">
                      <span className="font-mono truncate">ID: {u.id}</span>
                      <span className={u.reportsCount > 0 ? 'text-warning font-bold' : ''}>
                        {u.reportsCount} report{u.reportsCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openUserDetails(u)}
                        className="px-2.5 py-1.5 rounded-md border border-light-border dark:border-dark-border font-label text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        <span>View</span>
                      </button>

                      {u.organizerApprovalStatus === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            disabled={approvingId === u.id}
                            onClick={() => handleOrganizerApproval(u, 'APPROVED')}
                            className="px-2.5 py-1.5 rounded-md bg-primary text-on-primary font-label text-xs font-semibold disabled:opacity-50"
                          >
                            Approve Organizer
                          </button>
                          <button
                            type="button"
                            disabled={approvingId === u.id}
                            onClick={() => handleOrganizerApproval(u, 'REJECTED')}
                            className="px-2.5 py-1.5 rounded-md border border-error text-error font-label text-xs font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isActive && (
                        <button
                          type="button"
                          onClick={() => openActionDialog(u, 'restrict')}
                          className="px-2.5 py-1.5 rounded-md border border-warning text-warning font-label text-xs font-semibold"
                        >
                          Restrict
                        </button>
                      )}

                      {isRestricted && (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionDialog(u, 'suspend')}
                            className="px-2.5 py-1.5 rounded-md border border-error text-error font-label text-xs font-semibold"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionDialog(u, 'reactivate')}
                            className="px-2.5 py-1.5 rounded-md bg-success text-on-success font-label text-xs font-semibold"
                          >
                            Reactivate
                          </button>
                        </>
                      )}

                      {isSuspended && (
                        <button
                          type="button"
                          onClick={() => openActionDialog(u, 'reactivate')}
                          className="px-2.5 py-1.5 rounded-md bg-success text-on-success font-label text-xs font-semibold"
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openActionDialog(u, 'delete')}
                        className="px-2.5 py-1.5 rounded-md bg-error/10 border border-error/40 text-error font-label text-xs font-semibold flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faTrashCan} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated font-label text-xs uppercase text-light-muted dark:text-dark-muted">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">General Area</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Reports</th>
                  <th className="py-3 px-4 text-right font-semibold">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border font-body text-xs sm:text-sm">
                {users.map((u) => {
                  const isActive = u.status === 'Active';
                  const isRestricted = u.status === 'Restricted';
                  const isSuspended = u.status === 'Suspended';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-light-surface-elevated/50 dark:hover:bg-dark-surface-elevated/50 transition-colors"
                    >
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-light-border dark:border-dark-border"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center font-label font-bold text-xs text-primary shrink-0">
                              {u.initials || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openUserDetails(u)}
                              className="font-label text-xs sm:text-sm font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary transition-colors text-left"
                            >
                              {u.name}
                            </button>
                            <p className="font-mono text-[11px] text-light-muted dark:text-dark-muted">
                              {u.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4 text-light-muted dark:text-dark-muted">
                        {u.roles?.join(', ')}
                      </td>

                      {/* General Area */}
                      <td className="py-3.5 px-4 text-light-muted dark:text-dark-muted">
                        {u.area}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-label text-xs font-semibold ${
                            isActive
                              ? 'bg-success text-on-success'
                              : isRestricted
                              ? 'bg-warning text-on-warning'
                              : 'bg-error text-on-error'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Reports */}
                      <td className="py-3.5 px-4 tabular-nums font-mono">
                        <span className={u.reportsCount > 0 ? 'text-warning font-bold' : 'text-light-muted dark:text-dark-muted'}>
                          {u.reportsCount}
                        </span>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUserDetails(u)}
                            className="p-1.5 text-xs text-light-muted dark:text-dark-muted hover:text-primary transition-colors"
                            aria-label="View user profile"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>

                          {u.organizerApprovalStatus === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            disabled={approvingId === u.id}
                            onClick={() => handleOrganizerApproval(u, 'APPROVED')}
                            className="px-2.5 py-1.5 rounded-md bg-primary text-on-primary font-label text-xs font-semibold disabled:opacity-50"
                          >
                            Approve Organizer
                          </button>
                          <button
                            type="button"
                            disabled={approvingId === u.id}
                            onClick={() => handleOrganizerApproval(u, 'REJECTED')}
                            className="px-2.5 py-1.5 rounded-md border border-error text-error font-label text-xs font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isActive && (
                            <button
                              type="button"
                              onClick={() => openActionDialog(u, 'restrict')}
                              className="px-2.5 py-1 rounded-md border border-warning text-warning font-label text-xs hover:bg-warning hover:text-on-warning transition-colors"
                            >
                              Restrict
                            </button>
                          )}

                          {isRestricted && (
                            <>
                              <button
                                type="button"
                                onClick={() => openActionDialog(u, 'suspend')}
                                className="px-2.5 py-1 rounded-md border border-error text-error font-label text-xs hover:bg-error hover:text-on-error transition-colors"
                              >
                                Suspend
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionDialog(u, 'reactivate')}
                                className="px-2.5 py-1 rounded-md bg-success text-on-success font-label text-xs hover:opacity-90 transition-opacity"
                              >
                                Reactivate
                              </button>
                            </>
                          )}

                          {isSuspended && (
                            <button
                              type="button"
                              onClick={() => openActionDialog(u, 'reactivate')}
                              className="px-2.5 py-1 rounded-md bg-success text-on-success font-label text-xs hover:opacity-90 transition-opacity"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openActionDialog(u, 'delete')}
                            title="Delete user permanently"
                            aria-label={`Delete ${u.name}`}
                            className="p-1.5 rounded-md text-xs text-error hover:bg-error/10 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-light-border dark:border-dark-border">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={faUsers}
            title="No users found"
            description="No user accounts match your search query or filter criteria."
            actionText="Clear Filters"
            onAction={() => {
              setSearch('');
              setRoleFilter('All Roles');
              setStatusFilter('All Statuses');
            }}
          />
        )}
      </section>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`User Dossier: ${selectedUser.name}`}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3.5 pb-3 border-b border-light-border dark:border-dark-border">
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full object-cover border border-light-border dark:border-dark-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center font-label font-bold text-base text-primary">
                  {selectedUser.initials || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                  {selectedUser.name}
                </h3>
                <p className="font-mono text-xs text-primary">{selectedUser.id}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs font-body">
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Platform Roles</span>
                <span className="font-semibold">{selectedUser.roles?.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">District / Area</span>
                <span className="font-semibold">{selectedUser.area}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Email</span>
                <span className="font-mono">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Phone</span>
                <span className="font-mono">{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Moderation Status</span>
                <Badge
                  variant={
                    selectedUser.status === 'Active'
                      ? 'success'
                      : selectedUser.status === 'Restricted'
                      ? 'warning'
                      : 'error'
                  }
                  size="sm"
                >
                  {selectedUser.status}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Matches Played / Hosted</span>
                <span className="font-semibold tabular-nums">
                  {selectedUser.matchesPlayed} played • {selectedUser.matchesHosted} hosted
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-light-muted dark:text-dark-muted">Member Since</span>
                <span className="tabular-nums">{selectedUser.joinedDate}</span>
              </div>
            </div>

            {selectedUser.bio && (
              <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-body text-light-muted dark:text-dark-muted">
                {selectedUser.bio}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                icon={faEye}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate(`/players/${selectedUser.id}`);
                }}
              >
                Player Profile View
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={faEye}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate(`/organizers/${selectedUser.id}`);
                }}
              >
                Organizer Profile View
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="danger"
                size="sm"
                icon={faTrashCan}
                onClick={() => openActionDialog(selectedUser, 'delete')}
              >
                Delete Account
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Moderation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, user: null, action: 'restrict' })}
        onConfirm={handleConfirmModeration}
        title={
          dialogState.action === 'delete'
            ? `Permanently Delete ${dialogState.user?.name}?`
            : dialogState.action === 'restrict'
            ? `Restrict ${dialogState.user?.name}?`
            : dialogState.action === 'suspend'
            ? `Suspend Account: ${dialogState.user?.name}?`
            : `Reactivate ${dialogState.user?.name}?`
        }
        message={
          dialogState.action === 'delete'
            ? `This will permanently delete ${dialogState.user?.name} (${dialogState.user?.email || dialogState.user?.id}) along with their profile, sessions, and hosted matches/tournaments. This cannot be undone.`
            : dialogState.action === 'restrict'
            ? `Restrict ${dialogState.user?.name} (${dialogState.user?.id}) from creating new quick matches? They can still join existing matches.`
            : dialogState.action === 'suspend'
            ? `Suspend ${dialogState.user?.name} (${dialogState.user?.id}) immediately? The user will be blocked from match participation and chat access.`
            : `Restore ${dialogState.user?.name} (${dialogState.user?.id}) to Active status with full match creation and player privileges?`
        }
        confirmText={
          dialogState.action === 'delete'
            ? 'Permanently Delete User'
            : dialogState.action === 'restrict'
            ? 'Confirm Restriction'
            : dialogState.action === 'suspend'
            ? 'Confirm Suspension'
            : 'Confirm Reactivation'
        }
        confirmVariant={
          dialogState.action === 'suspend' || dialogState.action === 'delete'
            ? 'danger'
            : 'primary'
        }
      />
    </div>
  );
};

export default UserManagementPage;
