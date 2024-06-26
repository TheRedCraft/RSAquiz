// Initialisiere die Socket.io-Verbindung
const socket = io();
let currentRoom = null;
let isLeader = false;

document.getElementById('create-room-btn').addEventListener('click', () => {
  const leaderName = document.getElementById('leader-name').value;
  socket.emit('createRoom', leaderName);
  isLeader = true;
});

document.getElementById('join-room-btn').addEventListener('click', () => {
  if (currentRoom) {
    alert('Du bist bereits einem Raum beigetreten.');
    return;
  }
  const participantName = document.getElementById('participant-name').value;
  const roomCode = document.getElementById('room-code').value;
  socket.emit('joinRoom', { participantName, roomCode });
});

socket.on('roomCreated', (roomCode) => {
  currentRoom = roomCode;
  document.getElementById('create-room').style.display = 'none';
  document.getElementById('join-room').style.display = 'none';
  document.getElementById('room-info').style.display = 'block';
  document.getElementById('room-name').textContent = roomCode;
  document.getElementById('leader-view').style.display = 'block';
  alert(`Raum erstellt! Code: ${roomCode}`);
  console.log(`Raum erstellt: ${roomCode}`);
});

socket.on('roomJoined', (roomCode) => {
  currentRoom = roomCode;
  document.getElementById('create-room').style.display = 'none';
  document.getElementById('join-room').style.display = 'none';
  document.getElementById('room-info').style.display = 'block';
  document.getElementById('room-name').textContent = roomCode;
  console.log(`Raum beigetreten: ${roomCode}`);
});

socket.on('participantJoined', (participants) => {
  const participantsList = document.getElementById('participants-list');
  participantsList.innerHTML = '';
  participants.forEach(participant => {
    const li = document.createElement('li');
    li.textContent = participant.name;
    participantsList.appendChild(li);
  });
  console.log('Teilnehmer aktualisiert');
});

document.getElementById('start-quiz-btn').addEventListener('click', () => {
  socket.emit('startQuiz');
  console.log('Quiz gestartet');
});

socket.on('question', (question) => {
  document.getElementById('leader-view').style.display = 'none';
  document.getElementById('participant-view').style.display = 'block';
  document.getElementById('question').textContent = question.question; // Hier wird die Frage als Text angezeigt
  console.log('Frage erhalten');
});

document.getElementById('submit-answer-btn').addEventListener('click', () => {
  const answer = document.getElementById('answer').value;
  socket.emit('submitAnswer', { answer, roomCode: currentRoom });
  console.log('Antwort gesendet');
});

socket.on('error', (message) => {
  alert(message);
  console.log(`Fehler: ${message}`);
});

socket.on('quizFinished', (message) => {
  alert(message);
  document.getElementById('participant-view').style.display = 'none';
  document.getElementById('leader-view').style.display = 'block';
  console.log('Quiz beendet');
});