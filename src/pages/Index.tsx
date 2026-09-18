import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
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
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
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

  const handleCloseCompetency = (id: string) =>
    void run(async () => {
      await closeCompetency(id)
      const result = await listCompetencies()
      setCompetencies(result.items)
    }, 'Competência encerrada; o backend registrou t1.')

  const handleLoadAudit = () =>
    void run(async () => {
      const result = await listAuditLogs()
      setAuditLogs(result.items)
    }, 'Trilha carregada. Ela é somente leitura para a champion.')

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
                os horários.
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
