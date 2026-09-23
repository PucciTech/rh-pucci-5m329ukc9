routerAdd(
  'POST',
  '/backend/v1/stelanto/mirror-view',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('role') !== 'champion') {
      return e.forbiddenError('Somente a champion pode executar esta prova.')
    }

    const body = e.requestInfo().body || {}
    const start = typeof body.start === 'string' ? body.start.trim() : ''
    const end = typeof body.end === 'string' ? body.end.trim() : ''

    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
      const parsed = new Date(value + 'T00:00:00Z')
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    }

    if (!isValidDate(start) || !isValidDate(end)) {
      return e.badRequestError('Informe start e end no formato yyyy-MM-dd.')
    }

    const startDate = new Date(start + 'T00:00:00Z')
    const endDate = new Date(end + 'T00:00:00Z')
    const periodDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1

    if (periodDays < 1) {
      return e.badRequestError('O início do período deve ser anterior ou igual ao fim.')
    }
    if (periodDays > 31) {
      return e.badRequestError('A prova está limitada a 31 dias por consulta.')
    }

    const token = $secrets.get('STELANTO_TOKEN')
    if (!token) {
      return e.json(503, {
        code: 'stelanto_not_configured',
        message: 'A credencial read-only do Stelanto não está configurada.',
      })
    }

    const payload = {
      reportKind: 'WORK_DAYS',
      start,
      end,
      userId: 'ALL',
      showInactivates: false,
      queryParam: {},
      extensionType: 'PDF',
      fontSize: 'NORMAL',
      isDraft: false,
      sendEmailToUsers: false,
      showSignFields: false,
      splitByMonth: false,
    }

    let upstream
    try {
      upstream = $http.send({
        url: 'https://api.pipemais.com.br/api/reports/generate/mirror/view',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token.trim(),
        },
        body: JSON.stringify(payload),
        timeout: 60,
      })
    } catch (error) {
      $app
        .logger()
        .error(
          'Stelanto mirror transport failed',
          'message',
          error && error.message ? error.message : String(error),
        )
      return e.json(502, {
        code: 'stelanto_unreachable',
        message: 'Não foi possível alcançar o Stelanto.',
      })
    }

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      $app.logger().warn('Stelanto mirror rejected request', 'status', upstream.statusCode)
      const code =
        upstream.statusCode === 401 || upstream.statusCode === 403
          ? 'stelanto_auth_failed'
          : upstream.statusCode === 429
            ? 'stelanto_rate_limited'
            : 'stelanto_upstream_error'
      return e.json(502, {
        code,
        upstreamStatus: upstream.statusCode,
        message:
          code === 'stelanto_auth_failed'
            ? 'O Stelanto recusou a credencial configurada.'
            : code === 'stelanto_rate_limited'
              ? 'O Stelanto limitou esta consulta. Tente novamente mais tarde.'
              : 'O Stelanto recusou a consulta read-only.',
      })
    }

    const rows = upstream.json
    if (!Array.isArray(rows)) {
      $app.logger().error('Stelanto mirror returned an unexpected shape')
      return e.json(502, {
        code: 'stelanto_invalid_response',
        message: 'O Stelanto respondeu em formato diferente do documentado.',
      })
    }

    return e.json(200, {
      source: 'stelanto',
      format: 'JSON',
      via: 'POST /reports/generate/mirror/view',
      granularity: 'colaborador > resumo do período > dia > batidas',
      period: { start, end, userId: 'ALL' },
      fields: {
        root: ['user', 'summary', 'workDays', 'account'],
        workDay: [
          'date',
          'status',
          'processStatus',
          'expectedWorkHours',
          'totalWorked',
          'extraTime',
          'balance',
          'missingTime',
          'lunchBreak',
          'timeEntries',
        ],
        timeEntry: ['time', 'type', 'date', 'registeredAtt', 'device', 'index'],
        summaryTimeUnit: 'segundos',
        beatTime: 'HH:mm',
      },
      rowCount: rows.length,
      rows,
    })
  },
  $apis.requireAuth(),
)
