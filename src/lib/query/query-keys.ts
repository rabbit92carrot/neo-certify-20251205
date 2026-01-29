export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...queryKeys.inventory.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.inventory.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.inventory.all, 'detail', id] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.organizations.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.organizations.all, 'detail', id] as const,
  },
  history: {
    all: ['history'] as const,
    lists: () => [...queryKeys.history.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.history.lists(), filters] as const,
  },
  treatments: {
    all: ['treatments'] as const,
    lists: () => [...queryKeys.treatments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.treatments.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.treatments.all, 'detail', id] as const,
  },
  lots: {
    all: ['lots'] as const,
    lists: () => [...queryKeys.lots.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.lots.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.lots.all, 'detail', id] as const,
  },
  shipments: {
    all: ['shipments'] as const,
    lists: () => [...queryKeys.shipments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.shipments.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.shipments.all, 'detail', id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: (orgId: string) =>
      [...queryKeys.dashboard.all, 'stats', orgId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, 'unread-count'] as const,
  },
} as const;
