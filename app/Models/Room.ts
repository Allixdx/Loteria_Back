import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Player from './Player'
import Winner from './Winner'

export default class Room extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public codigo: string

  @column()
  public organizador_id: number // Cambiado a organizador_id

  @column()
  public estado: 'ongoing' | 'closed'

  @column()
  public rondas: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'organizador_id' // Asegúrate de que este también coincida
  })
  public organizador: BelongsTo<typeof User>

  @hasMany(() => Player, {
    foreignKey: 'roomID'
  })
  public players: HasMany<typeof Player>

  @hasMany(() => Winner, {
    foreignKey: 'roomID'
  })
  public winners: HasMany<typeof Winner>
}
