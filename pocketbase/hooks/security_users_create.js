onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'champion') {
    return e.forbiddenError('Somente a champion pode criar usuários.')
  }

  const role = e.record.getString('role') || 'none'
  const allowed = ['champion', 'analyst', 'finance', 'homologator', 'none']
  if (!allowed.includes(role)) {
    return e.badRequestError('Papel inválido.')
  }
  e.record.set('role', role)
  return e.next()
}, 'users')
