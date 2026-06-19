import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import CustomerRoute from './CustomerRoute';
import SmartRedirect from './SmartRedirect';
import RouterGuard from '@/guards/RouterGuard';
import PermissionRoute from './PermissionRoute';
import GlobalEventTracker from '@/components/GlobalEventTracker';

import MainLayout from '@/components/layout/MainLayout';

// Páginas públicas
import Auth from '@/pages/Auth';
import EmailConfirmation from '@/components/auth/EmailConfirmation';
import ResetPassword from '@/components/auth/ResetPassword';
import InstagramCallback from '@/pages/InstagramCallback';
import GoogleCallback from '@/pages/GoogleCallback';
import GoogleCalendarCallback from '@/pages/GoogleCalendarCallback';
import GoogleSheetsCallback from '@/pages/GoogleSheetsCallback';
import GitHubCallback from '@/pages/GitHubCallback';
import NotionCallback from '@/pages/NotionCallback';
import StripeCallback from '@/pages/StripeCallback';
import LinearCallback from '@/pages/LinearCallback';
import MondayCallback from '@/pages/MondayCallback';
import AtlassianCallback from '@/pages/AtlassianCallback';
import MicrosoftCallback from '@/pages/MicrosoftCallback';
import SurveyResponse from '@/pages/Public/Survey/SurveyResponse';

// Páginas customer — lazy (code-splitting): cada página vira um chunk próprio,
// baixado só quando a rota é acessada. Reduz o bundle inicial (era ~7MB num arquivo).
const Dashboard = React.lazy(() => import('@/pages/Customer/Dashboard'));
const Agents = React.lazy(() => import('@/pages/Customer/Agents'));
const AgentEditPage = React.lazy(() => import('@/pages/Customer/Agents/Agent/AgentEditPage'));
const MCPServers = React.lazy(() => import('@/pages/Customer/Agents/MCPServers'));
const CustomMCPServers = React.lazy(() => import('@/pages/Customer/Agents/CustomMCPServers'));
const Tools = React.lazy(() => import('@/pages/Customer/Agents/Tools'));
const CustomTools = React.lazy(() => import('@/pages/Customer/Agents/CustomTools'));
const Contacts = React.lazy(() => import('@/pages/Customer/Contacts'));
const ScheduledActions = React.lazy(() => import('@/pages/Customer/Contacts/ScheduledActions'));
const Channels = React.lazy(() => import('@/pages/Customer/Channels').then(m => ({ default: m.Channels })));
const ChannelSettings = React.lazy(() => import('@/pages/Customer/Channels').then(m => ({ default: m.ChannelSettings })));
const NewChannel = React.lazy(() => import('@/pages/Customer/Channels').then(m => ({ default: m.NewChannel })));
const ChatPage = React.lazy(() => import('@/pages/Customer/Chat/ChatPage'));

