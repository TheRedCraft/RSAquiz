const socket = io();
let currentRoom = null;
let isLeader = false;
let quizStartTime = null;

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
  if (!isLeader) {
    document.getElementById('room-info').style.display = 'block';
  }
  alert(`Raum erstellt! Code: ${roomCode}`);
  console.log(`Raum erstellt: ${roomCode}`);
});

socket.on('roomJoined', (roomCode) => {
  currentRoom = roomCode;
  document.getElementById('create-room').style.display = 'none';
  document.getElementById('join-room').style.display = 'none';
  document.getElementById('room-info').style.display = 'block';
  document.getElementById('room-name').textContent = roomCode;
  if (!isLeader) {
    document.getElementById('room-info').style.display = 'block';
  }
  console.log(`Raum beigetreten: ${roomCode}`);
});

socket.on('participantJoined', (participants) => {
  const participantsList = document.getElementById('participants-list');
  participantsList.innerHTML = '';
  participants.forEach(participant => {
    const totalAnswers = participant.correctAnswers + participant.incorrectAnswers;
    const accuracy = totalAnswers > 0 ? ((participant.correctAnswers / totalAnswers) * 100).toFixed(2) : 0;
    const li = document.createElement('li');
    li.textContent = `${participant.name} - Frage: ${participant.progress} - Richtige Antworten: ${participant.correctAnswers} - Falsche Antworten: ${participant.incorrectAnswers} - Genauigkeit: ${accuracy}%`;
    participantsList.appendChild(li);
  });
  if (isLeader) {
    updateLeaderView(participants);
  }
  console.log('Teilnehmer aktualisiert');
});

document.getElementById('start-quiz-btn').addEventListener('click', () => {
  socket.emit('startQuiz');
  quizStartTime = Date.now();
  console.log('Quiz gestartet');
});

socket.on('question', (question) => {
  if (!isLeader) {
    document.getElementById('participant-view').style.display = 'block';
    document.getElementById('question').textContent = question.question;
  }
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
  console.log('Quiz beendet');
});

socket.on('update', (participants) => {
  if (isLeader) {
    updateLeaderView(participants);
  }
});

socket.on('incorrectAnswer', () => {
  if (isLeader) {
    socket.emit('requestUpdate', currentRoom);
  }
});

setInterval(() => {
  if (isLeader) {
    socket.emit('requestUpdate', currentRoom);
  }
}, 1000);

function updateLeaderView(participants) {
  const participantsList = document.getElementById('participants-list');

  const totalProgress = participants.reduce((sum, p) => sum + p.progress, 0);
  const totalIncorrectAnswers = participants.reduce((sum, p) => sum + p.incorrectAnswers, 0);
  const totalAnswers1 = participants.reduce((sum, p) => sum + p.correctAnswers, 0);


  const averageAccuracy = totalProgress + totalIncorrectAnswers > 0 ? ((totalAnswers1 / (totalProgress + totalIncorrectAnswers)) * 100).toFixed(2) : 0;

  document.getElementById('average-accuracy').textContent = `Durchschnittliche Genauigkeit: ${averageAccuracy}%`;

  if (quizStartTime) {
    const elapsedTime = Math.floor((Date.now() - quizStartTime) / 1000);
    document.getElementById('elapsed-time').textContent = `Verstrichene Zeit: ${elapsedTime} Sekunden`;
  }

  participantsList.innerHTML = '';
  participants.forEach(participant => {
    const totalAnswers = participant.correctAnswers + participant.incorrectAnswers;
    const accuracy = totalAnswers > 0 ? ((participant.correctAnswers / totalAnswers) * 100).toFixed(2) : 0;
  
    const li = document.createElement('li');
    li.textContent = `${participant.name} - Frage: ${participant.progress} - Richtige Antworten: ${participant.correctAnswers} - Falsche Antworten: ${participant.incorrectAnswers} - Genauigkeit: ${accuracy}%`;
    participantsList.appendChild(li);
  });

  if (isLeader) {
    document.getElementById('leader-view').style.display = 'block';
    document.getElementById('start-quiz-btn').style.display = 'block';
  } else {
    document.getElementById('leader-view').style.display = 'none';
    document.getElementById('start-quiz-btn').style.display = 'none';
  }
}