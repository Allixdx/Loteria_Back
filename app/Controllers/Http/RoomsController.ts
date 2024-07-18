import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Room from 'App/Models/Room';
import Player from 'App/Models/Player';
import Winner from 'App/Models/Winner';
import Card from 'App/Models/Card';
import Ws from 'App/Services/Ws';
import User from 'App/Models/User';

export default class RoomsController {
  private cartasBarajadas: Card[] = [];
  private indiceCarta: number = 0;
  private cartasCantadas: Card[] = [];
  private tablasJugadores: { [key: string]: Card[] } = {};


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

    const cartas = await Card.all();
    this.cartasBarajadas = this.shuffle(cartas);
    this.indiceCarta = 0;
    this.cartasCantadas = []; // Reinicia el registro de cartas cantadas para la nueva ronda

    // Obtener los jugadores de la sala
    const jugadores = await Player.query().where('room_id', room.id);

    // Asignar una tabla de 4x4 a cada jugador
    for (const jugador of jugadores) {
      const tabla = this.generarTabla();
      this.tablasJugadores[jugador.userId.toString()] = tabla; // Guardar la tabla en memoria
      // Emitir un evento a cada jugador con su tabla
      Ws.io.to(jugador.userId.toString()).emit('tablaAsignada', { tabla });
    }

    Ws.io.to(room.codigo).emit('partidaIniciada', room);
    return response.ok(room);
  }

  public async cantar({ request, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId']);
    const room = await Room.findOrFail(roomId);

    if (this.indiceCarta < this.cartasBarajadas.length) {
      const cartaActual = this.cartasBarajadas[this.indiceCarta];
      this.indiceCarta++;
      this.cartasCantadas.push(cartaActual); // Agrega la carta a las cantadas

      Ws.io.to(room.codigo).emit('cartaCantada', cartaActual);
      return response.ok(cartaActual);
    }
    return response.badRequest('No hay más cartas');
  }

  public async announceWin({ request, response }: HttpContextContract) {
    const { roomId, ronda, userId } = request.only(['roomId', 'ronda', 'userId']);

    // Obtener la tabla del jugador desde la memoria
    const tablaJugador = this.tablasJugadores[userId.toString()];

    if (!tablaJugador) {
      return response.badRequest('No se encontró la tabla del jugador');
    }

    // Convertir las IDs de las cartas cantadas a un conjunto para una comparación rápida
    const cartasCantadasSet = new Set(this.cartasCantadas.map(carta => carta.id));

    // Verificar que las cartas del jugador estén en las cartas cantadas
    const victoria = tablaJugador.every(carta => cartasCantadasSet.has(carta.id));

    if (victoria) {
      const winner = await Winner.create({ roomId, ronda, userId });
      Ws.io.to(roomId.toString()).emit('triunfoAnunciado', { roomId, ronda, userId });
      return response.ok(winner);
    }
    return response.badRequest('No es una victoria válida');
  }

  public async closeRoom({ request, response }: HttpContextContract) {
    const { roomId } = request.only(['roomId']);
    const room = await Room.findOrFail(roomId);
    room.estado = 'closed';
    await room.save();
    Ws.io.to(room.codigo).emit('salaCerrada', room);
    return response.ok(room);
  }

  public async nuevaTabla({ auth, response }: HttpContextContract) {
    if (!auth.user) {
      return response.unauthorized('Usuario no autenticado');
    }

    const tabla = this.generarTabla();
    this.tablasJugadores[auth.user.id.toString()] = tabla; // Actualizar la tabla del jugador en memoria
    Ws.io.to(auth.user.id.toString()).emit('nuevaTabla', { tabla });
    return response.ok({ tabla });
  }

  private shuffle(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private generarTabla(): Card[] {
    const cartasBarajadas = this.shuffle([...this.cartasBarajadas]);
    return cartasBarajadas.slice(0, 16);
  }
}
