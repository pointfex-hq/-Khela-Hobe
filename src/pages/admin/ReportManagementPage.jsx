import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag,
  faSearch,
  faTriangleExclamation,
  faCheckCircle,
  faBan,
  faEye,
  faClock,
  faUser,
  faCalendarCheck,
  faCheck,
  faXmark,
  faFilter,
  faLocationDot,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { reportService } from '../../services/endpoints/reportService';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';
import Pagination from '../../components/common/Pagination';

export const ReportManagementPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Investigation Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Resolution Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [reportToResolve, setReportToResolve] = useState(null);
  const [resolveAction, setResolveAction] = useState('resolve'); // 'resolve' or 'reject'
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchReports = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await reportService.getReports({
        search,
        category: categoryFilter,
        status: statusFilter,
        page: targetPage - 1,
        size: 12,
      });
      if (res.success) {
        setReports(res.data || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    fetchReports(page);
  }, [categoryFilter, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const openInvestigateModal = (report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const openResolveDialog = (report, action = 'resolve') => {
    setReportToResolve(report);
    setResolveAction(action);
    setResolutionNote(
      action === 'resolve'
        ? 'Verified issue and addressed policy resolution with match host.'
        : 'Investigation concluded report was unfounded or resolved between players.'
    );
    setIsResolveModalOpen(true);
  };

  const handleConfirmResolution = async (e) => {
    e.preventDefault();
    if (!reportToResolve) return;

    try {
      setResolving(true);
      const res = await reportService.reviewReport(reportToResolve.id, {
        action: resolveAction,
        note: resolutionNote,
      });
      if (res.success) {
        toastService.success(res.message);
        setIsResolveModalOpen(false);
        if (selectedReport?.id === reportToResolve.id) {
          setIsDetailModalOpen(false);
        }
        fetchReports();
      }
    } catch {
      toastService.error('Failed to update report resolution.');
    } finally {
      setResolving(false);
    }
  };

  const pendingCount = reports.filter((r) => r.status === 'Pending').length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl w-full mx-auto pb-16">
      {/* Top Header (Reference lines 190-194 in UIUX/reports_management/code.html) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
              Reports &amp; Moderation Queue
            </h1>
            {pendingCount > 0 && (
              <Badge variant="warning" size="sm" hasDot>
                {pendingCount} Pending Review
              </Badge>
            )}
          </div>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Investigate player disputes, unsafe turf conditions, fee escalations, and host no-shows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>All Categories</option>
            <option>Misleading Venue</option>
            <option>Unverified Fee Change</option>
            <option>Match No-Show</option>
            <option>Safety Hazard</option>
            <option>Aggressive Behavior</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Resolved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by ID (e.g. R-209), Match ID (e.g. KH-3911), or reporter name..."
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

      {/* Reports List (Reference lines 196-215 in UIUX/reports_management/code.html) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px]">
          <LoadingSpinner size="lg" text="Loading moderation reports..." />
        </div>
      ) : reports.length > 0 ? (
        <>
        <div className="flex flex-col gap-4">
          {reports.map((report) => {
            const isPending = report.status === 'Pending';
            const isResolved = report.status === 'Resolved';
            const isRejected = report.status === 'Rejected';

            return (
              <article
                key={report.id}
                className={`rounded-lg bg-light-surface dark:bg-dark-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                  isPending
                    ? 'border border-warning/70 hover:border-warning'
                    : 'border border-light-border dark:border-dark-border'
                }`}
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-label text-xs font-semibold ${
                        isPending
                          ? 'bg-warning text-on-warning'
                          : isResolved
                          ? 'bg-success text-on-success'
                          : 'bg-error text-on-error'
                      }`}
                    >
                      {report.status}
                    </span>

                    <span className="font-mono text-xs text-primary font-bold">
                      #{report.id}
                    </span>

                    <span className="font-label text-xs text-light-muted dark:text-dark-muted">
                      {report.category} • Match #{report.matchId}
                    </span>

                    {report.severity === 'Critical' && (
                      <span className="px-2 py-0.5 rounded bg-error/20 text-error font-mono text-[10px] font-bold">
                        CRITICAL HAZARD
                      </span>
                    )}
                  </div>

                  <h2 className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                    Reported by {report.reporterName} • {report.timestamp}
                  </h2>

                  <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
                    <strong className="text-light-on-surface dark:text-dark-on-surface font-semibold">
                      Reason:
                    </strong>{' '}
                    {report.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-light-border dark:border-dark-border">
                  <Button
                    variant="tertiary"
                    size="sm"
                    icon={faEye}
                    onClick={() => openInvestigateModal(report)}
                  >
                    Investigate
                  </Button>

                  {isPending && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={faCheck}
                        onClick={() => openResolveDialog(report, 'resolve')}
                      >
                        Resolve
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="!text-error !border-error hover:!bg-error/10"
                        icon={faXmark}
                        onClick={() => openResolveDialog(report, 'reject')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="pt-2"
          />
        )}
      </>
      ) : (
        <EmptyState
          icon={faFlag}
          title="No reports match your filters"
          description="The moderation queue is currently clear of flagged safety or policy reports for this selection."
          actionText="Show All Reports"
          onAction={() => {
            setSearch('');
            setCategoryFilter('All Categories');
            setStatusFilter('All Statuses');
          }}
        />
      )}

      {/* Investigation Details Modal */}
      {selectedReport && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Safety Report Dossier: #${selectedReport.id}`}
          maxWidth="max-w-lg"
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between pb-3 border-b border-light-border dark:border-dark-border">
              <div>
                <span className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                  {selectedReport.category}
                </span>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Match: {selectedReport.matchTitle} (#{selectedReport.matchId})
                </p>
              </div>
              <Badge
                variant={
                  selectedReport.status === 'Pending'
                    ? 'warning'
                    : selectedReport.status === 'Resolved'
                    ? 'success'
                    : 'error'
                }
                size="sm"
              >
                {selectedReport.status}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-xs font-body">
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Reporting Player</span>
                <span className="font-semibold">
                  {selectedReport.reporterName} ({selectedReport.reporterId})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Submission Time</span>
                <span className="font-mono">{selectedReport.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Severity Rating</span>
                <span className="font-semibold text-warning">{selectedReport.severity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Evidence Submitted</span>
                <span className="font-mono">{selectedReport.evidenceCount} attachments</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-body">
              <span className="font-label font-bold text-light-on-surface dark:text-dark-on-surface">
                Reported Circumstance:
              </span>
              <p className="text-light-on-surface dark:text-dark-on-surface leading-relaxed">
                {selectedReport.details || selectedReport.reason}
              </p>
            </div>

            {selectedReport.resolutionNote && (
              <div className="p-3 rounded-md bg-success/10 border border-success/30 text-xs font-body text-success">
                <strong>Resolution Note:</strong> {selectedReport.resolutionNote}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-light-border dark:border-dark-border">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {selectedReport.status === 'Pending' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="!text-error !border-error hover:!bg-error/10"
                    onClick={() => openResolveDialog(selectedReport, 'reject')}
                  >
                    Reject Report
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openResolveDialog(selectedReport, 'resolve')}
                  >
                    Resolve Report
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Resolution Confirmation Modal */}
      {reportToResolve && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title={
            resolveAction === 'resolve'
              ? `Resolve Safety Report #${reportToResolve.id}`
              : `Reject Report #${reportToResolve.id}`
          }
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmResolution} className="flex flex-col gap-4 py-2">
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              {resolveAction === 'resolve'
                ? `Confirming resolution for #${reportToResolve.id} (${reportToResolve.category}). Enter an administrative note for the audit log:`
                : `Dismissing report #${reportToResolve.id}. Enter the justification for rejection:`}
            </p>

            <div className="flex flex-col gap-1">
              <label htmlFor="resolutionNotes" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
                Administrative Resolution Note
              </label>
              <textarea
                id="resolutionNotes"
                required
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Details of action taken, organizer contact, or arbitration result..."
                className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResolveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={resolveAction === 'resolve' ? 'primary' : 'outline'}
                size="sm"
                loading={resolving}
                className={resolveAction === 'reject' ? '!text-error !border-error hover:!bg-error/10' : ''}
              >
                {resolveAction === 'resolve' ? 'Confirm Resolution' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ReportManagementPage;
