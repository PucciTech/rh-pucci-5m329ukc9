onRecordCreateRequest((e) => {
  const auth = e.auth
  const role = auth ? auth.getString('role') : ''
  if (role !== 'champion' && role !== 'analyst') {
    return e.forbiddenError('Papel sem permissão para abrir competência.')
  }
  e.record.set('status', 'open')
  e.record.set('t0', new Date().toISOString())
  e.record.set('t1', null)
  e.record.set('touch_time_minutes', null)
  return e.next()
}, 'competencies')
