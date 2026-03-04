Vue.component('product-notes', {
    data() {
        return {
            firstColumn: [],
            secondColumn: [],
            thirdColumn: [],
        }
    },
    template: `

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

    `
})

let app = new Vue({
    el: '#app',
    data: {
    },
    methods: {
    }
})

