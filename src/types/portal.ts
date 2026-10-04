/**
 * Tipos TypeScript da Área do Cliente (Portal do Cliente NexaWeb)
 * Espelham rigorosamente os contratos de dados retornados pelas APIs do portal.
 */

export interface PortalClient {
  name: string | null;
  business_name: string | null;
}

export interface PortalProject {
  id: string;
  name: string;
  plan: string;
  status: string;
  current_stage: string | null;
  progress_percent: number | null;
  headline_message: string | null;
  staging_url: string | null;
  production_url: string | null;
  estimated_delivery_date: string | null;
  published_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalUpdate {
  id: string;
  title: string;
  message: string;
  stage: string | null;
  progress_snapshot: number | null;
  created_at: string;
}

export interface PortalRequest {
  id: string;
  category: string | null;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalReview {
  id: string;
  version_label: string;
  test_url: string | null;
  status: string;
  client_feedback: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface PortalProjectResponse {
  success: boolean;
  project?: PortalProject;
  client?: PortalClient;
  updates?: PortalUpdate[];
  requests?: PortalRequest[];
  reviews?: PortalReview[];
  error?: string;
}

export interface PortalAuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}