const Pipelines = React.lazy(() => import('@/pages/Customer/Pipelines/Pipelines'));
const PipelineKanban = React.lazy(() => import('@/pages/Customer/Pipelines/PipelineKanban'));
const AccountSettings = React.lazy(() => import('@/pages/Customer/Settings/Account').then(m => ({ default: m.AccountSettings })));
const Teams = React.lazy(() => import('@/pages/Customer/Settings/Teams/Teams'));
const AddUsers = React.lazy(() => import('@/pages/Customer/Settings/Teams').then(m => ({ default: m.AddUsers })));
const Users = React.lazy(() => import('@/pages/Customer/Settings/Users'));
const RolesPage = React.lazy(() => import('@/pages/Customer/Settings/Roles'));
const Labels = React.lazy(() => import('@/pages/Customer/Settings/Labels'));
const CustomAttributes = React.lazy(() => import('@/pages/Customer/Settings/CustomAttributes'));
const MessageFunnels = React.lazy(() => import('@/pages/Customer/Settings/MessageFunnels').then(m => ({ default: m.MessageFunnels })));
const TemplateVariables = React.lazy(() => import('@/pages/Customer/Settings/TemplateVariables').then(m => ({ default: m.TemplateVariables })));
const WelcomeAutomations = React.lazy(() => import('@/pages/Customer/Settings/WelcomeAutomations').then(m => ({ default: m.WelcomeAutomations })));
const LeadAutomations = React.lazy(() => import('@/pages/Customer/Settings/LeadAutomations').then(m => ({ default: m.LeadAutomations })));
const LeadAdsForms = React.lazy(() => import('@/pages/Customer/Settings/LeadAdsForms'));
const FollowupSequences = React.lazy(() => import('@/pages/Customer/Settings/FollowupSequences').then(m => ({ default: m.FollowupSequences })));
const SiteBuilder = React.lazy(() => import('@/pages/Customer/Settings/SiteBuilder').then(m => ({ default: m.SiteBuilder })));
const DynamicForms = React.lazy(() => import('@/pages/Customer/Settings/DynamicForms').then(m => ({ default: m.DynamicForms })));
const Properties = React.lazy(() => import('@/pages/Customer/Properties').then(m => ({ default: m.Properties })));
const PropertiesMap = React.lazy(() => import('@/pages/Customer/Properties').then(m => ({ default: m.PropertiesMap })));
const Visits = React.lazy(() => import('@/pages/Customer/Visits').then(m => ({ default: m.Visits })));
const Proposals = React.lazy(() => import('@/pages/Customer/Proposals').then(m => ({ default: m.Proposals })));
const PropertyCaptureRequests = React.lazy(() => import('@/pages/Customer/PropertyCapture').then(m => ({ default: m.PropertyCaptureRequests })));
const ClientInstances = React.lazy(() => import('@/pages/SuperAdmin/ClientInstances'));
const Monitoring = React.lazy(() => import('@/pages/SuperAdmin/Monitoring'));
const AutomationTemplatesPage = React.lazy(() => import('@/pages/SuperAdmin/AutomationTemplates/AutomationTemplates'));
const RoletaConfigPage = React.lazy(() => import('@/pages/Customer/Settings/RoletaConfig/RoletaConfig'));
const AutomationsLayout = React.lazy(() => import('@/pages/Customer/Automations/AutomationsLayout'));
const PropertyInterests = React.lazy(() => import('@/pages/Customer/PropertyInterests').then(m => ({ default: m.PropertyInterests })));
const Macros = React.lazy(() => import('@/pages/Customer/Settings/Macros').then(m => ({ default: m.Macros })));
const WhatsappReminders = React.lazy(() => import('@/pages/Customer/Settings/WhatsappReminders'));
const Products = React.lazy(() => import('@/pages/Customer/Settings/Products').then(m => ({ default: m.Products })));
const Integrations = React.lazy(() => import('@/pages/Customer/Settings/Integrations').then(m => ({ default: m.Integrations })));
const EmailTemplateEditor = React.lazy(() => import('@/pages/Customer/Settings/EmailTemplateEditor'));
const WebhooksPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/WebhooksPage'));
const OAuthAppsPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/OAuthAppsPage'));
const DashboardAppsPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/DashboardAppsPage'));
const AccessTokens = React.lazy(() => import('../pages/Customer/Settings/AccessTokens/AccessTokens'));
const SlackIntegrationPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/SlackIntegrationPage'));
const OpenAIPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/OpenAIPage'));
const BMSPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/BMSPage'));
const LeadSquaredPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/LeadSquaredPage'));
const HubSpotPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/HubSpotPage'));
const ShopifyPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/ShopifyPage'));
const LinearPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/LinearPage'));
const DashboardAppPage = React.lazy(() => import('../pages/Customer/DashboardApp'));
const MetaAdsPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/RealEstate/MetaAdsPage'));
const RdStationPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/RealEstate/RdStationPage'));
const Studio360Page = React.lazy(() => import('../pages/Customer/Settings/Integrations/RealEstate/Studio360Page'));
const LeadloversPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/RealEstate/LeadloversPage'));
const OruloPage = React.lazy(() => import('../pages/Customer/Settings/Integrations/RealEstate/OruloPage'));
// import { Overview, Conversations } from '../pages/Customer/Reports';
// import * as Reports from '../pages/Customer/Reports';

