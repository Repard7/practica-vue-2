Vue.component('product-notes', {
    data() {
        return {
            firstColumn: [],
            secondColumn: [],
            thirdColumn: []
        }
    },
    template: `
        <div class="product-notes">
            <button class="appendCartButton" :disabled="fulledSecondColumn" @click="appendCardInFirstColumn">Добавить новую карточку</button>
            <div class="columns">
                <div class="column" @dragover.prevent @drop="onDrop($event, 0)">
                    <h3>Меньше 50%</h3>
                    <card v-for="card in firstColumn" :key="card.id" :card-id="card.id" :column-index="0" @update-card="updateCard"
                        :card="card" :fulledSecondColumn="fulledSecondColumn"></card>
                </div>
                <div class="column" @dragover.prevent @drop="onDrop($event, 1)">
                    <h3>Больше 50% Но меньше 100%</h3>
                    <card v-for="card in secondColumn" :key="card.id" :card-id="card.id" :column-index="1" @update-card="updateCard"
                        :card="card" :fulledSecondColumn="fulledSecondColumn"></card>
                </div>
                <div class="column" @dragover.prevent @drop="onDrop($event, 2)">
                    <h3>Выполненные</h3>
                    <card v-for="card in thirdColumn" :key="card.id" :card-id="card.id" :column-index="2" @update-card="updateCard"
                        :card="card" :fulledSecondColumn="fulledSecondColumn"></card>
                </div>
            </div>
        </div>
    `,
    mounted() {
        const saved = localStorage.getItem('product-notes-state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.firstColumn = state.first || [];
                this.secondColumn = state.second || [];
                this.thirdColumn = state.third || [];
            } catch (e) {
                console.error('Ошибка загрузки состояния', e);
            }
        }
    },
    methods: {
        onDrop(event, targetColumnIndex) {
            event.preventDefault();

            const rawData = event.dataTransfer.getData('text/plain')
            if (!rawData) return;

            const { cardId, fromColumnIndex } = JSON.parse(rawData)

            if (fromColumnIndex !== targetColumnIndex) return;

            let columnArray;
            switch (targetColumnIndex) {
                case 0: columnArray = this.firstColumn; break;
                case 1: columnArray = this.secondColumn; break;
                case 2: columnArray = this.thirdColumn; break;
            }

            const targetElement = event.target.closest('.card');
            if (!targetElement) return;

            const targetId = targetElement.dataset.cardId;

            const targetIndex = columnArray.findIndex(c => c.id == targetId);
            const sourceIndex = columnArray.findIndex(c => c.id == cardId);

            if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

            const [movedCard] = columnArray.splice(sourceIndex, 1);
            columnArray.splice(targetIndex, 0, movedCard);
        },

        appendCardInFirstColumn() {
            if (this.firstColumn.length < 3) {
                const card = {
                    id: Date.now() + Math.random(),
                    title: null,
                    listNotes: [
                        { text: "Сделать дело1", completed: false, listSubNotes: [{ text: "подзаметка", completed: false }] },
                        { text: "Сделать дело2", completed: false, listSubNotes: [{ text: "подзаметка", completed: false }] },
                        { text: "Сделать дело3", completed: false, listSubNotes: [{ text: "подзаметка", completed: false }] }
                    ],
                    lastCompletedAt: null
                }
                this.firstColumn.push(card)
            }
        },

        updateCard(changedData) {
            const { columnIndex, cardId, field, value } = changedData;

            let currentColumn;
            switch (columnIndex) {
                case 0:
                    currentColumn = this.firstColumn;
                    break;
                case 1:
                    currentColumn = this.secondColumn;
                    break;
                case 2:
                    currentColumn = this.thirdColumn;
                    break;
            }

            const cardIndex = currentColumn.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return;
            this.$set(currentColumn[cardIndex], field, value)

            const card = currentColumn[cardIndex];
            const total = card.listNotes.length;

            const completedCount = card.listNotes.filter(note => note.completed).length;
            const percent = (completedCount / total) * 100;

            let targetColumnIndex;
            if (percent < 50) {
                targetColumnIndex = 0;
            }
            else if (percent < 100) {
                if (this.fulledSecondColumn) {
                    targetColumnIndex = columnIndex;
                }
                else {
                    targetColumnIndex = 1;
                }
            }
            else {
                targetColumnIndex = 2;
            }


            if (columnIndex != targetColumnIndex) {

                currentColumn.splice(cardIndex, 1)

                let targetColumn;
                switch (targetColumnIndex) {
                    case 0: targetColumn = this.firstColumn; break;
                    case 1: targetColumn = this.secondColumn; break;
                    case 2: targetColumn = this.thirdColumn; break;
                }

                targetColumn.push(card)
            }
        },
    },
    computed: {
        fulledSecondColumn() {
            return this.secondColumn.length >= 5;
        },
        allColumns() {
            return {
                first: this.firstColumn,
                second: this.secondColumn,
                third: this.thirdColumn
            };
        }
    },
    watch: {
        allColumns: {
            deep: true,
            handler(newVal) {
                localStorage.setItem('product-notes-state', JSON.stringify(newVal));
            }
        }
    }
})

