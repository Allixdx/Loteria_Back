import Ws from 'App/Services/Ws'
Ws.boot()

/**
 * Listen for incoming socket connections
 */
Ws.io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })

    socket.on('jugadorUnido', (data) => {
        console.log('Jugador unido:', data);
        Ws.io.emit('jugadorUnido', data);
      });
})
