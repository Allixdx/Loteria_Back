
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})


Route.post('/register', 'AuthController.register')
Route.post('/login', 'AuthController.login')






Route.group(() => {
  Route.post('/rooms', 'RoomsController.create'); // Crear sala
  Route.post('/rooms/join', 'RoomsController.join'); // Unirse a sala
  Route.post('/rooms/start', 'RoomsController.start'); // Iniciar partida
  Route.post('/rooms/cantar', 'RoomsController.cantar'); // Cantar carta
  Route.post('/rooms/announce-win', 'RoomsController.announceWin'); // Anunciar victoria
  Route.post('/rooms/close', 'RoomsController.closeRoom'); // Cerrar sala
}).middleware('auth'); 