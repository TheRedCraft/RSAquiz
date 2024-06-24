const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/check-answer', (req, res) => {
    const { question, answer } = req.body;
    const correctAnswer = eval(question.split(' ')[2] + question.split(' ')[3] + question.split(' ')[4]);
    res.json({ correct: answer === correctAnswer });
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});