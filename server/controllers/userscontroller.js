const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const register = async (req, res) => {
    try {
        const { username, password } = req.body;
 
        const hashedPassword = await bcrypt.hash(password, 10);
 
        const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );

        const user = result.rows[0];
        res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
 
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
 
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
 
        const token = jwt.sign({ userId: user.id, username: user.username }, 'your_secret_key', {
            expiresIn: '1h', 
        });

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.userId; 
        const result = await db.query(
            'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, title, content, created_at',
            [userId, title, content]
        );

        const note = result.rows[0];
        res.status(201).json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getNotes = async (req, res) => {
    try {
        const userId = req.user.userId; 
        const result = await db.query('SELECT * FROM notes WHERE user_id = $1', [userId]);
        const notes = result.rows;

        res.status(200).json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    register,
    login,
    addNote,
    getNotes,
};
