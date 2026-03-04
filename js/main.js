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
                <div class="column">
                    <h3>Меньше 50%</h3>
                    <card v-for="card in firstColumn" :key="card.id" :card-id="card.id" :column-index="0" @update-card="updateCard"
                        :card="card" :fulledSecondColumn="fulledSecondColumn"></card>
                </div>
                <div class="column">
                    <h3>Больше 50% Но меньше 100%</h3>
                    <card v-for="card in secondColumn" :key="card.id" :card-id="card.id" :column-index="1" @update-card="updateCard"
                        :card="card" :fulledSecondColumn="fulledSecondColumn"></card>
                </div>
                <div class="column">
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
        appendCardInFirstColumn() {
            if (this.firstColumn.length < 3) {
                const card = {
                    id: Date.now() + Math.random(),
                    title: null,
                    listNotes: [
                        { text: "Сделать дело1", completed: false },
                        { text: "Сделать дело2", completed: false },
                        { text: "Сделать дело3", completed: false }
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

        cardIndex: {
            type: Number,
            required: true
        },

        fulledSecondColumn: {
            type: Boolean,
            required: true
        }
    },
    template: `
        <div class="card">
            <input type="text" placeholder="Заголовок" :value="card.title" @input="updateTitle($event.target.value)" :disabled="fulledSecondColumn && columnIndex==0 || columnIndex==2">
            <div v-for="(note, id) in card.listNotes" :key="id">
                <input type="text" placeholder="Заметка" :value="note.text" :disabled="fulledSecondColumn && columnIndex==0 || columnIndex==2" @input="updateNote(id, $event.target.value)">
                <input type="checkbox" @change="completeNote(id)" v-show="columnIndex!=2" :disabled="note.completed || fulledSecondColumn && columnIndex==0">
                <button @click="removeNote(id)" :disabled="note.completed || notesReachedMinimum || fulledSecondColumn && columnIndex==0" v-show="columnIndex!=2">Удалить</button>
            </div>
            <button @click="addNote" v-show="!notesExceededLimit && columnIndex!=2 && columnIndex!=1" :disabled="fulledSecondColumn && columnIndex==0">Добавить заметку</button>
            <b v-show="columnIndex==2">{{formattedLastCompletedAt}}</b>
        </div>
    `,
    methods: {
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

let app = new Vue({
    el: '#app',
    data: {
    },
    methods: {
    }
})