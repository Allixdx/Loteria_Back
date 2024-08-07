
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})


Route.post('/register', 'AuthController.register')
Route.post('/login', 'AuthController.login')

Route.group(() => {
  Route.get('/user', 'AuthController.getUser');
  Route.get('/index', 'RoomsController.index');
  Route.get('/cartas', 'RoomsController.obtenerCartas');



  Route.get('/rooms/createdby', 'AuthController.getRoomsByOrganizador')
  Route.get('/players/:roomId', 'AuthController.getPlayersByRoom')
  Route.get('/winners/:roomId', 'AuthController.getWinnersByRoom')

  Route.get('/rooms-won', 'AuthController.getRoomsWonByUser');


  Route.post('/rooms', 'RoomsController.create'); // Crear sala
  Route.post('/rooms/join', 'RoomsController.join'); // Unirse a sala
  Route.post('/rooms/start', 'RoomsController.start'); // Iniciar partida
  Route.post('/rooms/cantar', 'RoomsController.cantar'); // Cantar carta
  Route.post('/rooms/announce-win', 'RoomsController.announceWin'); // Anunciar victoria
  Route.post('/rooms/close', 'RoomsController.closeRoom'); // Cerrar sala
}).middleware('auth'); 