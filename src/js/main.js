submitButton.addEventListener('click', async () => {
	const userAnswer = parseInt(answerElement.value, 10);
	const response = await fetch('/check-answer', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			question: questionElement.textContent,
			answer: userAnswer,
		}),
	});
	const result = await response.json();
	if (result.correct) {
		resultElement.textContent = 'Richtig!';
		currentQuestion = generateQuestion();
		answerElement.value = '';
	} else {
		resultElement.textContent = 'Falsch, versuchen Sie es erneut.';
	}
});