// Páginas admin
import AdminSettingsLayout from '@/pages/Admin/Settings';
const SmtpConfig = React.lazy(() => import('@/pages/Admin/Settings/SmtpConfig'));
const StorageConfig = React.lazy(() => import('@/pages/Admin/Settings/StorageConfig'));
const SocialLoginConfig = React.lazy(() => import('@/pages/Admin/Settings/SocialLoginConfig'));
const ChannelConfig = React.lazy(() => import('@/pages/Admin/Settings/ChannelConfig'));
const OpenAIConfig = React.lazy(() => import('@/pages/Admin/Settings/OpenAIConfig'));
const IntegrationsConfig = React.lazy(() => import('@/pages/Admin/Settings/IntegrationsConfig'));
const InboundEmailConfig = React.lazy(() => import('@/pages/Admin/Settings/InboundEmailConfig'));
const FrontendRuntimeConfig = React.lazy(() => import('@/pages/Admin/Settings/FrontendRuntimeConfig'));

// Página de tutoriais
const Tutorials = React.lazy(() => import('@/pages/Customer/Tutorials'));

// Páginas compartilhadas
const Documentation = React.lazy(() => import('@/pages/Shared/Documentation'));
const Marketplace = React.lazy(() => import('@/pages/Shared/Marketplace'));
const Profile = React.lazy(() => import('@/pages/Shared/Profile'));

// Página de setup inicial
import Setup from '@/pages/Setup/Setup';
import OnboardingPage from '@/pages/Setup/OnboardingPage';

// Outras páginas
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import Widget from '@/pages/Widget';
import AsanaCallback from '@/pages/AsanaCallback';
import HubSpotCallback from '@/pages/HubSpotCallback';
import PayPalCallback from '@/pages/PayPalCallback';
import CanvaCallback from '@/pages/CanvaCallback';
import SupabaseCallback from '@/pages/SupabaseCallback';
// import ChangePassword from '../pages/ChangePassword';

