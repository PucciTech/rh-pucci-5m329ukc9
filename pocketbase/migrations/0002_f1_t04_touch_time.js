migrate(
  (app) => {
    const competencies = app.findCollectionByNameOrId('competencies')
    if (!competencies.fields.getByName('touch_time_minutes')) {
      competencies.fields.add(
        new NumberField({
          name: 'touch_time_minutes',
          min: 0,
          onlyInt: true,
        }),
      )
      app.save(competencies)
    }
  },
  (app) => {
    const competencies = app.findCollectionByNameOrId('competencies')
    if (competencies.fields.getByName('touch_time_minutes')) {
      competencies.fields.removeByName('touch_time_minutes')
      app.save(competencies)
    }
  },
)
