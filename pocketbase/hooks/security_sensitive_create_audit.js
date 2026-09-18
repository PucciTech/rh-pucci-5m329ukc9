onRecordAfterCreateSuccess((e) => {
  const actorId = e.record.getString('last_write_actor')
  if (actorId) {
    const logs = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(logs)
    log.set('actor_id', actorId)
    log.set('action', 'create')
    log.set('collection_name', 'sensitive_payroll')
    log.set('record_id', e.record.id)
    log.set('fields', e.record.getString('last_write_fields'))
    log.set('occurred_at', new Date().toISOString())
    log.set('outcome', 'allowed')
    $app.save(log)
  }
  return e.next()
}, 'sensitive_payroll')
