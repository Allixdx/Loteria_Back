import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Room from 'App/Models/Room';
import Player from 'App/Models/Player';
import Winner from 'App/Models/Winner';
import Card from 'App/Models/Card';
import User from 'App/Models/User';

export default class RoomsController {

  public async index({ request, auth, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId']);
    console.log('Room ID:', roomId);

    try {
      if (!auth.user) {
        return response.unauthorized('Usuario no autenticado');
      }

      const players = await Player.query()
        .where('room_id', roomId);

      if (players.length === 0) {
        return response.ok([]);
      }

      const playerIds = players.map(player => player.userId);

      const users = await User.query()
        .whereIn('id', playerIds);

      return response.ok(users);
    } catch (error) {
      console.error('Error obteniendo usuarios en la sala:', error);
      return response.notFound('Sala no encontrada');
    }
  }

  public async create({ auth, response }: HttpContextContract) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const room = await Room.create({
      codigo: code,
      organizadorId: auth.user?.id,
      estado: 'ongoing'
    });

    return response.created({ id: room.id, room });
  }

  public async join({ request, auth, response }: HttpContextContract) {
    const { codigo } = request.only(['codigo']);
    try {
      if (!auth.user) {
        return response.unauthorized('Usuario no autenticado');
      }
      const room = await Room.findByOrFail('codigo', codigo);
      if (room.estado === 'closed') {
        return response.badRequest('La sala ya está cerrada');
      }
      const existingPlayer = await Player.query()
        .where('room_id', room.id)
        .andWhere('user_id', auth.user.id)
        .first();
      if (!existingPlayer) {
        await Player.create({ roomId: room.id, userId: auth.user?.id });
      }
      console.log(`Emitiendo jugador unido: ${auth.user?.id} a sala: ${room.codigo}`);
      const userData = {
        room: room.id,
        userid: auth.user?.id,
        name: auth.user?.name,
        email: auth.user?.email,
      };
      console.log(userData)
      return response.ok(userData);
    } catch (error) {
      console.error('Error joining room:', error);
      return response.notFound('Room not found');
    }
  }

  public async start({ request, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId']);
    const room = await Room.findOrFail(roomId);
    room.estado = 'ongoing';
    room.rondas += 1;
    await room.save();
    return response.ok(room);
  }

  public async announceWin({ request, response }: HttpContextContract) {
    const { roomId, userId } = request.only(['roomId', 'userId']);

    const room = await Room.findOrFail(roomId);
    const ronda = room.rondas;
    const winner = await Winner.create({ roomId, ronda, userId });
    return response.ok(winner);
}

  public async closeRoom({ request, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId']);
    const room = await Room.findOrFail(roomId);
    room.estado = 'closed';
    await room.save();
    return response.ok(room);
  }

  public async obtenerCartas({ }: HttpContextContract) {
    const cartas = await Card.query();
    return cartas;
  }
}
