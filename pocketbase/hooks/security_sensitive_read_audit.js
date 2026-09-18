onRecordEnrich((e) => {
  const requestInfo = e.requestInfo
  const auth = requestInfo.auth
  const role = auth ? auth.getString('role') : ''
  const actorId = auth ? auth.id : requestInfo.hasSuperuserAuth() ? 'superuser' : 'anonymous'
  const allowedReadFields =
    role === 'analyst'
      ? ['subject', 'cpf', 'salary_cents', 'pension_cents']
      : role === 'finance' || role === 'champion'
        ? ['subject', 'cpf', 'salary_cents', 'pension_cents', 'bank_account', 'pix_key']
        : []

  if (!allowedReadFields.includes('bank_account')) e.record.hide('bank_account')
  if (!allowedReadFields.includes('pix_key')) e.record.hide('pix_key')
  if (!allowedReadFields.includes('cpf')) e.record.hide('cpf')
  if (!allowedReadFields.includes('salary_cents')) e.record.hide('salary_cents')
  if (!allowedReadFields.includes('pension_cents')) e.record.hide('pension_cents')

  const logs = $app.findCollectionByNameOrId('audit_logs')
  const log = new Record(logs)
  log.set('actor_id', actorId)
  log.set('action', 'read')
  log.set('collection_name', 'sensitive_payroll')
  log.set('record_id', e.record.id)
  log.set('fields', allowedReadFields.join(','))
  log.set('occurred_at', new Date().toISOString())
  log.set('outcome', 'allowed')
  $app.save(log)
  return e.next()
}, 'sensitive_payroll')
