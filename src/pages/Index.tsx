import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Eye,
  FileClock,
  KeyRound,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  closeCompetency,
  createCompetency,
  createSensitivePayroll,
  getSensitivePayroll,
  getSessionUser,
  listAuditLogs,
  listCompetencies,
  signIn,
  signOut,
  subscribeToAuth,
  type AuditLog,
  type CompetencyRecord,
  type SensitivePayrollRecord,
  type UserRecord,
} from '@/services/security'
import { runFlipchartConsulta, type FlipchartResponse } from '@/services/flipchart'
import { runStelantoMirrorView, type StelantoMirrorResponse } from '@/services/stelanto'

const SYNTHETIC_FIXTURE_ID = 'k96kzy7knhw5faq'

const roleLabels: Record<string, string> = {
  champion: 'Champion / Gestora',
  analyst: 'Analista RH/DP',
  finance: 'Financeiro',
  homologator: 'Homologadora',
  none: 'Sem permissão',
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('pt-BR') : '—')

const formatCents = (value?: number) =>
  typeof value === 'number'
    ? (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'oculto'

const formatSeconds = (value?: unknown) => {
  const seconds = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(seconds)) return '—'
  const sign = seconds < 0 ? '-' : ''
  const absolute = Math.abs(Math.trunc(seconds))
  const hours = Math.floor(absolute / 3600)
  const minutes = Math.floor((absolute % 3600) / 60)
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const formatMinutes = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '—'
  const minutes = Math.trunc(value)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remainder = minutes % 60
  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (remainder || parts.length === 0) parts.push(`${remainder}min`)
  return parts.join(' ')
}

const getElapsedMinutes = (t0?: string, t1?: string) => {
  if (!t0 || !t1) return null
  const start = new Date(t0).getTime()
  const end = new Date(t1).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
  return Math.round((end - start) / 60000)
}

