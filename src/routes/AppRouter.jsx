import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Pages - Public
import LandingPage from '../pages/public/LandingPage';
import ExploreMatchesPage from '../pages/public/ExploreMatchesPage';
import MatchDetailsPage from '../pages/public/MatchDetailsPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import UnauthorizedPage from '../pages/public/UnauthorizedPage';
import ComponentShowcasePage from '../pages/public/ComponentShowcasePage';
import AboutUsPage from '../pages/public/AboutUsPage';

// Pages - Auth
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Pages - Workspaces
import PlayerHomePage from '../pages/player/PlayerHomePage';
import PlayerMapView from '../pages/player/PlayerMapView';
import PlayerMyMatchesPage from '../pages/player/PlayerMyMatchesPage';
import PlayerApplicationsPage from '../pages/player/PlayerApplicationsPage';
import PlayerTicketsPage from '../pages/player/PlayerTicketsPage';
import PlayerProfilePage from '../pages/player/PlayerProfilePage';
import PlayerEditProfilePage from '../pages/player/PlayerEditProfilePage';
import PlayerNotificationsPage from '../pages/player/PlayerNotificationsPage';
import OrganizerDashboardPage from '../pages/organizer/OrganizerDashboardPage';
import CreateQuickMatchPage from '../pages/organizer/CreateQuickMatchPage';
import MyCreatedMatchesPage from '../pages/organizer/MyCreatedMatchesPage';
import MatchManagementPage from '../pages/organizer/MatchManagementPage';
import ApplicationReviewPage from '../pages/organizer/ApplicationReviewPage';
import ParticipantManagementPage from '../pages/organizer/ParticipantManagementPage';
import OrganizerProfilePage from '../pages/organizer/OrganizerProfilePage';
import EventManagementPage from '../pages/organizer/EventManagementPage';
import CreateEditEventPage from '../pages/organizer/CreateEditEventPage';
import EventDetailsPage from '../pages/public/EventDetailsPage';
import TicketBookingPage from '../pages/public/TicketBookingPage';
import TicketCheckInPage from '../pages/organizer/TicketCheckInPage';
import GuardianDashboardPage from '../pages/guardian/GuardianDashboardPage';
import LinkedChildrenPage from '../pages/guardian/LinkedChildrenPage';
import ChildActivityPage from '../pages/guardian/ChildActivityPage';
import ChildSafetySettingsPage from '../pages/guardian/ChildSafetySettingsPage';
import SafetyAlertsPage from '../pages/guardian/SafetyAlertsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import SportsManagementPage from '../pages/admin/SportsManagementPage';
import MatchModerationPage from '../pages/admin/MatchModerationPage';
import ReportManagementPage from '../pages/admin/ReportManagementPage';
import ScrollToTop from '../components/common/ScrollToTop';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes with Header & Footer */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.EXPLORE_MATCHES} element={<ExploreMatchesPage />} />
          <Route path={ROUTES.MATCH_DETAILS} element={<MatchDetailsPage />} />
          <Route path={ROUTES.EVENT_DETAILS} element={<EventDetailsPage />} />
          <Route path={ROUTES.TICKET_BOOKING} element={<TicketBookingPage />} />
          <Route path={ROUTES.PUBLIC_ORGANIZER_PROFILE} element={<OrganizerProfilePage />} />
          <Route path={ROUTES.DESIGN_SYSTEM} element={<ComponentShowcasePage />} />
          <Route path={ROUTES.COMPONENTS} element={<ComponentShowcasePage />} />
          <Route path={ROUTES.ABOUT} element={<AboutUsPage />} />
          <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Route>

        {/* Auth Routes with Centered Card Layout */}
        <Route element={<AuthLayout />}>
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute restricted>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute restricted>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={
              <PublicRoute restricted>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.RESET_PASSWORD}
            element={
              <PublicRoute restricted>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />
        </Route>

        {/* Player Workspace */}
        <Route
          path="/player"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PLAYER, ROLES.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.PLAYER_DASHBOARD} replace />} />
          <Route path="dashboard" element={<PlayerHomePage />} />
          <Route path="explore" element={<ExploreMatchesPage />} />
          <Route path="map" element={<PlayerMapView />} />
          <Route path="my-matches" element={<PlayerMyMatchesPage />} />
          <Route path="applications" element={<PlayerApplicationsPage />} />
          <Route path="tickets" element={<PlayerTicketsPage />} />
          <Route path="profile" element={<PlayerProfilePage />} />
          <Route path="profile/edit" element={<PlayerEditProfilePage />} />
          <Route path="notifications" element={<PlayerNotificationsPage />} />
          <Route path="matches/:matchId" element={<MatchDetailsPage />} />
        </Route>

        {/* Organizer Workspace */}
        <Route
          path="/organizer"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ORGANIZER_DASHBOARD} replace />} />
          <Route path="dashboard" element={<OrganizerDashboardPage />} />
          <Route path="create-match" element={<CreateQuickMatchPage />} />
          <Route path="my-matches" element={<MyCreatedMatchesPage />} />
          <Route path="events" element={<EventManagementPage />} />
          <Route path="events/create" element={<CreateEditEventPage />} />
          <Route path="events/:eventId/edit" element={<CreateEditEventPage isEdit />} />
          <Route path="events/:eventId" element={<EventDetailsPage />} />
          <Route path="matches/:matchId" element={<MatchManagementPage />} />
          <Route path="matches/:matchId/edit" element={<CreateQuickMatchPage isEdit />} />
          <Route path="matches/:matchId/applications" element={<ApplicationReviewPage />} />
          <Route path="matches/:matchId/participants" element={<ParticipantManagementPage />} />
          <Route path="review-applications" element={<ApplicationReviewPage />} />
          <Route path="ticket-check-in" element={<TicketCheckInPage />} />
          <Route path="events/:eventId/check-in" element={<TicketCheckInPage />} />
          <Route path="profile" element={<OrganizerProfilePage />} />
          <Route path="profile/edit" element={<OrganizerProfilePage />} />
        </Route>

        {/* Guardian Workspace */}
        <Route
          path="/guardian"
          element={
            <ProtectedRoute allowedRoles={[ROLES.GUARDIAN, ROLES.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.GUARDIAN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<GuardianDashboardPage />} />
          <Route path="linked-children" element={<LinkedChildrenPage />} />
          <Route path="child-activity" element={<ChildActivityPage />} />
          <Route path="children/:childId/activity" element={<ChildActivityPage />} />
          <Route path="safety-settings" element={<ChildSafetySettingsPage />} />
          <Route path="safety-alerts" element={<SafetyAlertsPage />} />
        </Route>

        {/* Admin Workspace */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="match-moderation" element={<MatchModerationPage />} />
          <Route path="sports" element={<SportsManagementPage />} />
          <Route path="reports" element={<ReportManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
