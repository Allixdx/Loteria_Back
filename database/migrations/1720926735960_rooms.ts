import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Rooms extends BaseSchema {
  protected tableName = 'rooms'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('codigo', 10).notNullable().unique()
      table.integer('organizador_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enu('estado', ['ongoing', 'closed']).notNullable()
      table.integer('rondas').defaultTo(0)
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}