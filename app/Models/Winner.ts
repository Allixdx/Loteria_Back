import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Room from './Room'
import User from './User'

export default class Winner extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public roomID: number

  @column()
  public ronda: number

  @column()
  public userID: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Room, {
    foreignKey: 'roomID'
  })
  public room: BelongsTo<typeof Room>

  @belongsTo(() => User, {
    foreignKey: 'userID'
  })
  public user: BelongsTo<typeof User>
}
