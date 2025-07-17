/**** Original Code that I kept updating from Shopify fixes to here */


class SingleItemCarousel extends HTMLElement {

    static dir = ''
    constructor() {
        super();
        this.items = Array.from(this.querySelectorAll('.c-carousel-item'))
        this.dots = this.querySelectorAll('.carousel-item-count span')
        this.layout = this.querySelector('.c-carousel-layout')
        this.element_arr = this.items
        this.current = this.element_arr.length - 1
        this.left_prev = []
        this.right_prev = []
    }

    show_el(values) {
        const { translateX_el, opacity_el, opacity, x, remove, hide } = values

        // Slow then fast
        const inCirc = function (n) {
            return 1 - Math.sqrt(1 - n * n);
        };

        // slight ease out
        const outQuad = function (n) {
            return n * (2 - n);
        };
        // Strong ease out
        const outQuart = function (n) {
            return 1 - (--n * n * n * n);
        };

        const outCirc = function (n) {
            return Math.sqrt(1 - (--n * n));
        };

        const outExpo = function (n) {
            return 1 == n ? n : 1 - Math.pow(2, -10 * n);
        };
        const inExpo = function (n) {
            return 0 == n ? 0 : Math.pow(1024, n - 1);
        };
        const easeOut = progress =>
            Math.pow(--progress, 5) + 1;


        let start = 0
        const animate = timestamp => {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / 350, 1)
            const longer_progress = Math.min((timestamp - start) / 450, 1)
            const ease = outQuad(longer_progress)
            const ease_out = outCirc(progress)

            if (opacity) {
                opacity_el.style.opacity = hide ? 1 - (opacity * progress) : opacity * progress
                opacity_el.style.transform = hide ? `scale(${1 - (.1 * ease)})` : `scale(${.9 + (.1 * ease)})`
            }
            if (x) {
                translateX_el.style.opacity = remove ? 1 - (1 * ease_out) : 1 * ease_out
                translateX_el.style.transform = remove ? `translate(${x * ease}%) scale(${1 - (.6 * ease)})` : `translate(${x - (x * ease)}%) scale(${.6 + (.4 * ease)})`
            }
            if (longer_progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.transition_ended(translateX_el)
            }
        }
        requestAnimationFrame(animate)
    }

    /*
    * Two items
    */
    toggle(){

    }

    /*
    * Three or more items
    */
    rotate(direction) {
        SingleItemCarousel.dir = direction

        if (direction == 'right') {

            const current = this.current === this.element_arr.length - 1 ? 0 : this.current + 1
            const has_been_moved = this.items[current].style.zIndex == 10

            // Previous moved item gets moved back and item that just had opacity added now gets removed.
            if (has_been_moved) {
                console.log('has_been_moved:', has_been_moved)

                this.show_el({
                    opacity_el: this.items[this.current],
                    opacity: 1,
                    hide: true,
                    translateX_el: this.items[current],
                    x: -70,
                    remove: false
                })

                this.left_prev.pop()
            } else {
                this.items[this.current].style.zIndex = 10

                this.show_el({
                    opacity_el: this.items[current],
                    opacity: 1,
                    hide: false,
                    translateX_el: this.items[this.current],
                    x: 70,
                    remove: true
                })

                this.right_prev.unshift(this.items[this.current])
            }
            this.current = current
        } else {

            const current = this.current ? this.current - 1 : this.element_arr.length - 1
            const has_been_moved = this.items[current].style.zIndex == 10

            // Previous moved item gets moved back and item that just had opacity added now gets removed.
            if (has_been_moved) {
                console.log('has_been_moved:', has_been_moved)

                this.show_el({
                    opacity_el: this.items[this.current],
                    opacity: 1,
                    hide: true,
                    translateX_el: this.items[current],
                    x: 70,
                    remove: false
                })
                this.right_prev.shift()
            } else {
                this.items[this.current].style.zIndex = 10

                this.show_el({
                    opacity_el: this.items[current],
                    opacity: 1,
                    hide: false,
                    translateX_el: this.items[this.current],
                    x: -70,
                    remove: true
                })

                this.left_prev.unshift(this.items[this.current])
            }

            this.current = current
        }

    }

    update_height() {
        const resizeObserve = new ResizeObserver(entries => {
            const height = entries[0].contentRect.height
            this.layout.style.height = height + 'px'
        })
        resizeObserve.observe(this.items[0])
    }

    transition_ended(item) {
        console.log('this.current:', this.current)
        console.log('this.previous_inview_index:', this.previous_inview_index)
        this.dots[this.previous_inview_index].style.backgroundColor = 'lightGrey'
        this.dots[this.current].style.backgroundColor = 'black'
        this.previous_inview_index = this.current

        const prev_arr = this[`${SingleItemCarousel.dir}_prev`]
        const prev_item = prev_arr?.[1]
        if (prev_item) {
            prev_item.removeAttribute('style')
            prev_arr.pop()
        }
        console.log('prev_arr:', prev_arr)
    }


    addEventListeners() {
        this.querySelector('.c-left-btn').addEventListener('click', () => this.rotate('left'))
        this.querySelector('.c-right-btn').addEventListener('click', () => this.rotate('right'))
    }
    connectedCallback() {
        this.update_height()
        this.addEventListeners()
        console.log('this.element_arr:', this.element_arr)
        this.dots[this.current].style.backgroundColor = 'black'
        this.previous_inview_index = this.current
    }
}
customElements.define('single-item-carousel', SingleItemCarousel);



