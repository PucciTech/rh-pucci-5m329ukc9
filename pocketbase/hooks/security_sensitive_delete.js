onRecordDeleteRequest((e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'champion') {
    return e.forbiddenError('Somente a champion pode excluir registro sensível.')
  }
  e.record.set('last_write_actor', auth.id)
  e.record.set('last_write_fields', 'record')
  return e.next()
}, 'sensitive_payroll')
