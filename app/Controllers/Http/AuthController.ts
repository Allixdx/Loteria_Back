import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    const data = request.only(['name', 'lastname', 'email', 'password'])
    const hashedPassword = await Hash.make(data.password)
    const user = await User.create({ ...data, password: hashedPassword })
    return response.created(user)
  }

  public async login({ request, auth, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])
    try {
      const token = await auth.use('api').attempt(email, password)
      return token
    } catch {
      return response.unauthorized('Invalid credentials')
    }
  }
}
