import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Winners extends BaseSchema {
  protected tableName = 'winners'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('roomID').unsigned().references('id').inTable('rooms').onDelete('CASCADE')
      table.integer('ronda').notNullable()
      table.integer('userID').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
