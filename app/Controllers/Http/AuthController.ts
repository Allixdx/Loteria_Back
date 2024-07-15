import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

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
  
}
