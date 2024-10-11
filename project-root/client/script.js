const socket = io();
let currentRoom = null;
let isLeader = false;
let quizStartTime = null;
let timerInterval = null;

function urlParamstest() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const roomcodeurl = urlParams.get('room')
  if(roomcodeurl) {

  if (currentRoom) {
    alert('Du bist bereits einem Raum beigetreten.');
    return;
  }
  const participantName = prompt("Wie ist dein name?");
  const roomCode = roomcodeurl;
  socket.emit('joinRoom', { participantName, roomCode });
  urlParams.delete("room");
  history.pushState({}, '', '?' + query)  
  }
}

urlParamstest ();

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
  new QRCode(document.getElementById("qrcode"), `https://rsaquiz.onrender.com?room=${roomCode}`);
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
  updateParticipantsList(participants);
  if (isLeader) {
    updateLeaderView(participants);
  }
  console.log('Teilnehmer aktualisiert');
});

document.getElementById('start-quiz-btn').addEventListener('click', () => {
  socket.emit('startQuiz');
  quizStartTime = Date.now();
  startTimer();
  console.log('Quiz gestartet');
});

socket.on('question', (question) => {
  if (!isLeader) {
    document.getElementById('participant-view').style.display = 'block';
    document.getElementById('question').innerHTML = question.explanation;
    document.getElementById('question').innerHTML += "<br><br>" + question.question;

  }
  console.log('Frage erhalten');
});

document.getElementById('submit-answer-btn').addEventListener('click', () => {
  const answerInput = document.getElementById('answer');
  const answer = answerInput.value;
  socket.emit('submitAnswer', { answer, roomCode: currentRoom });
  answerInput.value = ''; // Eingabefeld zurücksetzen
  console.log('Antwort gesendet');
});

socket.on('correctAnswer', () => {
  showFeedback('Richtige Antwort!', 'success');
  socket.emit('nextQuestion', currentRoom);
});

socket.on('incorrectAnswer', () => {
  showFeedback('Falsche Antwort!', 'error');
});

socket.on('error', (message) => {
  alert(message);
  console.log(`Fehler: ${message}`);
});

socket.on('quizFinished', (message) => {
  alert(message);
  document.getElementById('participant-view').style.display = 'none';
  document.getElementById('waiting-screen').style.display = 'block';
  console.log('Quiz beendet');
  stopTimer();
  setTimeout(() => {
    socket.emit('checkAllFinished', currentRoom);
  }, 10000); // 10 Sekunden warten, bevor die Siegerehrung stattfindet
});

socket.on('update', (participants) => {
  if (isLeader) {
    updateLeaderView(participants);
  }
});

setInterval(() => {
  if (isLeader) {
    socket.emit('requestUpdate', currentRoom);
  }
}, 1000);

function updateParticipantsList(participants) {
  const participantsList = document.getElementById('participants-list');
  participantsList.innerHTML = '';
  participants.forEach(participant => {
    const totalAnswers = participant.correctAnswers + participant.incorrectAnswers;
    const accuracy = totalAnswers > 0 ? ((participant.correctAnswers / totalAnswers) * 100).toFixed(2) : 0;
    const li = document.createElement('li');
    li.textContent = `${participant.name} - Frage: ${participant.progress} - Richtige Antworten: ${participant.correctAnswers} - Falsche Antworten: ${participant.incorrectAnswers} - Genauigkeit: ${accuracy}%`;
    participantsList.appendChild(li);
  });
}

function updateLeaderView(participants) {
  // Sortiere die Teilnehmer nach ihrer Genauigkeit
  participants.sort((a, b) => {
    const accuracyA = a.correctAnswers / (a.correctAnswers + a.incorrectAnswers || 1);
    const accuracyB = b.correctAnswers / (b.correctAnswers + b.incorrectAnswers || 1);
    return accuracyB - accuracyA; // Absteigend sortieren
  });

  updateParticipantsList(participants);

  const totalProgress = participants.reduce((sum, p) => sum + p.progress, 0);
  const totalIncorrectAnswers = participants.reduce((sum, p) => sum + p.incorrectAnswers, 0);
  const totalAnswers = participants.reduce((sum, p) => sum + p.correctAnswers, 0);
  const averageAccuracy = totalProgress + totalIncorrectAnswers > 0 ? ((totalAnswers / (totalProgress + totalIncorrectAnswers)) * 100).toFixed(2) : 0;

  document.getElementById('average-accuracy').textContent = `Durchschnittliche Genauigkeit: ${averageAccuracy}%`;

  if (quizStartTime) {
    const elapsedTime = Math.floor((Date.now() - quizStartTime) / 1000);
    document.getElementById('elapsed-time').textContent = `Verstrichene Zeit: ${elapsedTime} Sekunden`;
  }

  if (isLeader) {
    document.getElementById('leader-view').style.display = 'block';
    document.getElementById('start-quiz-btn').style.display = 'block';
  } else {
    document.getElementById('leader-view').style.display = 'none';
    document.getElementById('start-quiz-btn').style.display = 'none';
  }
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(() => {
    if (quizStartTime) {
      const elapsedTime = Math.floor((Date.now() - quizStartTime) / 1000);
      document.getElementById('elapsed-time').textContent = `Verstrichene Zeit: ${elapsedTime} Sekunden`;
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

function showFeedback(message, type) {
  const feedbackElement = document.createElement('div');
  feedbackElement.className = `feedback ${type}`;
  feedbackElement.textContent = message;
  document.body.appendChild(feedbackElement);
  setTimeout(() => {
    feedbackElement.remove();
  }, 3000); // Feedback nach 3 Sekunden entfernen
}

function checkAllParticipantsFinished() {
  socket.emit('checkAllFinished', currentRoom);
}

socket.on('allParticipantsFinished', () => {
  document.getElementById('waiting-screen').style.display = 'none';
  showPodium();
});

function showPodium() {
  const podium = document.getElementById('podium');
  podium.style.display = 'block';

  const participants = Array.from(document.getElementById('participants-list').children);
  const sortedParticipants = participants.sort((a, b) => {
    const accuracyA = parseFloat(a.textContent.split(' - Genauigkeit: ')[1].replace('%', ''));
    const accuracyB = parseFloat(b.textContent.split(' - Genauigkeit: ')[1].replace('%', ''));
    return accuracyB - accuracyA;
  });

  if (sortedParticipants[0]) {
    document.getElementById('first-place').textContent = `1. Platz: ${sortedParticipants[0].textContent.split(' - ')[0]}`;
  }
  if (sortedParticipants[1]) {
    document.getElementById('second-place').textContent = `2. Platz: ${sortedParticipants[1].textContent.split(' - ')[0]}`;
  }
  if (sortedParticipants[2]) {
    document.getElementById('third-place').textContent = `3. Platz: ${sortedParticipants[2].textContent.split(' - ')[0]}`;
  }
}