import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Room from 'App/Models/Room'
import Player from 'App/Models/Player'
import Winner from 'App/Models/Winner'
import Card from 'App/Models/Card'
import Ws from 'App/Services/Ws'

export default class RoomsController {
  public async create({ auth, response }: HttpContextContract) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const room = await Room.create({
      codigo: code,
      organizadorId: auth.user?.id,
      estado: 'ongoing'
    })
    return response.created(room)
  }

  public async join({ request, auth, response }: HttpContextContract) {
    const { codigo } = request.only(['codigo'])
    try {
      if (!auth.user) {
        return response.unauthorized('Usuario no autenticado');
      }
      const room = await Room.findByOrFail('codigo', codigo)
      if (room.estado === 'closed') {
        return response.badRequest('La sala ya está cerrada');
      }
      const existingPlayer = await Player.query()
        .where('room_id', room.id)
        .andWhere('user_id', auth.user.id)
        .first();
      if (existingPlayer) {
        return response.badRequest('Ya estás en esta sala');
      }
      await Player.create({ roomId: room.id, userId: auth.user?.id });

      // Emitir evento de jugador unido
      Ws.io.to(room.codigo).emit('jugadorUnido', { userId: auth.user?.id, roomId: room.id });
      return response.ok(room);
    } catch (error) {
      return response.notFound('Room not found');
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
    const winner = await Winner.create({ roomId: roomId, ronda, userId: userId })  // Cambios aquí

    // Emitir evento de anuncio de triunfo
    Ws.io.to(winner.roomId.toString()).emit('triunfoAnunciado', { roomId, ronda, userId })
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
