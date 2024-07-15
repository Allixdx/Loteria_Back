
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})


Route.post('/register', 'AuthController.register')
Route.post('/login', 'AuthController.login')






Route.group(() => {
  Route.post('/create-room', 'RoomsController.create')
  Route.post('/join-room', 'RoomsController.join')
  Route.post('/start-game', 'RoomCsontroller.start')
  Route.post('/cantar-carta', 'RoomsController.cantar')
  Route.post('/anunciar-triunfo', 'RoomsController.announceWin')
  Route.post('/close-room', 'RoomsController.closeRoom')
}).middleware('auth')