export const FORMS = '/forms';
export const form = ( id ) => `/forms/${ id }`;
export const formDup = ( id ) => `/forms/${ id }/duplicate`;
export const formEntries = ( id ) => `/forms/${ id }/entries`;
export const formExport = ( id ) => `/forms/${ id }/entries/export`;
export const ENTRIES = '/entries';
export const entry = ( id ) => `/entries/${ id }`;
export const entryStatus = ( id ) => `/entries/${ id }/status`;
export const ACTIONS = '/actions';
export const SETTINGS = '/settings';
export const STATS = '/dashboard/stats';
export const TEMPLATES = '/templates';
export const template = ( id ) => `/templates/${ id }`;
export const templateCreate = ( id ) => `/templates/${ id }/create`;

// New (post-restructure) — Integrations hub + Tools sub-screens.
export const INTEGRATIONS = '/integrations';
export const WEBHOOK_SUBS = '/webhook-subscriptions';
export const EMAIL_TEMPLATES = '/email-templates';
export const LOGS = '/logs';
