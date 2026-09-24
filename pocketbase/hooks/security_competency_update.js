onRecordUpdateRequest((e) => {
  const auth = e.auth
  const role = auth ? auth.getString('role') : ''
  if (role !== 'champion' && role !== 'analyst') {
    return e.forbiddenError('Papel sem permissão para operar competência.')
  }

  const originalStatus = e.record.original().getString('status')
  const nextStatus = e.record.getString('status')
  const originalT0 = e.record.original().getString('t0')
  const originalT1 = e.record.original().getString('t1')
  const originalTouchTime = e.record.original().getString('touch_time_minutes')
  const nextTouchTime = e.record.getString('touch_time_minutes')
  const touchTimeProvided = nextTouchTime !== ''
  const touchTimeMinutes = Number(nextTouchTime)

  if (
    touchTimeProvided &&
    (!Number.isFinite(touchTimeMinutes) ||
      !Number.isInteger(touchTimeMinutes) ||
      touchTimeMinutes < 0)
  ) {
    return e.badRequestError('Touch time deve ser um número inteiro não negativo em minutos.')
  }

  if (originalStatus === 'closed' && nextStatus !== 'closed') {
    return e.badRequestError('Competência encerrada não pode ser reaberta.')
  }

  if (
    originalStatus === 'closed' &&
    nextStatus === 'closed' &&
    nextTouchTime !== originalTouchTime
  ) {
    return e.badRequestError('Competência encerrada não pode alterar o touch time.')
  }

  if (originalT0) e.record.set('t0', originalT0)
  if (nextStatus === 'closed' && originalStatus !== 'closed') {
    if (!touchTimeProvided || touchTimeMinutes <= 0) {
      return e.badRequestError('Informe o touch time estimado em minutos antes de encerrar.')
    }
    e.record.set('t1', new Date().toISOString())
  } else if (originalT1) {
    e.record.set('t1', originalT1)
  } else {
    e.record.set('t1', null)
  }
  return e.next()
}, 'competencies')
