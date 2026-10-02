// Persistent project overrides (manual images, custom URLs, statuses) managed via NexaWeb Admin

export interface ProjectOverride {
  manualImage?: string;
  customUrl?: string;
  isPublished?: boolean;
  notes?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'nexaweb_project_overrides';

// Safely get all overrides from persistent localStorage
export function getProjectOverrides(): Record<string, ProjectOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Error reading project overrides from storage:', e);
    return {};
  }
}

// Get manual image for a specific project
export function getManualImageForProject(projectId: string): string | null {
  const overrides = getProjectOverrides();
  return overrides[projectId]?.manualImage || null;
}

// Save or update an override for a project
export function saveProjectOverride(projectId: string, override: Partial<ProjectOverride>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getProjectOverrides();
    const updated = {
      ...current,
      [projectId]: {
        ...current[projectId],
        ...override,
        updatedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexaweb:overrides-updated', { detail: { projectId } }));
  } catch (e) {
    console.error('Error saving project override:', e);
  }
}

// Remove override for a project
export function removeProjectOverride(projectId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getProjectOverrides();
    delete current[projectId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('nexaweb:overrides-updated', { detail: { projectId } }));
  } catch (e) {
    console.error('Error removing project override:', e);
  }
}
