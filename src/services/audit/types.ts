/**
 * Audit log action types
 */
export enum AuditAction {
  LIST_USERS = 'LIST_USERS',
  ASSIGN_ROLE = 'ASSIGN_ROLE',
  REVOKE_ROLE = 'REVOKE_ROLE',
  REVOKE_API_KEY = 'REVOKE_API_KEY',
  CREATE_API_KEY = 'CREATE_API_KEY',
  DELETE_USER = 'DELETE_USER',
  EXPORT_AUDIT_LOGS = 'EXPORT_AUDIT_LOGS',
  // Policy engine mutations
  POLICY_RULE_CREATED = 'POLICY_RULE_CREATED',
  POLICY_RULE_UPDATED = 'POLICY_RULE_UPDATED',
  POLICY_RULE_DELETED = 'POLICY_RULE_DELETED',
  ISSUE_IMPERSONATION_TOKEN = 'ISSUE_IMPERSONATION_TOKEN',
  REVOKE_IMPERSONATION_TOKEN = 'REVOKE_IMPERSONATION_TOKEN',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string
  timestamp: string
  adminId: string
  adminEmail: string
  action: AuditAction
  targetUserId: string
  targetUserEmail: string
  details: Record<string, unknown>
  ipAddress?: string
  status: 'success' | 'failure'
  errorMessage?: string
}
