import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Room from 'App/Models/Room'
import Winner from 'App/Models/Winner'
import Database from '@ioc:Adonis/Lucid/Database'
import Player from 'App/Models/Player'

export default class AuthController {
    public async register({ request, response }: HttpContextContract) {
        try {
            const validationSchema = schema.create({
                name: schema.string({}, [rules.required()]),
                lastname: schema.string({}, [rules.required()]),
                email: schema.string({}, [
                    rules.email(),
                    rules.unique({ table: 'users', column: 'email' }),
                    rules.required(),
                ]),
                password: schema.string({}, [
                    rules.minLength(8),
                    rules.required(),
                ]),
            })
            const data = await request.validate({
                schema: validationSchema,
            })
            const user = await User.create(data)
            return { user }
        } catch (error) {
            return response.badRequest(error.messages)
        }
    }

    public async login({ request, response, auth }: HttpContextContract) {
        try {
            const validationSchema = schema.create({
                email: schema.string({}, [
                    rules.email(),
                    rules.required(),
                ]),
                password: schema.string({}, [
                    rules.minLength(8),
                    rules.required(),
                ]),
            })
            const { email, password } = await request.validate({
                schema: validationSchema,
            })
            const token = await auth.use('api').attempt(email, password)
            return { token }
        } catch (error) {
            return response.badRequest('Invalid credentials')
        }
    }

    public async getUser({ auth, response }) {
        try {
            if (!auth.user) {
                return response.unauthorized('Usuario no autenticado');
            }
            const user = await auth.user;
            return response.json({ user });
        } catch (error) {
            return response.status(500).json({ error: 'Error al obtener el usuario autenticado' });
        }
    }



    public async getRoomsByOrganizador({ auth, response }: HttpContextContract) {
    try {
      // Obtén el ID del usuario logueado
      const user = auth.user
      if (!user) {
        return response.status(401).json({ error: 'No autorizado' })
      }
      
      // El ID del organizador es el ID del usuario logueado
      const organizadorId = user.id
      
      // Obtén las salas del organizador
      const rooms = await Room.query()
        .where('organizador_id', organizadorId)
        .select('id', 'codigo', 'organizador_id', 'rondas', 'created_at')
      
      return response.json(rooms)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Error al obtener las salas' })
    }
  }

    
     public async getPlayersByRoom({ params, response }: HttpContextContract) {
        try {
          const { roomId } = params
          const players = await Player.query()
            .where('room_id', roomId)
            .select('user_id', 'created_at')
    
          return response.json(players)
        } catch (error) {
          console.error(error)
          return response.status(500).json({ error: 'Error fetching players' })
        }
      }
    
      public async getWinnersByRoom({ params, response }: HttpContextContract) {
        try {
          const { roomId } = params
          const winners = await Winner.query() 
            .where('room_id', roomId)
            .select('id', 'room_id', 'ronda', 'user_id', 'created_at', 'updated_at')
    
          return response.json(winners)
        } catch (error) {
          console.error(error)
          return response.status(500).json({ error: 'Error fetching winners' })
        }
      }



      public async getRoomsWonByUser({ auth }: HttpContextContract) {
        // Obtén el ID del usuario loggeado
        const userId = auth.user?.id;
    
        if (!userId) {
          return { error: 'Usuario no autenticado' };
        }
    
        // Consulta SQL para obtener las salas ganadas por el usuario
        const winners = await Database
          .from('winners')
          .join('rooms', 'winners.room_id', 'rooms.id')
          .where('winners.user_id', userId)
          .select('winners.id as winnerId', 'winners.room_id as roomId', 'rooms.codigo', 'winners.ronda', 'winners.created_at as createdAt', 'winners.updated_at as updatedAt');
    
        return winners;
      }
    
}
