const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/check-answer', (req, res) => {
    const { question, answer } = req.body;
    const correctAnswer = eval(question); // Achtung: eval() kann gefährlich sein, verwenden Sie es mit Vorsicht
    if (answer === correctAnswer) {
        res.json({ correct: true });
    } else {
        res.json({ correct: false });
    }
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});