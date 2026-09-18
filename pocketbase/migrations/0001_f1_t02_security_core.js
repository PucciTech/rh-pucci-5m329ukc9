migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['champion', 'analyst', 'finance', 'homologator', 'none'],
          maxSelect: 1,
        }),
      )
    }
    users.listRule = "@request.auth.role = 'champion' || id = @request.auth.id"
    users.viewRule = "@request.auth.role = 'champion' || id = @request.auth.id"
    users.createRule = "@request.auth.role = 'champion'"
    users.updateRule = "@request.auth.role = 'champion' || id = @request.auth.id"
    users.deleteRule = "@request.auth.role = 'champion'"
    app.save(users)

    const payroll = new Collection({
      name: 'sensitive_payroll',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst' || @request.auth.role = 'finance')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst' || @request.auth.role = 'finance')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst' || @request.auth.role = 'finance')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'champion'",
      fields: [
        { name: 'subject', type: 'text', required: true, max: 120 },
        { name: 'cpf', type: 'text', max: 32 },
        { name: 'salary_cents', type: 'number', onlyInt: true, min: 0 },
        { name: 'pension_cents', type: 'number', onlyInt: true, min: 0 },
        { name: 'bank_account', type: 'text', max: 120 },
        { name: 'pix_key', type: 'text', max: 160 },
        { name: 'last_write_actor', type: 'text', hidden: true, max: 15 },
        { name: 'last_write_fields', type: 'text', hidden: true, max: 255 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_sensitive_payroll_subject ON sensitive_payroll (subject)',
        'CREATE INDEX idx_sensitive_payroll_created ON sensitive_payroll (created DESC)',
      ],
    })
    app.save(payroll)

    const competencies = new Collection({
      name: 'competencies',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst' || @request.auth.role = 'finance' || @request.auth.role = 'homologator')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst' || @request.auth.role = 'finance' || @request.auth.role = 'homologator')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'champion' || @request.auth.role = 'analyst')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'champion'",
      fields: [
        { name: 'label', type: 'text', required: true, max: 120 },
        { name: 'status', type: 'select', values: ['open', 'closed'], maxSelect: 1 },
        { name: 't0', type: 'date', required: true },
        { name: 't1', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_competencies_created ON competencies (created DESC)'],
    })
    app.save(competencies)

    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.role = 'champion'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'champion'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'actor_id', type: 'text', required: true, max: 15 },
        {
          name: 'action',
          type: 'select',
          values: ['read', 'create', 'update', 'delete'],
          maxSelect: 1,
          required: true,
        },
        { name: 'collection_name', type: 'text', required: true, max: 80 },
        { name: 'record_id', type: 'text', required: true, max: 64 },
        { name: 'fields', type: 'text', max: 255 },
        { name: 'occurred_at', type: 'date', required: true },
        { name: 'outcome', type: 'select', values: ['allowed'], maxSelect: 1, required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_logs_occurred_at ON audit_logs (occurred_at DESC)',
        'CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id, occurred_at DESC)',
      ],
    })
    app.save(auditLogs)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('audit_logs'))
    app.delete(app.findCollectionByNameOrId('competencies'))
    app.delete(app.findCollectionByNameOrId('sensitive_payroll'))

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
      app.save(users)
    }
  },
)
