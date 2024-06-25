const socket = io();

document.getElementById('create-room-btn').addEventListener('click', () => {
  const leaderName = document.getElementById('leader-name').value;
  socket.emit('createRoom', leaderName);
});

document.getElementById('join-room-btn').addEventListener('click', () => {
  const participantName = document.getElementById('participant-name').value;
  const roomCode = document.getElementById('room-code').value;
  socket.emit('joinRoom', { participantName, roomCode });
});

socket.on('roomCreated', (roomCode) => {
  document.getElementById('create-room').style.display = 'none';
  document.getElementById('leader-view').style.display = 'block';
  alert(`Raum erstellt! Code: ${roomCode}`);
});

socket.on('participantJoined', (participants) => {
  const participantsList = document.getElementById('participants-list');
  participantsList.innerHTML = '';
  participants.forEach(participant => {
    const li = document.createElement('li');
    li.textContent = participant.name;
    participantsList.appendChild(li);
  });
});

document.getElementById('start-quiz-btn').addEventListener('click', () => {
  socket.emit('startQuiz');
});

socket.on('question', (question) => {
  document.getElementById('leader-view').style.display = 'none';
  document.getElementById('participant-view').style.display = 'block';
  document.getElementById('question').textContent = question;
});

document.getElementById('submit-answer-btn').addEventListener('click', () => {
  const answer = document.getElementById('answer').value;
  socket.emit('submitAnswer', answer);
});