const Index = () => {
  const [user, setUser] = useState<UserRecord | null>(() => getSessionUser())
  const [loginEmail, setLoginEmail] = useState('champion.f1t02@example.test')
  const [loginPassword, setLoginPassword] = useState('')
  const [fixtureId, setFixtureId] = useState(SYNTHETIC_FIXTURE_ID)
  const [sensitive, setSensitive] = useState<SensitivePayrollRecord | null>(null)
  const [competencies, setCompetencies] = useState<CompetencyRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [fixtureSubject, setFixtureSubject] = useState('fixture-ui-f1-t02')
  const [competencyLabel, setCompetencyLabel] = useState('Competência sintética da F1-T02')
  const [touchTimeByCompetency, setTouchTimeByCompetency] = useState<Record<string, string>>({})
  const [stelantoStart, setStelantoStart] = useState('2026-08-01')
  const [stelantoEnd, setStelantoEnd] = useState('2026-08-31')
  const [stelantoResult, setStelantoResult] = useState<StelantoMirrorResponse | null>(null)
  const [flipchartStart, setFlipchartStart] = useState('2026-08-01')
  const [flipchartEnd, setFlipchartEnd] = useState('2026-08-31')
  const [flipchartResult, setFlipchartResult] = useState<FlipchartResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [fixtureMessage, setFixtureMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => subscribeToAuth(setUser), [])

  const role = user?.role ?? 'none'
  const isAuthenticated = Boolean(user)
  const canWriteSensitive = role === 'champion' || role === 'analyst'
  const canOperateCompetency = role === 'champion' || role === 'analyst'
  const canSeeAudit = role === 'champion'
  const roleLabel = useMemo(() => roleLabels[role] ?? role, [role])

  const run = async (operation: () => Promise<void>, success?: string) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await operation()
      if (success) setMessage(success)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(async () => {
      await signIn(loginEmail.trim(), loginPassword)
      setLoginPassword('')
    }, 'Sessão iniciada. Use apenas fixtures sintéticas nesta prova.')
  }

  const handleLoadSensitive = () =>
    void run(async () => {
      const record = await getSensitivePayroll(fixtureId.trim())
      setSensitive(record)
    }, 'Registro consultado. Campos ausentes foram ocultados pelo backend.')

  const handleCreateFixture = () =>
    void run(async () => {
      setFixtureMessage('')
      const record = await createSensitivePayroll({
        subject: fixtureSubject.trim(),
        cpf: 'CPF-SINTETICO-UI',
        salary_cents: 100,
        pension_cents: 10,
        bank_account: 'CONTA-SINTETICA-UI',
        pix_key: 'PIX-SINTETICO-UI',
      })
      setFixtureId(record.id)
      setSensitive(record)
      setFixtureMessage('Fixture sintética criada. O ID foi preenchido para a próxima consulta.')
    }, 'Fixture sintética criada. O ID foi preenchido para a próxima consulta.')

  const handleLoadCompetencies = () =>
    void run(async () => {
      const result = await listCompetencies()
      setCompetencies(result.items)
    }, 'Competências carregadas.')

  const handleCreateCompetency = () =>
    void run(async () => {
      await createCompetency(competencyLabel.trim())
      const result = await listCompetencies()
      setCompetencies(result.items)
    }, 'Competência aberta; o backend registrou t0.')

  const handleCloseCompetency = (id: string) => {
    const rawValue = touchTimeByCompetency[id]?.trim() ?? ''
    const touchTimeMinutes = Number(rawValue)
    if (
      !rawValue ||
      !Number.isFinite(touchTimeMinutes) ||
      !Number.isInteger(touchTimeMinutes) ||
      touchTimeMinutes <= 0
    ) {
      setMessage('')
      setError('Informe o touch time efetivo em minutos, usando um número inteiro maior que zero.')
      return
    }

    void run(async () => {
      await closeCompetency(id, touchTimeMinutes)
      const result = await listCompetencies()
      setCompetencies(result.items)
    }, 'Competência encerrada; o backend registrou t1 e o touch time.')
  }

  const handleLoadAudit = () =>
    void run(async () => {
      const result = await listAuditLogs()
      setAuditLogs(result.items)
    }, 'Trilha carregada. Ela é somente leitura para a champion.')

  const handleRunStelanto = () =>
    void run(async () => {
      const result = await runStelantoMirrorView(stelantoStart, stelantoEnd)
      setStelantoResult(result)
    }, 'Consulta read-only do Stelanto concluída. A resposta não foi persistida.')

  const handleRunFlipchart = () =>
    void run(async () => {
      const result = await runFlipchartConsulta(flipchartStart, flipchartEnd)
      setFlipchartResult(result)
    }, 'Consulta read-only do Flipchart concluída. A resposta não foi persistida.')

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-3">
            <Badge variant="outline">RH Pucci · F1-T02</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Laboratório de segurança</h1>
            <p className="max-w-3xl text-slate-600">
              Acesso de teste com fixtures sintéticas. Esta tela não aceita dado real e não
              substitui a homologação da champion.
            </p>
          </header>
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Entrar no ambiente
              </CardTitle>
              <CardDescription>
                Use uma das contas sintéticas fornecidas no roteiro de teste humano.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleLogin}>
                <label className="block space-y-2 text-sm font-medium">
                  E-mail
                  <Input
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    type="email"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Senha
                  <Input
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    type="password"
                  />
                </label>
                <Button disabled={busy || !loginEmail || !loginPassword} type="submit">
                  {busy ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível entrar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-3">
            <Badge variant="outline">RH Pucci · F1-T02</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Controle de acesso e auditoria</h1>
            <p className="max-w-3xl text-slate-600">
              Ambiente de prova com RBAC/RLS, trilha append-only e t0/t1. Trabalhe somente com
              registros sintéticos.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm">
            <UserRound className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-semibold">{user.name || user.email}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <Button aria-label="Sair" onClick={signOut} size="icon" variant="ghost">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {message && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Operação concluída</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Operação recusada ou falhou</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseZap className="h-5 w-5 text-blue-600" />
              Prova read-only do Stelanto
            </CardTitle>
            <CardDescription>
              Consulta o espelho JSON por período. O token fica no backend; a resposta não é
              persistida no RH Pucci.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Início
                </span>
                <Input
                  type="date"
                  value={stelantoStart}
                  onChange={(event) => setStelantoStart(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Fim
                </span>
                <Input
                  type="date"
                  value={stelantoEnd}
                  onChange={(event) => setStelantoEnd(event.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || !stelantoStart || !stelantoEnd || role !== 'champion'}
                onClick={handleRunStelanto}
              >
                {busy ? 'Consultando Stelanto…' : 'Executar prova read-only'}
              </Button>
              {stelantoResult && (
                <Button onClick={() => setStelantoResult(null)} variant="outline">
                  Limpar resultado
                </Button>
              )}
            </div>
            {role !== 'champion' && (
              <Alert>
                <LockKeyhole className="h-4 w-4" />
                <AlertTitle>Acesso restrito</AlertTitle>
                <AlertDescription>
                  Apenas a champion pode executar a prova técnica do Stelanto.
                </AlertDescription>
              </Alert>
            )}
            {stelantoResult && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Resposta read-only recebida</AlertTitle>
                  <AlertDescription>
                    {stelantoResult.rowCount} colaborador(es) com dias registrados no período.
                    Nenhum dado foi salvo pelo RH Pucci.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Formato</p>
                    <p className="mt-1 font-semibold">{stelantoResult.format}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Via</p>
                    <p className="mt-1 break-words font-mono text-xs">{stelantoResult.via}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Granularidade</p>
                    <p className="mt-1 text-sm font-semibold">{stelantoResult.granularity}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-sm font-semibold">Campos e unidades comprovados</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Resumo: {stelantoResult.fields.root.join(', ')}. Dia:{' '}
                    {stelantoResult.fields.workDay.join(', ')}. Batida:{' '}
                    {stelantoResult.fields.timeEntry.join(', ')}. Duração em{' '}
                    {stelantoResult.fields.summaryTimeUnit}; horário da batida em{' '}
                    {stelantoResult.fields.beatTime}.
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Batidas</TableHead>
                      <TableHead>Trabalhado</TableHead>
                      <TableHead>Extra</TableHead>
                      <TableHead>Faltante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stelantoResult.rows.map((row, index) => (
                      <TableRow key={`${row.user?.name ?? 'row'}-${index}`}>
                        <TableCell>{row.user?.name ?? '—'}</TableCell>
                        <TableCell>{row.workDays?.length ?? 0}</TableCell>
                        <TableCell>
                          {row.workDays?.reduce(
                            (total, day) => total + (day.timeEntries?.length ?? 0),
                            0,
                          ) ?? 0}
                        </TableCell>
                        <TableCell>{formatSeconds(row.summary?.totalWorked)}</TableCell>
                        <TableCell>{formatSeconds(row.summary?.extraTime)}</TableCell>
                        <TableCell>{formatSeconds(row.summary?.missingTime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseZap className="h-5 w-5 text-emerald-600" />
              Prova read-only do Flipchart
            </CardTitle>
            <CardDescription>
              Consulta viagens e uso de veículos por colaborador. A chave fica no backend; a
              resposta não é persistida no RH Pucci.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Início
                </span>
                <Input
                  type="date"
                  value={flipchartStart}
                  onChange={(event) => setFlipchartStart(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Fim
                </span>
                <Input
                  type="date"
                  value={flipchartEnd}
                  onChange={(event) => setFlipchartEnd(event.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || !flipchartStart || !flipchartEnd || role !== 'champion'}
                onClick={handleRunFlipchart}
              >
                {busy ? 'Consultando Flipchart…' : 'Executar prova read-only'}
              </Button>
              {flipchartResult && (
                <Button onClick={() => setFlipchartResult(null)} variant="outline">
                  Limpar resultado
                </Button>
              )}
            </div>
            {role !== 'champion' && (
              <Alert>
                <LockKeyhole className="h-4 w-4" />
                <AlertTitle>Acesso restrito</AlertTitle>
                <AlertDescription>
                  Apenas a champion pode executar a prova técnica do Flipchart.
                </AlertDescription>
              </Alert>
            )}
            {flipchartResult && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Resposta read-only recebida</AlertTitle>
                  <AlertDescription>
                    {flipchartResult.rowCount} registro(s) retornado(s) no período. Nenhum dado foi
                    salvo pelo RH Pucci.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Formato</p>
                    <p className="mt-1 font-semibold">{flipchartResult.format}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Via</p>
                    <p className="mt-1 break-words font-mono text-xs">{flipchartResult.via}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Granularidade</p>
                    <p className="mt-1 text-sm font-semibold">{flipchartResult.granularity}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-sm font-semibold">Campos e fontes comprovados</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {flipchartResult.fields.join(', ')}. Fontes:{' '}
                    {flipchartResult.sourceValues.join(', ')}.
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Pessoa</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flipchartResult.rows.map((row, index) => (
                      <TableRow key={`${row.source ?? 'row'}-${row.id ?? index}`}>
                        <TableCell className="font-mono text-xs">{row.id ?? '—'}</TableCell>
                        <TableCell>{row.pessoa ?? '—'}</TableCell>
                        <TableCell>{row.data ?? '—'}</TableCell>
                        <TableCell>{row.veiculo ?? '—'}</TableCell>
                        <TableCell>{row.projeto ?? '—'}</TableCell>
                        <TableCell>{row.status ?? '—'}</TableCell>
                        <TableCell>{row.source ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Papel atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{roleLabel}</p>
              <p className="mt-2 text-sm text-slate-500">
                {canWriteSensitive
                  ? 'Pode operar conforme a matriz.'
                  : 'Sem escrita de dado sensível.'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LockKeyhole className="h-5 w-5 text-amber-600" />
                Regra de acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Deny by default. Campos ausentes na resposta são campos ocultados pelo backend.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileClock className="h-5 w-5 text-blue-600" />
                Escopo da prova
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Fixtures sintéticas; nenhum dado real liberado.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Provar leitura de registro sensível
              </CardTitle>
              <CardDescription>
                Analyst deve ver CPF/salário/pensão, finance também conta/PIX; homologator/none
                devem receber 404.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                ID da fixture
                <Input value={fixtureId} onChange={(event) => setFixtureId(event.target.value)} />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy || !fixtureId} onClick={handleLoadSensitive}>
                  {busy ? 'Consultando…' : 'Consultar registro'}
                </Button>
                {canWriteSensitive && (
                  <Button disabled={busy} onClick={handleCreateFixture} variant="secondary">
                    Criar fixture sintética
                  </Button>
                )}
              </div>
              {fixtureMessage && (
                <Alert aria-live="polite">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Operação concluída</AlertTitle>
                  <AlertDescription>{fixtureMessage}</AlertDescription>
                </Alert>
              )}
              {sensitive && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Resposta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Colaborador</TableCell>
                      <TableCell>{sensitive.subject}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CPF</TableCell>
                      <TableCell>{sensitive.cpf ?? 'oculto'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Salário</TableCell>
                      <TableCell>{formatCents(sensitive.salary_cents)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pensão</TableCell>
                      <TableCell>{formatCents(sensitive.pension_cents)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Conta</TableCell>
                      <TableCell>{sensitive.bank_account ?? 'oculto'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>PIX</TableCell>
                      <TableCell>{sensitive.pix_key ?? 'oculto'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5" />
                t0 / t1 da competência
              </CardTitle>
              <CardDescription>
                O backend define t0 ao abrir e t1 ao encerrar; o cliente não consegue sobrescrever
                os horários. Informe o touch time como minutos efetivamente trabalhados. O lead time
                total é calculado como t1 − t0.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canOperateCompetency && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={competencyLabel}
                    onChange={(event) => setCompetencyLabel(event.target.value)}
                  />
                  <Button disabled={busy || !competencyLabel} onClick={handleCreateCompetency}>
                    Abrir competência
                  </Button>
                </div>
              )}
              <Button disabled={busy} onClick={handleLoadCompetencies} variant="outline">
                <RefreshCw className="h-4 w-4" />
                Carregar competências
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>t0</TableHead>
                    <TableHead>t1</TableHead>
                    <TableHead>Touch time</TableHead>
                    <TableHead>Lead time</TableHead>
                    {canOperateCompetency && <TableHead>Ação</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencies.map((competency) => (
                    <TableRow key={competency.id}>
                      <TableCell>{competency.label}</TableCell>
                      <TableCell>
                        <Badge variant={competency.status === 'closed' ? 'secondary' : 'outline'}>
                          {competency.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(competency.t0)}</TableCell>
                      <TableCell>{formatDate(competency.t1)}</TableCell>
                      <TableCell>
                        {competency.status === 'closed' ? (
                          formatMinutes(competency.touch_time_minutes)
                        ) : canOperateCompetency ? (
                          <label className="block space-y-1">
                            <span className="sr-only">
                              Touch time em minutos para {competency.label}
                            </span>
                            <Input
                              aria-label={`Touch time em minutos para ${competency.label}`}
                              className="w-28"
                              disabled={busy}
                              inputMode="numeric"
                              min="1"
                              onChange={(event) =>
                                setTouchTimeByCompetency((current) => ({
                                  ...current,
                                  [competency.id]: event.target.value,
                                }))
                              }
                              placeholder="minutos"
                              step="1"
                              type="number"
                              value={touchTimeByCompetency[competency.id] ?? ''}
                            />
                          </label>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {competency.status === 'closed'
                          ? (() => {
                              const elapsedMinutes = getElapsedMinutes(competency.t0, competency.t1)
                              return elapsedMinutes === null
                                ? 'inconsistente'
                                : formatMinutes(elapsedMinutes)
                            })()
                          : 'em andamento'}
                      </TableCell>
                      {canOperateCompetency && (
                        <TableCell>
                          {competency.status === 'open' && (
                            <Button
                              disabled={busy}
                              onClick={() => handleCloseCompetency(competency.id)}
                              size="sm"
                            >
                              Encerrar
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {canSeeAudit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileClock className="h-5 w-5" />
                Trilha de auditoria
              </CardTitle>
              <CardDescription>
                A champion pode consultar; criação, alteração e exclusão são feitas somente pelo
                backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button disabled={busy} onClick={handleLoadAudit} variant="outline">
                <RefreshCw className="h-4 w-4" />
                Atualizar trilha
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Campos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.occurred_at)}</TableCell>
                      <TableCell className="font-mono text-xs">{log.actor_id}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="font-mono text-xs">{log.record_id}</TableCell>
                      <TableCell>{log.fields || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

export default Index