const ChatRouteElement = (
  <PrivateRoute>
    <CustomerRoute>
      <MainLayout>
        <PermissionRoute resource="conversations" action="read">
          <Suspense
            fallback={<div className="flex items-center justify-center h-full">Carregando...</div>}
          >
            <ChatPage />
          </Suspense>
        </PermissionRoute>
      </MainLayout>
    </CustomerRoute>
  </PrivateRoute>
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <RouterGuard>
        <GlobalEventTracker />
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
        <Routes>
          {/* Redirecionamento inteligente da raiz baseado no tipo de usuário */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <SmartRedirect />
              </PrivateRoute>
            }
          />

          {/* Rotas públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            }
          />

          <Route
            path="/auth/confirm-email"
            element={
              <PublicRoute>
                <EmailConfirmation />
              </PublicRoute>
            }
          />

          <Route
            path="/auth/confirmation"
            element={
              <PublicRoute>
                <EmailConfirmation />
              </PublicRoute>
            }
          />

          <Route
            path="/auth/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/auth/password/edit"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Instagram OAuth Callback */}
          <Route
            path="/instagram/callback"
            element={
              <PublicRoute>
                <InstagramCallback />
              </PublicRoute>
            }
          />

          {/* Google OAuth Callback */}
          <Route
            path="/google/callback"
            element={
              <PublicRoute>
                <GoogleCallback />
              </PublicRoute>
            }
          />

          {/* Google Calendar OAuth Callback */}
          <Route
            path="/google-calendar/callback"
            element={
              <PublicRoute>
                <GoogleCalendarCallback />
              </PublicRoute>
            }
          />

          {/* Google Sheets OAuth Callback */}
          <Route
            path="/google-sheets/callback"
            element={
              <PublicRoute>
                <GoogleSheetsCallback />
              </PublicRoute>
            }
          />

          {/* GitHub OAuth Callback */}
          <Route
            path="/github/callback"
            element={
              <PublicRoute>
                <GitHubCallback />
              </PublicRoute>
            }
          />

          {/* Notion OAuth Callback */}
          <Route
            path="/notion/callback"
            element={
              <PublicRoute>
                <NotionCallback />
              </PublicRoute>
            }
          />

          {/* Stripe OAuth Callback */}
          <Route
            path="/stripe/callback"
            element={
              <PublicRoute>
                <StripeCallback />
              </PublicRoute>
            }
          />

          {/* Linear OAuth Callback */}
          <Route
            path="/linear/callback"
            element={
              <PublicRoute>
                <LinearCallback />
              </PublicRoute>
            }
          />

          {/* Monday OAuth Callback */}
          <Route
            path="/monday/callback"
            element={
              <PublicRoute>
                <MondayCallback />
              </PublicRoute>
            }
          />

          {/* Atlassian OAuth Callback */}
          <Route
            path="/atlassian/callback"
            element={
              <PublicRoute>
                <AtlassianCallback />
              </PublicRoute>
            }
          />

          {/* Asana OAuth Callback */}
          <Route
            path="/asana/callback"
            element={
              <PublicRoute>
                <AsanaCallback />
              </PublicRoute>
            }
          />

          {/* HubSpot OAuth Callback */}
          <Route
            path="/hubspot/callback"
            element={
              <PublicRoute>
                <HubSpotCallback />
              </PublicRoute>
            }
          />

          {/* PayPal OAuth Callback */}
          <Route
            path="/paypal/callback"
            element={
              <PublicRoute>
                <PayPalCallback />
              </PublicRoute>
            }
          />

          {/* Canva OAuth Callback */}
          <Route
            path="/canva/callback"
            element={
              <PublicRoute>
                <CanvaCallback />
              </PublicRoute>
            }
          />

          {/* Supabase OAuth Callback */}
          <Route
            path="/supabase/callback"
            element={
              <PublicRoute>
                <SupabaseCallback />
              </PublicRoute>
            }
          />

          {/* Microsoft OAuth Callback */}
          <Route
            path="/microsoft/callback"
            element={
              <PublicRoute>
                <MicrosoftCallback />
              </PublicRoute>
            }
          />

          {/* <Route path="/change-password" element={<ChangePassword />} /> */}

          {/* Public widget route (for website embeds) */}
          <Route
            path="/widget"
            element={
              <PublicRoute>
                <Widget />
              </PublicRoute>
            }
          />

          {/* Public survey response route (CSAT surveys) */}
          <Route
            path="/survey/responses/:uuid"
            element={
              <PublicRoute>
                <SurveyResponse />
              </PublicRoute>
            }
          />

          {/* Rota de Setup Inicial */}
          <Route path="/setup" element={<Setup />} />
          <Route path="/setup/onboarding" element={<OnboardingPage />} />

          <Route
            path="/contacts"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="contacts" action="read">
                      <Contacts />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/contacts/:contactId"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="contacts" action="read">
                      <Contacts />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/contacts/scheduled-actions"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="contacts" action="read">
                      <ScheduledActions />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/pipelines"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="pipelines" action="read">
                      <Pipelines />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/pipelines/:pipelineId"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="pipelines" action="read">
                      <PipelineKanban />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Automações — aba única com submenu por setor (substitui os itens
              soltos que viviam em Configurações). As rotas /settings/* antigas
              continuam vivas para deep-links/compat. */}
          <Route
            path="/automations"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <AutomationsLayout />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          >
            <Route
              path="message-funnels"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <PermissionRoute resource="canned_responses" action="read">
                    <MessageFunnels />
                  </PermissionRoute>
                </Suspense>
              }
            />
            <Route
              path="template-variables"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <PermissionRoute resource="canned_responses" action="read">
                    <TemplateVariables />
                  </PermissionRoute>
                </Suspense>
              }
            />
            <Route
              path="lead-automations"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <LeadAutomations />
                </Suspense>
              }
            />
            <Route
              path="lead-ads-forms"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <LeadAdsForms />
                </Suspense>
              }
            />
            <Route
              path="follow-ups"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <FollowupSequences />
                </Suspense>
              }
            />
            <Route
              path="whatsapp-reminders"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <WhatsappReminders />
                </Suspense>
              }
            />
            <Route
              path="roleta-config"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <RoletaConfigPage />
                </Suspense>
              }
            />
          </Route>

          {/* <Route
            path="/automation"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="automations" action="read">
                      <Automation />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/automation/:id/flow"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <PermissionRoute resource="automations" action="update">
                    <AutomationFlowEditor />
                  </PermissionRoute>
                </CustomerRoute>
              </PrivateRoute>
            }
          /> */}

          <Route
            path="/settings/account"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="accounts" action="read">
                      <AccountSettings />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/users"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="users" action="read">
                      <Users />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/roles"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="users" action="read">
                      <RolesPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/teams"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="teams" action="read">
                      <Teams />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/teams/:teamId/add-users"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="teams" action="create">
                      <AddUsers />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/labels"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="labels" action="read">
                      <Labels />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/attributes"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="custom_attribute_definitions" action="read">
                      <CustomAttributes />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Novo módulo unificado — Funis de Mensagem (substitui Prontas + Rápidas) */}
          <Route
            path="/settings/message-funnels"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="canned_responses" action="read">
                      <MessageFunnels />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/template-variables"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="canned_responses" action="read">
                      <TemplateVariables />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Rotas legadas — redirecionam pro novo módulo. Imports e páginas antigas ficam
              vivos durante a janela de migração (rake message_funnels:migrate_legacy copia o conteúdo). */}
          <Route
            path="/settings/canned-responses"
            element={<Navigate to="/settings/message-funnels" replace />}
          />
          <Route
            path="/settings/quick-replies"
            element={<Navigate to="/settings/message-funnels" replace />}
          />

          <Route
            path="/settings/welcome-automations"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <WelcomeAutomations />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/lead-automations"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <LeadAutomations />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/lead-ads-forms"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <LeadAdsForms />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/follow-ups"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <FollowupSequences />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/site-builder"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <SiteBuilder />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/dynamic-forms"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <DynamicForms />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/macros"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="macros" action="read">
                      <Macros />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/whatsapp-reminders"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <WhatsappReminders />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/products"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <Products />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/integrations"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <Integrations />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Redirecionamentos das rotas antigas de settings para agents */}
          <Route
            path="/settings/custom-tools"
            element={<Navigate to="/agents/custom-tools" replace />}
          />

          <Route
            path="/settings/custom-mcp-servers"
            element={<Navigate to="/agents/custom-mcp-servers" replace />}
          />

          <Route
            path="/settings/integrations/webhooks"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="webhooks" action="read">
                      <WebhooksPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/integrations/oauth-apps"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="oauth_applications" action="read">
                      <OAuthAppsPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/integrations/dashboard-apps"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="dashboard_apps" action="read">
                      <DashboardAppsPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/integrations/slack"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <SlackIntegrationPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/openai"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <OpenAIPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/bms"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <BMSPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/leadsquared"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <LeadSquaredPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/hubspot"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <HubSpotPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/shopify"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <ShopifyPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/linear"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <LinearPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Real Estate Integrations */}
          <Route
            path="/settings/integrations/meta-ads"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <MetaAdsPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/rd-station"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <RdStationPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/studio360"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <Studio360Page />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/leadlovers"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <LeadloversPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/integrations/orulo"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <OruloPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Dynamic Dashboard Apps Routes */}
          <Route
            path="/dashboard-app/:appId"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <DashboardAppPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/access-tokens"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="access_tokens" action="read">
                      <AccessTokens />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/integrations/:integrationId"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="integrations" action="read">
                      <div className="p-6">
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">🔧 Configuração</h2>
                            <p className="text-muted-foreground">
                              Página de configuração em desenvolvimento
                            </p>
                          </div>
                        </div>
                      </div>
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Reports Routes */}
          {/* <Route
            path="/reports/overview"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="reports" action="read">
                      <Overview />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports/conversations"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="reports" action="read">
                      <Conversations />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports/users"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="reports" action="read">
                      <Reports.Agents />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports/labels"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="reports" action="read">
                      <Reports.Labels />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/bots"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="bots" action="read">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold mb-2">🤖 Bots</h2>
                          <p className="text-muted-foreground">Página em desenvolvimento</p>
                        </div>
                      </div>
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/channels"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="channels" action="read">
                      <Channels />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/channels/new"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="channels" action="create">
                      <NewChannel />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/channels/:id/settings"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="channels" action="create">
                      <ChannelSettings />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings/email-template-editor"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="message_templates" action="create">
                      <EmailTemplateEditor />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="reports" action="read">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold mb-2">📊 Relatórios</h2>
                          <p className="text-muted-foreground">Página em desenvolvimento</p>
                        </div>
                      </div>
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Rota principal de agents redireciona para /agents/list */}
          <Route path="/agents" element={<Navigate to="/agents/list" replace />} />

          {/* Lista de agentes */}
          <Route
            path="/agents/list"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_agents" action="read">
                      <Agents />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/new"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_agents" action="create">
                      <Agents />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/:id/edit"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_agents" action="update">
                      <AgentEditPage />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/management"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_agents" action="read">
                      <Agents />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/mcp-servers"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_mcp_servers" action="read">
                      <MCPServers />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/custom-mcp-servers"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_custom_mcp_servers" action="read">
                      <CustomMCPServers />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/tools"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_tools" action="read">
                      <Tools />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/agents/custom-tools"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="ai_custom_tools" action="read">
                      <CustomTools />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="dashboard" action="read">
                      <Dashboard />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route path="/conversations" element={ChatRouteElement} />

          <Route path="/conversations/:conversationId" element={ChatRouteElement} />

          {/* Tutoriais */}
          <Route
            path="/tutorials"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <Tutorials />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          {/* Rotas específicas de canais foram integradas no fluxo unificado do NewChannel */}
          {/* Meta e WhatsApp Cloud agora são parte do componente NewChannel */}

          {/* Admin Settings Routes */}
          <Route
            path="/settings/admin"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PermissionRoute resource="installation_configs" action="manage">
                      <AdminSettingsLayout />
                    </PermissionRoute>
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          >
            <Route
              path="email"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <SmtpConfig />
                </Suspense>
              }
            />
            <Route
              path="storage"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <StorageConfig />
                </Suspense>
              }
            />
            <Route
              path="social-login"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <SocialLoginConfig />
                </Suspense>
              }
            />
            <Route
              path="channels"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <ChannelConfig />
                </Suspense>
              }
            />
            <Route
              path="openai"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <OpenAIConfig />
                </Suspense>
              }
            />
            <Route
              path="integrations"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <IntegrationsConfig />
                </Suspense>
              }
            />
            <Route
              path="inbound-email"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <InboundEmailConfig />
                </Suspense>
              }
            />
            <Route
              path="frontend-runtime"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <FrontendRuntimeConfig />
                </Suspense>
              }
            />
          </Route>

          {/* Rotas Compartilhadas */}
          <Route
            path="/documentation"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Documentation />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/properties"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <Properties />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/properties/map"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PropertiesMap />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/visits"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <Visits />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/proposals"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <Proposals />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/property-capture-requests"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PropertyCaptureRequests />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/property-interests"
            element={
              <PrivateRoute>
                <CustomerRoute>
                  <MainLayout>
                    <PropertyInterests />
                  </MainLayout>
                </CustomerRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/marketplace"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Marketplace />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Super Admin — gerenciamento de instâncias de clientes */}
          <Route
            path="/super-admin/clients"
            element={
              <PrivateRoute>
                <MainLayout>
                  <ClientInstances />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Super Admin — monitoramento de saúde dos CRMs */}
          <Route
            path="/super-admin/monitoring"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Monitoring />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Super Admin — biblioteca de templates de automacao */}
          <Route
            path="/super-admin/automation-templates"
            element={
              <PrivateRoute>
                <MainLayout>
                  <AutomationTemplatesPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Settings — roleta de corretores */}
          <Route
            path="/settings/roleta-config"
            element={
              <PrivateRoute>
                <MainLayout>
                  <RoletaConfigPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Rota 403 - Sem permissão */}
          <Route
            path="/unauthorized"
            element={
              <PrivateRoute>
                <Unauthorized />
              </PrivateRoute>
            }
          />

          {/* Rota 404 - Página não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </RouterGuard>
    </BrowserRouter>
  );
};

export default AppRouter;