Vue.component('card', {
    props: {
        cardId: {
            type: [String, Number],
            required: true
        },

        card: {
            type: Object,
            required: true
        },

        columnIndex: {
            type: Number,
            required: true
        },

        fulledSecondColumn: {
            type: Boolean,
            required: true
        }
    },
    template: `
        <div class="card" :data-card-id="cardId" :draggable="!isDraggableDisabled" @dragstart="onDragStart($event)" @dragend="onDragEnd">
            <input :draggable="false" type="text" placeholder="Заголовок" :value="card.title" @input="updateTitle($event.target.value)" :disabled="fulledSecondColumn && columnIndex==0 || columnIndex==2">
            <note v-for="(note, idx) in card.listNotes" :key="idx" :draggable="false"
                :note="note" :note-index="idx" :card-id="cardId" :column-index="columnIndex" :fulledSecondColumn="fulledSecondColumn"
                @update-note="onUpdateNote" @remove-note="onRemoveNote" @completed-note="onCompletedNote"
                @append-subnote="onAppendSubNote" @update-subnote="onUpdateSubNote" @remove-subnote="onRemoveSubNote"
                @complete-subnote="onCompleteSubNote"
            ></note>
            <button @click="addNote" :draggable="false" v-show="!notesExceededLimit && columnIndex!=2 && columnIndex!=1" :disabled="fulledSecondColumn && columnIndex==0">Добавить заметку</button>
            <b v-show="columnIndex==2" :draggable="false">{{formattedLastCompletedAt}}</b>
        </div>
    `,

    //            <input type="text" placeholder="Заметка" :value="note.text"  @input="updateNote(id, $event.target.value)">
    //            <div>
    //                <input type="checkbox" @change="completeNote(id)" >
    //                <button @click="removeNote(id)" >Удалить</button>
    //            </div> 
    methods: {

        onDragStart(event) {
            event.dataTransfer.setData('text/plain', JSON.stringify({
                cardId: this.cardId,
                fromColumnIndex: this.columnIndex
            }));
            event.dataTransfer.effectAllowed = 'move';
        },

        onDragEnd() { },

        onUpdateNote({ noteIndex, value }) {
            const newList = [...this.card.listNotes];
            newList[noteIndex] = { ...newList[noteIndex], text: value };
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
        },

        onRemoveNote(noteIndex) {
            if (this.card.listNotes.length <= 3) return;
            const newList = this.card.listNotes.filter((_, idx) => idx !== noteIndex);
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
        },

        onCompletedNote({ noteIndex, completed }) {
            const newList = [...this.card.listNotes];
            newList[noteIndex] = { ...newList[noteIndex], completed };
            if (!newList[noteIndex].listSubNotes.every(sub => sub.completed)) {
                return;
            }
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
            if (completed) {
                this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'lastCompletedAt', value: Date.now() });
            }
        },

        onAppendSubNote(noteIndex) {
            const newList = [...this.card.listNotes];
            const subNotes = newList[noteIndex].listSubNotes || [];
            if (subNotes.length == 7) return;
            newList[noteIndex] = { ...newList[noteIndex], listSubNotes: [...subNotes, { text: '', completed: false }] };
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
        },

        onUpdateSubNote({ noteIndex, subIndex, value }) {
            const newList = [...this.card.listNotes];
            const subNotes = [...(newList[noteIndex].listSubNotes || [])];
            subNotes[subIndex] = { ...subNotes[subIndex], text: value };
            newList[noteIndex] = { ...newList[noteIndex], listSubNotes: subNotes };
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
        },

        onRemoveSubNote({ noteIndex, subIndex }) {
            const newList = [...this.card.listNotes];
            const subNotes = (newList[noteIndex].listSubNotes || []).filter((_, idx) => idx !== subIndex);
            newList[noteIndex] = { ...newList[noteIndex], listSubNotes: subNotes };
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
        },

        onCompleteSubNote({ noteIndex, subIndex, completed }) {
            const newList = [...this.card.listNotes];
            const subNotes = [...(newList[noteIndex].listSubNotes || [])];
            subNotes[subIndex] = { ...subNotes[subIndex], completed: true }; // предполагаем, что подзаметка становится выполненной
            newList[noteIndex] = { ...newList[noteIndex], listSubNotes: subNotes };
            this.$emit('update-card', { columnIndex: this.columnIndex, cardId: this.cardId, field: 'listNotes', value: newList });
        },

        updateTitle(newTitle) {
            this.$emit('update-card', {
                columnIndex: this.columnIndex,
                cardId: this.cardId,
                field: 'title',
                value: newTitle
            })
        },

        updateNote(noteIndex, noteValue) {
            const newList = [...this.card.listNotes]
            newList[noteIndex] = { text: noteValue, completed: this.card.listNotes[noteIndex].completed }
            this.$emit('update-card', {
                columnIndex: this.columnIndex,
                cardId: this.cardId,
                field: 'listNotes',
                value: newList
            })
        },

        addNote() {
            if (this.card.listNotes.length >= 5) return;
            const newList = [...this.card.listNotes, { text: '', completed: false }]
            this.$emit('update-card', {
                columnIndex: this.columnIndex,
                cardId: this.cardId,
                field: 'listNotes',
                value: newList
            })
        },

        removeNote(noteIndex) {
            if (this.card.listNotes.length == 3) return;
            const newList = this.card.listNotes.filter((item, index) => index !== noteIndex)
            this.$emit('update-card', {
                columnIndex: this.columnIndex,
                cardId: this.cardId,
                field: 'listNotes',
                value: newList
            })
        },

        completeNote(noteIndex) {
            const newList = [...this.card.listNotes];
            newList[noteIndex] = { ...newList[noteIndex], completed: true };
            this.$emit('update-card', {
                columnIndex: this.columnIndex,
                cardId: this.cardId,
                field: 'listNotes',
                value: newList
            });

            const now = Date.now();
            this.$emit('update-card', {
                columnIndex: this.columnIndex,
                cardId: this.cardId,
                field: 'lastCompletedAt',
                value: now
            });

        }
    },
    computed: {
        isDraggableDisabled() {
            return (this.fulledSecondColumn && this.columnIndex === 0);
        },

        notesExceededLimit() {
            return this.card.listNotes.length >= 5;
        },

        notesReachedMinimum() {
            return this.card.listNotes.length <= 3;
        },

        formattedLastCompletedAt() {
            if (!this.card.lastCompletedAt) return '';
            return new Date(this.card.lastCompletedAt).toLocaleString();
        }
    }
})


