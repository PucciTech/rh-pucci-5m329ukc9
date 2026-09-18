onRecordUpdateRequest((e) => {
  const auth = e.auth
  const role = auth ? auth.getString('role') : ''
  if (role !== 'champion' && role !== 'analyst' && role !== 'finance') {
    return e.forbiddenError('Papel sem permissão para alterar registro sensível.')
  }

  const protectedFields = [
    'subject',
    'cpf',
    'salary_cents',
    'pension_cents',
    'bank_account',
    'pix_key',
  ]
  const changed = []
  for (const field of protectedFields) {
    if (e.record.getString(field) !== e.record.original().getString(field)) {
      changed.push(field)
    }
  }

  const analystAllowed = ['subject', 'cpf', 'salary_cents', 'pension_cents']
  const financeAllowed = ['salary_cents', 'pension_cents', 'bank_account', 'pix_key']
  const allowed =
    role === 'champion' ? protectedFields : role === 'analyst' ? analystAllowed : financeAllowed
  if (changed.some((field) => !allowed.includes(field))) {
    return e.forbiddenError('O papel não pode alterar um ou mais campos enviados.')
  }

  e.record.set('last_write_actor', auth.id)
  e.record.set('last_write_fields', changed.join(',') || 'none')
  return e.next()
}, 'sensitive_payroll')
