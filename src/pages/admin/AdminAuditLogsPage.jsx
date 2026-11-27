import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faSearch,
  faRotateRight,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { adminService } from '../../services/endpoints/adminService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTimeDhaka } from '../../utils/formatters';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        action: actionFilter,
        entityType: entityFilter,
        q: search.trim() || undefined,
        size: 50,
      });
      setLogs(res.data || []);
      if (Array.isArray(res.availableActions)) {
        setActions(res.availableActions);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl flex items-center gap-2.5">
            <FontAwesomeIcon icon={faClipboardList} className="text-primary" />
            <span>Platform Audit Logs</span>
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Chronological trail of account registrations, organizer approvals, ticket scans, moderation actions, and password resets.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="self-start sm:self-auto px-3.5 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary font-label text-xs font-semibold flex items-center gap-1.5"
        >
          <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin text-primary' : 'text-primary'} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Filters */}
      <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLogs();
          }}
          className="sm:col-span-2 flex gap-2"
        >
          <div className="relative flex-1 flex items-center">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 text-light-muted dark:text-dark-muted text-xs"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes, actor email, entity ID..."
              className="w-full pl-8 pr-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold shrink-0"
          >
            Search
          </button>
        </form>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs sm:text-sm"
        >
          <option value="ALL">All Entity Types</option>
          <option value="USER">USER</option>
          <option value="TOURNAMENT">TOURNAMENT</option>
          <option value="MATCH">MATCH</option>
          <option value="TICKET">TICKET</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs sm:text-sm"
        >
          <option value="ALL">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" message="Loading audit entries..." />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={faUserShield}
          title="No audit events match your filter"
          description="System actions such as user signups, organizer approvals, ticket scans, and tournament changes appear here."
        />
      ) : (
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden shadow-sm">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-light-border dark:divide-dark-border">
            {logs.map((log) => (
              <div key={`mob-${log.id}`} className="p-4 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono text-[10px] font-bold">
                    {log.action}
                  </span>
                  <span className="font-mono text-[11px] text-light-muted dark:text-dark-muted">
                    {log.createdAt ? formatDateTimeDhaka(log.createdAt) : ''}
                  </span>
                </div>
                <p className="font-semibold text-light-on-surface dark:text-dark-on-surface">
                  {log.actorName} {log.actorEmail ? `(${log.actorEmail})` : ''}
                </p>
                <p className="text-light-muted dark:text-dark-muted">
                  [{log.entityType}] {log.notes || log.entityId || 'Recorded action'}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated font-label text-xs uppercase text-light-muted dark:text-dark-muted">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-light-surface-elevated/40 dark:hover:bg-dark-surface-elevated/40">
                    <td className="py-3 px-4 font-mono text-xs text-light-muted dark:text-dark-muted whitespace-nowrap">
                      {log.createdAt ? formatDateTimeDhaka(log.createdAt) : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block">{log.actorName}</span>
                      {log.actorEmail && (
                        <span className="text-[11px] text-light-muted dark:text-dark-muted">{log.actorEmail}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {log.entityType}
                      {log.entityId ? ` #${String(log.entityId).slice(-6)}` : ''}
                    </td>
                    <td className="py-3 px-4 text-xs text-light-muted dark:text-dark-muted">
                      <span>{log.notes || '-'}</span>
                      {log.ipAddress && (
                        <span className="block font-mono text-[10px] opacity-75">IP: {log.ipAddress}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
