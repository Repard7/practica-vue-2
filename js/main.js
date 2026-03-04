Vue.component('product-notes', {
    data() {
        return {
            firstColumn: [],
            secondColumn: [],
            thirdColumn: [],
        }
    },
    template: `
        <div class="product-notes">
            <button class="appendCartButton">
                <div class="column">
                    <h3>Меньше 50%</h3>
                    <card v-for="card in firstColumn"></card>
                </div>
                <div class="column">
                    <h3>Больше 50% Но меньше 100%</h3>
                    <card v-for="card in secondColumn"></card>
                </div>
                <div class="column">
                    <h3>Выполненные</h3>
                    <card v-for="card in thirdColumn"></card>
                </div>
            </div>
        </div>
    `,
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
            <input type="text" placeholder="Заголовок" :value="card.title" @input="updateTitle($event.target.value)">
            <div v-for="(note, id) in card.listNotes" :key="id">
                <input type="text" placeholder="Заметка" :value="note.text">
                <input type="checkbox" @change="completeNote(id)">
                <button @click="removeNote(id)">Удалить</button>
            </div>
            <button @click="addNote">Добавить заметку</button>
        </div>
    `
})

let app = new Vue({
    el: '#app',
    data: {
    },
    methods: {
    }
})

