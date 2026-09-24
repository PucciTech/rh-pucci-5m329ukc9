import type { RecordModel } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

export type Role = 'champion' | 'analyst' | 'finance' | 'homologator' | 'none'

export type UserRecord = RecordModel & {
  email: string
  name: string
  role: Role
}

export type SensitivePayrollRecord = RecordModel & {
  subject: string
  cpf?: string
  salary_cents?: number
  pension_cents?: number
  bank_account?: string
  pix_key?: string
}

export type CompetencyRecord = RecordModel & {
  label: string
  status: 'open' | 'closed'
  t0: string
  t1?: string
  touch_time_minutes?: number | null
}

export type AuditLog = RecordModel & {
  actor_id: string
  action: 'read' | 'create' | 'update' | 'delete'
  collection_name: string
  record_id: string
  fields?: string
  occurred_at: string
  outcome: 'allowed'
}

export const getSessionUser = (): UserRecord | null => {
  if (!pb.authStore.isValid || !pb.authStore.record) return null
  return pb.authStore.record as UserRecord
}

export const subscribeToAuth = (callback: (user: UserRecord | null) => void) =>
  pb.authStore.onChange((_token, record) => {
    callback(pb.authStore.isValid && record ? (record as UserRecord) : null)
  })

export const signIn = (email: string, password: string) =>
  pb.collection<UserRecord>('users').authWithPassword(email, password)

export const signOut = () => pb.authStore.clear()

export const getSensitivePayroll = (id: string) =>
  pb.collection<SensitivePayrollRecord>('sensitive_payroll').getOne(id)

export const createSensitivePayroll = (data: {
  subject: string
  cpf: string
  salary_cents: number
  pension_cents: number
  bank_account: string
  pix_key: string
}) => pb.collection<SensitivePayrollRecord>('sensitive_payroll').create(data)

export const listCompetencies = () =>
  pb.collection<CompetencyRecord>('competencies').getList(1, 20, { sort: '-created' })

export const createCompetency = (label: string) =>
  pb.collection<CompetencyRecord>('competencies').create({ label, status: 'open' })

export const closeCompetency = (id: string, touchTimeMinutes: number) =>
  pb.collection<CompetencyRecord>('competencies').update(id, {
    status: 'closed',
    touch_time_minutes: touchTimeMinutes,
  })

export const listAuditLogs = () =>
  pb.collection<AuditLog>('audit_logs').getList(1, 50, { sort: '-occurred_at' })
