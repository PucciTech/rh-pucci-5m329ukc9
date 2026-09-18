onRecordUpdateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    return e.unauthorizedError('Autenticação necessária.')
  }

  const originalRole = e.record.original().getString('role') || 'none'
  const nextRole = e.record.getString('role') || 'none'
  const allowed = ['champion', 'analyst', 'finance', 'homologator', 'none']
  if (!allowed.includes(nextRole)) {
    return e.badRequestError('Papel inválido.')
  }

  if (auth.getString('role') !== 'champion') {
    e.record.set('role', originalRole)
  }
  return e.next()
}, 'users')
