onRecordCreateRequest((e) => {
  const auth = e.auth
  const role = auth ? auth.getString('role') : ''
  if (role !== 'champion' && role !== 'analyst') {
    return e.forbiddenError('Papel sem permissão para criar registro sensível.')
  }

  if (role === 'analyst' && (e.record.getString('bank_account') || e.record.getString('pix_key'))) {
    return e.forbiddenError('Analista não pode inserir conta bancária ou PIX.')
  }

  e.record.set('last_write_actor', auth.id)
  e.record.set('last_write_fields', 'subject,cpf,salary_cents,pension_cents,bank_account,pix_key')
  return e.next()
}, 'sensitive_payroll')
