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
  console.log('Ein Benutzer hat sich verbunden');

  socket.on('createRoom', (leaderName) => {
    const roomCode = Math.random().toString(36).substring(2, 7);
    rooms[roomCode] = {
      leader: { id: socket.id, name: leaderName },
      participants: [],
      questions: JSON.parse(fs.readFileSync('server/questions.json')),
      startTime: null
    };
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
    console.log(`Raum erstellt: ${roomCode}`);
  });

  socket.on('joinRoom', ({ participantName, roomCode }) => {
    if (rooms[roomCode]) {
      const participant = rooms[roomCode].participants.find(p => p.id === socket.id);
      if (participant) {
        socket.emit('error', 'Du bist bereits in diesem Raum.');
        return;
      }
      rooms[roomCode].participants.push({ id: socket.id, name: participantName, progress: 0, correctAnswers: 0, incorrectAnswers: 0 });
      socket.join(roomCode);
      socket.emit('roomJoined', roomCode);
      io.to(roomCode).emit('participantJoined', rooms[roomCode].participants);
      console.log(`Teilnehmer beigetreten: ${participantName} in Raum: ${roomCode}`);
    } else {
      socket.emit('error', 'Raum nicht gefunden');
    }
  });

  socket.on('startQuiz', () => {
    const roomCode = Array.from(socket.rooms).find(room => room !== socket.id);
    console.log(`Start Quiz für Raum: ${roomCode}`);
    if (!roomCode || !rooms[roomCode]) {
      socket.emit('error', 'Raum nicht gefunden oder ungültig');
      return;
    }
    const room = rooms[roomCode];
    if (room.leader.id !== socket.id) {
      socket.emit('error', 'Nur der Raumleiter kann das Quiz starten');
      return;
    }
    room.startTime = Date.now();
    const question = room.questions[0];
    if (!question) {
      socket.emit('error', 'Keine Fragen verfügbar');
      return;
    }
    io.to(roomCode).emit('question', question);
  });

  socket.on('submitAnswer', ({ answer, roomCode }) => {
    console.log(`Antwort erhalten für Raum: ${roomCode}`);
    if (!roomCode || !rooms[roomCode]) {
      socket.emit('error', 'Raum nicht gefunden oder ungültig');
      return;
    }
    const room = rooms[roomCode];
    if (room.leader.id === socket.id) {
      socket.emit('error', 'Der Raumleiter kann keine Antworten einreichen');
      return;
    }
    const participant = room.participants.find(p => p.id === socket.id);
    console.log(`Teilnehmer gefunden: ${JSON.stringify(participant)}`);
    if (!participant) {
      socket.emit('error', 'Teilnehmer nicht gefunden');
      return;
    }
    const correctAnswer = room.questions[participant.progress].answer;
    console.log(`Erwartete Antwort: ${correctAnswer}, Gegebene Antwort: ${answer}`);
    if (answer === correctAnswer) {
      participant.correctAnswers++;
      participant.progress++;
      const nextQuestion = room.questions[participant.progress];
      if (nextQuestion) {
        io.to(socket.id).emit('question', nextQuestion);
      } else {
        io.to(socket.id).emit('quizFinished', 'Das Quiz ist beendet');
      }
    } else {
      participant.incorrectAnswers++; // Falsche Antwort zählen
      io.to(socket.id).emit('incorrectAnswer');
    }
    io.to(roomCode).emit('participantJoined', rooms[roomCode].participants); // Update leader with progress
  });

  socket.on('requestUpdate', (roomCode) => {
    if (rooms[roomCode]) {
      socket.emit('update', rooms[roomCode].participants);
    }
  });

  socket.on('disconnect', () => {
    console.log('Ein Benutzer hat die Verbindung getrennt');
  });
});

server.listen(3000, () => {
  console.log('Server läuft auf Port 3000');
});
