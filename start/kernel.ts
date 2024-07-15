import Server from '@ioc:Adonis/Core/Server'

// Middleware global
Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser')
])

// Middleware nombrados
Server.middleware.registerNamed({
  auth: () => import('App/Middleware/Auth'),
})
