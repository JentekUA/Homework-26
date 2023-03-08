'use strict';

const PRIORITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
};

class Note {
    constructor(id, value, priority, isFinished = false) {
        this.id = id;
        this.value = value;
        this.priority = priority;
        this.isFinished = isFinished;
    }

    editValue(newText) {
        this.value = newText;
    }

    editPriority(priority) {
        this.priority = priority;
    }

    changeStatus() {
        this.isFinished = !this.isFinished;
    }
}

class Model {
    async authenticate() {
        const response = await fetch('https://todo.hillel.it/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: 'Oleksandr Aleksashyn' }),
        });

        const json = await response.json();
        this.accessToken = json.access_token;
    }

    async getNotes() {
        if (!this.notes) {
            await this.authenticate();

            const response = await fetch('https://todo.hillel.it/todo', {
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Authorization': `Bearer ${this.accessToken}`,
                },
            });

            const json = await response.json();
            this.notes = json.reduce((acc, { _id, value, priority, checked }) => {
                acc[_id] = new Note(_id, value, priority, checked);
                return acc;
            }, {});
        }

        return Object.values(this.notes);
    }

    async createNote(value, priority = PRIORITY.LOW) {
        const response = await fetch('https://todo.hillel.it/todo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({ value, priority }),
        });

        const json = await response.json();
        const newNote = new Note(json._id, json.value, json.priority, json.checked);
        this.notes[newNote.id] = newNote;

        return newNote;
    }

    async deleteNote(id) {
        const response = await fetch(`https://todo.hillel.it/todo/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
        });

        return await response.json();
    }

    async editNoteText(id, newValue, newPriority) {
        const response = await fetch(`https://todo.hillel.it/todo/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
                value: newValue,
                priority: newPriority,
            }),
        });

        return await response.json();
    }

    async changeNoteStatus(id) {
        await fetch(`https://todo.hillel.it/todo/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
        });
    }
}

class View {
    input = document.querySelector('.new-note-input');
    addBtn = document.querySelector('.add-btn');
    noteList = document.querySelector('.note-list');

    constructor() {
        this.noteList.addEventListener('click', ({ target }) => {
            if (target.classList.contains('edit-btn')) {
                const li = target.closest('li');
                View.toggleHidden(li.querySelector('.save-btn'));
                View.toggleHidden(li.querySelector('.edit-btn'));

                const noteText = li.querySelector('.note-text');
                View.toggleHidden(noteText);

                const editNoteInput = li.querySelector('.edit-note-input');
                editNoteInput.value = noteText.textContent;
                View.toggleHidden(editNoteInput);

                const notePriority = li.querySelector('.note-priority');
                const priorityInput = li.querySelector('.priority-note-input');

                priorityInput.value = notePriority.textContent;
                View.toggleHidden(notePriority);
                View.toggleHidden(priorityInput);
            }
        });
    }

    static toggleHidden(element) {
        element.classList.toggle('hidden');
    }

    getNoteInput() {
        return this.input.value.trim();
    }

    clearNoteInput() {
        this.input.value = '';
    }

    static createNoteNode(text, id, checked, priority) {
        const noteNode = document.createElement('li');
        if (checked) {
            noteNode.classList.add('done');
        }

        noteNode.innerHTML = `
        <span class='note-text'>${text}</span>
        <span class='note-priority'>${priority}</span>
        <input type='text' class='edit-note-input hidden' />
        <input type='number' min='1' max='3' class='priority-note-input hidden' />
        <input class='note-status' data-id='${id}' type='checkbox' ${checked ? 'checked' : ''}/>
        <button class='edit-btn' data-id='${id}'>Edit</button>
        <button class='save-btn hidden' data-id='${id}'>Save</button>
        <button class='delete-btn' data-id='${id}'>Delete</button>
        `;

        return noteNode;
    }

    addNoteNode(text, id, checked, priority) {
        const newNoteNode = View.createNoteNode(text, id, checked, priority);
        this.noteList.append(newNoteNode);
    }

    displayNotes(notes) {
        for (const { value, id, isFinished, priority } of notes) {
            const noteNode = View.createNoteNode(value, id, isFinished, priority);
            this.noteList.append(noteNode);
        }
    }

    addNoteHandler(handler) {
        this.addBtn.addEventListener('click', handler);
    }

    deleteNoteHandler(handler) {
        this.noteList.addEventListener('click', ({ target }) => {
            if (target.classList.contains('delete-btn')) {
                handler(target.dataset.id);
                target.closest('li').remove();
            }
        });
    }

    editNoteHandler(handler) {
        this.noteList.addEventListener('click', ({ target }) => {
            if (target.classList.contains('save-btn')) {
                const li = target.closest('li');

                const newText = li.querySelector('.edit-note-input').value;
                const noteText = li.querySelector('.note-text');
                const priority = li.querySelector('.note-priority');
                const newPriority = li.querySelector('.priority-note-input');

                noteText.textContent = newText;
                priority.textContent = newPriority.value;

                handler(target.dataset.id, newText, Number(newPriority.value));

                View.toggleHidden(noteText);
                View.toggleHidden(newPriority);
                View.toggleHidden(priority);
                View.toggleHidden(li.querySelector('.edit-note-input'));
                View.toggleHidden(li.querySelector('.save-btn'));
                View.toggleHidden(li.querySelector('.edit-btn'));
            }
        });
    }

    changeStatusHandler(handler) {
        this.noteList.addEventListener('click', ({ target }) => {
            if (target.classList.contains('note-status')) {
                const li = target.closest('li');
                li.classList.toggle('done');
                handler(target.dataset.id);
            }
        });
    }
}
// eslint-disable-next-line
class Controller {
    model = new Model();
    view = new View();

    constructor() {
        this.model.getNotes().then(notes => this.view.displayNotes(notes));
        this.view.addNoteHandler(() => this.handleAddNote());
        this.view.deleteNoteHandler(id => this.handleDeleteNote(id));
        this.view.editNoteHandler((id, text, priority) => {
            this.handleEditNoteText(id, text, priority);
        });
        this.view.changeStatusHandler(id => this.handleChangeNoteStatus(id));
    }

    async handleAddNote() {
        const text = this.view.getNoteInput();
        if (!text.trim()) return;

        this.view.clearNoteInput();

        const newNote = await this.model.createNote(text);
        this.view.addNoteNode(text, newNote.id, newNote.isFinished, newNote.priority);
    }

    handleDeleteNote(id) {
        this.model.deleteNote(id);
    }

    handleEditNoteText(id, text, priority) {
        this.model.editNoteText(id, text, priority);
    }

    handleChangeNoteStatus(id) {
        this.model.changeNoteStatus(id);
    }
}
