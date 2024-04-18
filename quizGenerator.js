const fs = require('fs');
const path = require('path');

function generateUniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

function generateQuizFile(quizData) {
    const quizzesFolder = path.join(__dirname, 'quizzes');
    if (!fs.existsSync(quizzesFolder)) {
        fs.mkdirSync(quizzesFolder);
    }

    let code = generateUniqueCode();
    while (fs.existsSync(path.join(quizzesFolder, `${code}.txt`))) {
        code = generateUniqueCode();
    }
    const filename = `${code}.txt`;
    fs.writeFileSync(path.join(quizzesFolder, filename), quizData.join('\n'));
    fs.writeFileSync(path.join(__dirname, 'quiz_attendee', filename), '');
    console.log(`Quiz data written to ${filename}`);
    return filename;
}

module.exports = generateQuizFile;
