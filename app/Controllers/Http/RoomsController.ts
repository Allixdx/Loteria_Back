import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Room from 'App/Models/Room'
import Player from 'App/Models/Player'
import Winner from 'App/Models/Winner'
import Card from 'App/Models/Card'
import Ws from 'App/Services/Ws'

export default class RoomsController {
  public async create({ auth, response }: HttpContextContract) {
    const code = Math.random().toString(36).substr(2, 8)
    const room = await Room.create({
      codigo: code,
      organizadorID: auth.user?.id,
      estado: 'pending'
    })
    return response.created(room)
  }

  public async join({ request, auth, response }: HttpContextContract) {
    const { codigo } = request.only(['codigo'])
    try {
      const room = await Room.findByOrFail('codigo', codigo)
      await Player.create({ roomID: room.id, userID: auth.user?.id })
      
      // Emitir evento de jugador unido
      Ws.io.to(room.codigo).emit('jugadorUnido', { userId: auth.user?.id, roomId: room.id })
      return response.ok(room)
    } catch {
      return response.notFound('Room not found')
    }
  }

  public async start({ request, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId'])
    const room = await Room.findOrFail(roomId)
    room.estado = 'ongoing'
    await room.save()

    // Emitir evento de inicio de partida
    Ws.io.to(room.codigo).emit('partidaIniciada', room)
    return response.ok(room)
  }

  public async cantar({ request, response }: HttpContextContract) {
    const { roomId, cartaId } = request.only(['roomId', 'cartaId'])
    const carta = await Card.findOrFail(cartaId)
    const room = await Room.findOrFail(roomId)

    // Emitir evento de carta cantada
    Ws.io.to(room.codigo).emit('cartaCantada', carta)
    return response.ok(carta)
  }

  public async announceWin({ request, response }: HttpContextContract) {
    const { roomId, ronda, userId } = request.only(['roomId', 'ronda', 'userId'])
    const winner = await Winner.create({ roomID: roomId, ronda, userID: userId })

    // Emitir evento de anuncio de triunfo
    Ws.io.to(winner.roomID.toString()).emit('triunfoAnunciado', { roomId, ronda, userId })
    return response.ok(winner)
  }

  public async closeRoom({ request, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId'])
    const room = await Room.findOrFail(roomId)
    room.estado = 'closed'
    await room.save()

    // Emitir evento de cierre de sala
    Ws.io.to(room.codigo).emit('salaCerrada', room)
    return response.ok(room)
  }
}
