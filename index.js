const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 8001;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Crear o abrir base de datos SQLite en archivo tasks.db
const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) {
        console.error('Error abriendo la base de datos', err.message);
    } else {
        console.log('Conectado a SQLite');
    }
});

// Crear tabla tasks si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0
  )
`);

// --- Rutas CRUD ---

// Obtener todas las tareas
app.get('/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Obtener tarea por id
app.get('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Task no encontrada' });
        }
        res.json(row);
    });
});

// Crear nueva tarea
app.post('/tasks', (req, res) => {
    const { title, completed = 0 } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'El campo title es requerido' });
    }
    db.run('INSERT INTO tasks (title, completed) VALUES (?, ?)', [title, completed], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, title, completed });
    });
});

// Actualizar tarea
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;

    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Task no encontrada' });

        const updatedTitle = title ?? row.title;
        const updatedCompleted = completed ?? row.completed;

        db.run(
            'UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
            [updatedTitle, updatedCompleted, id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: Number(id), title: updatedTitle, completed: updatedCompleted });
            }
        );
    });
});

// Eliminar tarea
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Task no encontrada' });
        res.json({ message: 'Tarea eliminada correctamente' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
