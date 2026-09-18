routerAdd(
  'POST',
  '/backend/v1/security/bootstrap',
  (e) => {
    const body = e.requestInfo().body || {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!email || !email.includes('@') || !email.includes('.')) {
      return e.badRequestError('Informe um e-mail válido.')
    }
    if (password.length < 12) {
      return e.badRequestError('A senha inicial deve ter pelo menos 12 caracteres.')
    }
    if (!name || name.length < 2) {
      return e.badRequestError('Informe o nome da champion.')
    }
    if ($app.countRecords('users') > 0) {
      return e.json(409, {
        code: 'bootstrap_closed',
        message: 'O primeiro acesso já foi configurado.',
      })
    }

    const users = $app.findCollectionByNameOrId('users')
    const record = new Record(users)
    record.setEmail(email)
    record.setPassword(password)
    record.setVerified(true)
    record.set('name', name)
    record.set('role', 'champion')
    $app.save(record)

    return e.json(201, { id: record.id, email: record.email(), role: 'champion' })
  },
  $apis.requireGuestOnly(),
)
