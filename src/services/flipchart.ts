import pb from '@/lib/pocketbase/client'

export type FlipchartRow = {
  id?: string
  pessoa?: string
  data?: string
  veiculo?: string | null
  projeto?: string | null
  observacoes?: string | null
  status?: string
  source?: 'flipchart' | 'movimento' | string
}

export type FlipchartResponse = {
  source: 'flipchart'
  format: 'JSON'
  via: string
  granularity: string
  period: { dataInicio: string; dataFim: string }
  fields: string[]
  sourceValues: string[]
  rowCount: number
  rows: FlipchartRow[]
}

export const runFlipchartConsulta = (dataInicio: string, dataFim: string) =>
  pb.send<FlipchartResponse>(
    `/backend/v1/flipchart/consulta?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}`,
    { method: 'GET' },
  )