Vue.component('note', {
    props: {
        noteIndex: {
            type: [Number],
            required: true
        },

        note: {
            type: Object,
            required: true
        },

        cardId: {
            type: [String, Number],
            required: true
        },

        columnIndex: {
            type: Number,
            required: true
        },

        fulledSecondColumn: {
            type: Boolean,
            required: true
        }
    },

    data() {
        return {
            showError: false
        }
    },

    template: `
        <div class="note">
            <details>
                
                <summary>
                    <div>
                        <span v-if="showError">Не все подпункты выпонены!</span>
                        <div>
                            <input type="checkbox" ref="checkbox" @click="onCheckboxClick" @change="completeNote" :checked="note.completed" v-show="columnIndex!=2" :disabled="fulledSecondColumn && columnIndex==0 || showError">
                            <input type="text" placeholder="Заметка" :value="note.text" @input="updateNote($event.target.value)" :disabled="fulledSecondColumn && columnIndex==0 || columnIndex==2">
                            <button @click="removeNote" :disabled="note.completed || fulledSecondColumn && columnIndex==0" v-show="columnIndex!=2">Удалить</button>
                        </div>
                    </div>
                </summary>
                <div v-for="(subNote, subIndex) in note.listSubNotes" :key="subIndex">
                    <input type="checkbox" @change="completeSubNote(subIndex, $event)" :checked="subNote.completed" :disabled="fulledSecondColumn && columnIndex==0">
                    <input class="subNoteInputText" type="text" placeholder="Подпункт" :value="subNote.text" @input="updateSubNote(subIndex, $event.target.value)" :disabled="fulledSecondColumn && columnIndex==0 || columnIndex==2">
                    <button @click="removeSubNote(subIndex)" :disabled="fulledSecondColumn && columnIndex==0">Удалить</button>
                </div>
                <button @click="appendSubNote" :disabled="fulledSecondColumn && columnIndex==0">Добавить подпункт</button>
            </details>
        </div>
    `,
    methods: {
        onCheckboxClick() {
            if (!this.canComplete) {
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 2000);
                this.$refs.checkbox.checked = this.note.completed;
            }
        },

        updateNote(newText) {
            this.$emit('update-note', {
                noteIndex: this.noteIndex,
                value: newText
            })
        },

        removeNote() {
            this.$emit('remove-note', this.noteIndex)
        },

        completeNote(event) {
            if (!this.canComplete) return;
            this.$emit('completed-note', {
                noteIndex: this.noteIndex,
                completed: event.target.checked
            })
        },

        appendSubNote() {
            this.$emit('append-subnote', this.noteIndex)
        },

        updateSubNote(subIndex, newText) {
            this.$emit('update-subnote', {
                noteIndex: this.noteIndex,
                subIndex: subIndex,
                value: newText
            });
        },

        removeSubNote(subIndex) {
            this.$emit('remove-subnote', {
                noteIndex: this.noteIndex,
                subIndex: subIndex
            });
        },

        completeSubNote(subIndex) {
            this.$emit('complete-subnote', {
                noteIndex: this.noteIndex,
                subIndex: subIndex
            });
        },
    },
    computed: {
        canComplete() {
            return this.note.listSubNotes && this.note.listSubNotes.every(sub => sub.completed)
        }
    }
})

let app = new Vue({
    el: '#app',
    data: {
    },
    methods: {
    }
})