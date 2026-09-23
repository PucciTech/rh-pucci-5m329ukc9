routerAdd(
  'GET',
  '/backend/v1/flipchart/consulta',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('role') !== 'champion') {
      return e.forbiddenError('Somente a champion pode executar esta prova.')
    }

    const query = e.request.url.query()
    const start = query.get('dataInicio') || ''
    const end = query.get('dataFim') || ''

    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
      const parsed = new Date(value + 'T00:00:00Z')
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    }

    if (!isValidDate(start) || !isValidDate(end)) {
      return e.badRequestError('Informe dataInicio e dataFim no formato yyyy-MM-dd.')
    }

    const startDate = new Date(start + 'T00:00:00Z')
    const endDate = new Date(end + 'T00:00:00Z')
    const periodDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1

    if (periodDays < 1) {
      return e.badRequestError('dataInicio deve ser anterior ou igual a dataFim.')
    }
    if (periodDays > 31) {
      return e.badRequestError('A prova está limitada a 31 dias por consulta.')
    }

    const token = $secrets.get('FLIPCHART_PARCEIRO_API_KEY')
    if (!token) {
      return e.json(503, {
        code: 'flipchart_not_configured',
        message: 'A credencial read-only do Flipchart não está configurada.',
      })
    }

    let upstream
    try {
      upstream = $http.send({
        url:
          'https://dashluisa.netlify.app/.netlify/functions/flipchart-consulta-externa' +
          '?dataInicio=' +
          encodeURIComponent(start) +
          '&dataFim=' +
          encodeURIComponent(end),
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token.trim(),
        },
        timeout: 60,
      })
    } catch (error) {
      $app
        .logger()
        .error(
          'Flipchart consultation transport failed',
          'message',
          error && error.message ? error.message : String(error),
        )
      return e.json(502, {
        code: 'flipchart_unreachable',
        message: 'Não foi possível alcançar o Flipchart.',
      })
    }

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      $app.logger().warn('Flipchart consultation rejected request', 'status', upstream.statusCode)
      const code =
        upstream.statusCode === 401 || upstream.statusCode === 403
          ? 'flipchart_auth_failed'
          : upstream.statusCode === 429
            ? 'flipchart_rate_limited'
            : 'flipchart_upstream_error'
      return e.json(502, {
        code,
        upstreamStatus: upstream.statusCode,
        message:
          code === 'flipchart_auth_failed'
            ? 'O Flipchart recusou a credencial configurada.'
            : code === 'flipchart_rate_limited'
              ? 'O Flipchart limitou esta consulta. Tente novamente mais tarde.'
              : 'O Flipchart recusou a consulta read-only.',
      })
    }

    const response = upstream.json
    if (!response || typeof response !== 'object' || !Array.isArray(response.data)) {
      $app.logger().error('Flipchart consultation returned an unexpected shape')
      return e.json(502, {
        code: 'flipchart_invalid_response',
        message: 'O Flipchart respondeu em formato diferente do documentado.',
      })
    }

    return e.json(200, {
      source: 'flipchart',
      format: 'JSON',
      via: 'GET /.netlify/functions/flipchart-consulta-externa',
      granularity: 'registro de viagem/uso de veículo por colaborador',
      period: { dataInicio: start, dataFim: end },
      fields: ['id', 'pessoa', 'data', 'veiculo', 'projeto', 'observacoes', 'status', 'source'],
      sourceValues: ['flipchart', 'movimento'],
      rowCount: response.data.length,
      rows: response.data,
    })
  },
  $apis.requireAuth(),
)
