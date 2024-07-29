import Ws from 'App/Services/Ws';

Ws.boot();
const rooms = {};

// Función para manejar la desconexión de un usuario
function handleDisconnect(socket) {
    console.log('User disconnected:', socket.id);

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
}

// Función para manejar cuando un jugador se une a una sala
function handlePlayerJoin(socket, data) {
    console.log('Jugador unido:', data);
    const { room, userId, name, email } = data;

    if (!rooms[room]) {
        rooms[room] = {};
    }

    if (!rooms[room]['anfitrion']) {
        rooms[room]['anfitrion'] = { userId, name, email, socketId: socket.id };
    }

    if (!rooms[room][socket.id]) {
        socket.join(room);
        if (rooms[room]['anfitrion'].email !== email) {
            rooms[room][socket.id] = { userId, name, email };
        }

        Ws.io.to(room).emit('actualizarJugadores', Object.values(rooms[room]));
    } else {
        console.log(`El jugador ${name} ya está en la sala ${room}`);
    }
    console.log(`Room: ${room} - Players:`, rooms[room]);
}

// Función para manejar cuando se cierra una sala
function handleRoomClose(data) {
    console.log('Sala cerrada:', data);
    const { roomId } = data;
    Ws.io.to(roomId).emit('salaCerrada', { roomId });
    delete rooms[roomId];
    console.log(`Sala ${roomId} eliminada.`);
}

// Función para manejar cuando se inicia una partida
function handleGameStart(data) {
    console.log('Partida iniciada:', data);
    const { roomId } = data;
    if (rooms[roomId]) {
        Ws.io.to(roomId).emit('partidaIniciada', { roomId });
        Ws.io.to(roomId).emit('actualizarJugadores', Object.values(rooms[roomId]));
    } else {
        console.log(`Sala ${roomId} no encontrada.`);
    }
}

// Función para manejar cuando termina una partida
function handleGameEnd(data) {
    console.log('Partida terminada:', data);
    const { roomId } = data;
    if (rooms[roomId]) {
        Ws.io.to(roomId).emit('partidaTerminada', { roomId });
    } else {
        console.log(`Sala ${roomId} no encontrada.`);
    }
}

// Listener para las conexiones de socket
Ws.io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => handleDisconnect(socket));
    socket.on('jugadorUnido', (data) => handlePlayerJoin(socket, data));
    socket.on('salaCerrada', (data) => handleRoomClose(data));
    socket.on('iniciarPartida', (data) => handleGameStart(data));
    socket.on('terminarPartida', (data) => handleGameEnd(data));
});
