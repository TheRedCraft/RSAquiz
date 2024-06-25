const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {};

app.use(express.static('client'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

io.on('connection', (socket) => {
  socket.on('createRoom', (leaderName) => {
    const roomCode = Math.random().toString(36).substring(2, 7);
    rooms[roomCode] = {
      leader: { id: socket.id, name: leaderName },
      participants: [],
      questions: JSON.parse(fs.readFileSync('server/questions.json'))
    };
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
  });

  socket.on('joinRoom', ({ participantName, roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].participants.push({ id: socket.id, name: participantName });
      socket.join(roomCode);
      io.to(roomCode).emit('participantJoined', rooms[roomCode].participants);
    } else {
      socket.emit('error', 'Raum nicht gefunden');
    }
  });

  socket.on('startQuiz', () => {
    const roomCode = Object.keys(socket.rooms).find(room => room !== socket.id);
    const question = rooms[roomCode].questions.shift();
    io.to(roomCode).emit('question', question);
  });

  socket.on('submitAnswer', (answer) => {
    const roomCode = Object.keys(socket.rooms).find(room => room !== socket.id);
    const correctAnswer = rooms[roomCode].questions[0].answer;
    if (answer == correctAnswer) {
      rooms[roomCode].questions.shift();
      const nextQuestion = rooms[roomCode].questions[0];
      io.to(roomCode).emit('question', nextQuestion);
    } else {
      socket.emit('error', 'Falsche Antwort');
    }
  });
});

server.listen(3000, () => {
  console.log('Server läuft auf Port 3000');
});