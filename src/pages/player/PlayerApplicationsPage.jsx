import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines,
  faClock,
  faCheck,
  faBan,
  faArrowRotateLeft,
  faChevronRight,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { applicationService } from '../../services/endpoints/applicationService';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

export const PlayerApplicationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const tabs = [
    { id: 'all', label: 'All Applications' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'withdrawn', label: 'Withdrawn' },
  ];

  const fetchApplications = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await applicationService.getMyApplications(activeTab, {
        page: targetPage - 1,
        size: 10,
      });
      setApplications(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchApplications(page);
  }, [activeTab, page]);

  const handleWithdraw = async (appId) => {
    try {
      const res = await applicationService.withdrawApplication(appId);
      toast.success(res.message || 'Application withdrawn');
      fetchApplications();
    } catch {
      toast.error('Failed to withdraw application');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm font-bold shrink-0">
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-error text-on-error font-label text-label-sm font-bold shrink-0">
            Rejected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted font-label text-label-sm font-medium shrink-0">
            Withdrawn
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-warning text-on-warning font-label text-label-sm font-bold shrink-0">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-headline-lg font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            My Applications
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted mt-1">
            Track your pending, approved, and archived match participation requests.
          </p>
        </div>

        <Link to={ROUTES.EXPLORE_MATCHES}>
          <Button variant="primary" size="md" icon={faMagnifyingGlass}>
            Discover Matches
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-light-border dark:border-dark-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-label text-sm whitespace-nowrap transition-colors relative font-semibold ${
                isActive
                  ? 'text-primary'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="p-12 text-center text-light-muted dark:text-dark-muted font-body">
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col items-center gap-3">
            <FontAwesomeIcon icon={faFileLines} className="text-3xl text-light-muted dark:text-dark-muted" />
            <h3 className="font-headline text-lg font-bold">No applications found in this category</h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted max-w-sm">
              Explore open turfs and pickup scrimmages across Dhaka and apply to join.
            </p>
            <Link to={ROUTES.EXPLORE_MATCHES}>
              <Button variant="primary" size="sm">
                Explore Matches
              </Button>
            </Link>
          </div>
        ) : (
          applications.map((app) => (
            <article
              key={app.id}
              className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm hover:border-primary transition-colors"
            >
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getStatusBadge(app.status)}
                  <span className="px-2.5 py-0.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated font-label text-label-sm text-light-muted dark:text-dark-muted font-medium shrink-0">
                    {app.sport}
                  </span>
                  <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
                    {app.appliedAt}
                  </span>
                </div>

                <Link to={`/matches/${app.matchId}`}>
                  <h2 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary transition-colors">
                    {app.matchTitle}
                  </h2>
                </Link>

                <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
                  {app.area} • {app.date}, {app.time} • Organizer:{' '}
                  <span className="text-light-on-surface dark:text-dark-on-surface font-semibold">
                    {app.organizerName}
                  </span>
                </p>

                {app.playerNote && (
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted italic">
                    Note sent: "{app.playerNote}"
                  </p>
                )}

                {app.organizerNote && (
                  <p className="font-body text-xs text-secondary dark:text-primary font-medium">
                    Organizer response: "{app.organizerNote}"
                  </p>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link to={`/matches/${app.matchId}`}>
                  <Button variant="tertiary" size="md">
                    View Match
                  </Button>
                </Link>

                {app.status === 'pending' && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => handleWithdraw(app.id)}
                  >
                    Withdraw
                  </Button>
                )}

                {app.status === 'accepted' && (
                  <Link to={ROUTES.PLAYER_TICKETS}>
                    <Button variant="primary" size="md">
                      View Pass
                    </Button>
                  </Link>
                )}

                {app.status === 'rejected' && (
                  <Link to={ROUTES.EXPLORE_MATCHES}>
                    <Button variant="secondary" size="md">
                      Find Similar
                    </Button>
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="pt-2"
        />
      )}
    </div>
  );
};

export default PlayerApplicationsPage;
