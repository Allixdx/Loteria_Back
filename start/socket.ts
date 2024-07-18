import Ws from 'App/Services/Ws';

Ws.boot();
const rooms = {};

/**
 * Listen for incoming socket connections
 */
Ws.io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Buscar y eliminar la sala si el anfitrión se desconecta
        for (const room in rooms) {
            if (rooms[room]['anfitrion'] && rooms[room]['anfitrion'].socketId === socket.id) {
                delete rooms[room];
                console.log(`Sala ${room} eliminada porque el anfitrión se desconectó.`);
                Ws.io.emit('salaCerrada', { roomId: room });
                break;
            } else if (rooms[room][socket.id]) {
                delete rooms[room][socket.id];
                Ws.io.to(room).emit('actualizarJugadores', Object.values(rooms[room]));
                if (Object.keys(rooms[room]).length === 0) {
                    delete rooms[room];
                    console.log(`Sala ${room} eliminada porque no quedan jugadores.`);
                    Ws.io.emit('salaCerrada', { roomId: room });
                }
                break;
            }
        }
    });

    // Manejar cuando un jugador se une a una sala
    socket.on('jugadorUnido', (data) => {
        console.log('Jugador unido:', data);
        const { room, userId, name, email } = data;

        if (!rooms[room]) {
            rooms[room] = {};
        }

        if (!rooms[room]['anfitrion']) {
            rooms[room]['anfitrion'] = { userId, name, email, socketId: socket.id };
        }

        if (!rooms[room][socket.id]) {
            // Unir el socket a la sala específica
            socket.join(room);
            // Agregar el jugador a la sala
            if (rooms[room]['anfitrion'].email !== email) {
                rooms[room][socket.id] = { userId, name, email };
            }

            Ws.io.to(room).emit('actualizarJugadores', Object.values(rooms[room]));
        } else {
            console.log(`El jugador ${name} ya está en la sala ${room}`);
        }
        console.log(`Room: ${room} - Players:`, rooms[room]);
    });

    // Manejar cuando se cierra una sala específica
    socket.on('salaCerrada', (data) => {
        console.log('Sala cerrada:', data);
        const { roomId } = data;
        Ws.io.to(roomId).emit('salaCerrada', { roomId });
        delete rooms[roomId];
        console.log(`Sala ${roomId} eliminada.`);
    });

});
