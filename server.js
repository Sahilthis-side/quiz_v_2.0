const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const generateQuizFile = require('./quizGenerator');
const path = require('path'); // Import the path module
const app = express();
const PORT = process.env.PORT || 3000; // Default port is 3000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

app.get('/quizcreate.html', (req, res) => {
    // Serve the quizcreate.html file when requested
    res.sendFile(path.join(__dirname, 'quizcreate.html'));
});

app.post('/generateQuiz', (req, res) => {
    const quizData = req.body.quizData;
    const filename = generateQuizFile(quizData); // Generate quiz file and get the filename
    res.json({ message: 'Quiz created successfully.', filename: filename }); // Send success message and filename back to client
});

function readQuizData(code) {
    const quizFilePath = path.join(__dirname, 'quizzes', `${code}.txt`);
    return fs.readFileSync(quizFilePath, 'utf-8');
}

// Endpoint to fetch quiz data based on the code provided
function readQuizData(code) {
    console.log(code);
    const quizFilePath = path.join(__dirname, 'quizzes', `${code}.txt`);
    return fs.readFileSync(quizFilePath, 'utf-8').trim().split('\n');
}

// Endpoint to fetch quiz data based on the code provided
app.get('/quiz/:code', (req, res) => {
    const code = req.params.code;
    try {
        const quizData = readQuizData(code);
        // Send quiz data as JSON response
        res.json({
            questions: quizData[0],
            option1: quizData[1],
            option2: quizData[2],
            option3: quizData[3],
            option4: quizData[4],
            correctAnswer: quizData[5]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(404).json({ error: 'Quiz not found' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(username);
    console.log(password);
    // Load accounts from file
    const accounts = JSON.parse(fs.readFileSync('accounts.txt', 'utf-8'));

    if (accounts[username] && accounts[username] === password) {
        res.redirect(`/main.html?username=${username}`);
    } else {
        res.send('Invalid username or password');
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    // Load accounts from file
    const accounts = JSON.parse(fs.readFileSync('accounts.txt', 'utf-8'));

    if (accounts[username]) {
        res.send('Username already exists');
    } else {
        accounts[username] = password;
        fs.writeFileSync('accounts.txt', JSON.stringify(accounts));
        res.send('Account created successfully');
    }
});

app.post('/attendQuiz/:quizCode', (req, res) => {
    const quizCode = req.params.quizCode;
    const attendeeData = req.body;

    const attendeeFilePath = path.join(__dirname, 'quiz_attendee', `${quizCode}.txt`);
    fs.readFile(attendeeFilePath, 'utf-8', (err, data) => {
        if (err) {
            // If file doesn't exist, create a new file and write attendee data
            const newData = [attendeeData];
            fs.writeFile(attendeeFilePath, formatAttendeeData(newData), err => {
                if (err) {
                    console.error('Error writing file:', err);
                    res.status(500).send('Failed to submit quiz');
                } else {
                    res.sendStatus(200);
                }
            });
        } else {
            // If file exists, append attendee data to existing data
            let existingData = parseAttendeeData(data);
            existingData.push(attendeeData);
            fs.writeFile(attendeeFilePath, formatAttendeeData(existingData), err => {
                if (err) {
                    console.error('Error writing file:', err);
                    res.status(500).send('Failed to submit quiz');
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});

// Helper function to parse attendee data from text format
function parseAttendeeData(data) {
    return data.trim().split('\n').map(line => {
        const parts = line.split('|');
        return { username: parts[0], score: parseInt(parts[1]) || 0 }; // Ensure score is parsed as integer, default to 0 if NaN
    });
}

// Helper function to format attendee data for writing into text file
function formatAttendeeData(attendees) {
    return attendees.map(attendee => `${attendee.username}|${attendee.score}`).join('\n');
}

app.get('/enquireQuiz/:quizCode', (req, res) => {
    const quizCode = req.params.quizCode;
    const attendeeFilePath = path.join(__dirname, 'quiz_attendee', `${quizCode}.txt`);
    
    fs.readFile(attendeeFilePath, 'utf-8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.send('No attendees found for this quiz.');
            } else {
                console.error('Error reading file:', err);
                res.status(500).send('Failed to enquire quiz');
            }
        } else {
            // Parse and format attendee data, ignoring the first entry
            const attendees = parseAttendeeData(data);
            if (attendees.length > 1) {
                attendees.shift(); // Remove the first entry
                const attendeeList = attendees.map(attendee => `${attendee.username}: ${attendee.score}`).join('<br>');
                res.send(attendeeList);
            } else {
                res.send('No attendees found for this quiz.'); // If there's only one entry or none, return an empty response
            }
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
