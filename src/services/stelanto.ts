import pb from '@/lib/pocketbase/client'

export type StelantoWorkDay = {
  date?: string
  status?: string
  processStatus?: string
  timeEntries?: Array<{ time?: string; type?: string }>
  [key: string]: unknown
}

export type StelantoMirrorRow = {
  user?: { name?: string }
  summary?: {
    totalWorked?: number
    extraTime?: number
    missingTime?: number
    [key: string]: unknown
  }
  workDays?: StelantoWorkDay[]
  [key: string]: unknown
}

export type StelantoMirrorResponse = {
  source: 'stelanto'
  format: 'JSON'
  via: string
  granularity: string
  period: { start: string; end: string; userId: string }
  fields: {
    root: string[]
    workDay: string[]
    timeEntry: string[]
    summaryTimeUnit: string
    beatTime: string
  }
  rowCount: number
  rows: StelantoMirrorRow[]
}

export const runStelantoMirrorView = (start: string, end: string) =>
  pb.send<StelantoMirrorResponse>('/backend/v1/stelanto/mirror-view', {
    method: 'POST',
    body: { start, end },
  })
