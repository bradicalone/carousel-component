/**** Original Code that I kept updating from Shopify fixes to here */


class SingleItemCarousel extends HTMLElement {

    static dir = 'd'
    constructor() {
        super();
        this.items = Array.from(this.querySelectorAll('.c-carousel-item'))
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


        let start = 0
        const animate = timestamp => {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / 350, 1)

            const opac_progress = Math.min((timestamp - start) / 450, 1)
            const ease = outCirc(opac_progress)
            const ease_out = inCirc(opac_progress)

            if (opacity) {
                opacity_el.style.opacity = hide ? 1 - (opacity * progress) : opacity * progress
                opacity_el.style.transform = hide ? `scale(${1 - (.1 * ease)})` : `scale(${.9 + (.1 * ease)})`
            }
            if (x) {
                translateX_el.style.opacity = remove ? 1 - (1 * progress) : 1 * progress
                translateX_el.style.transform = remove ? `translate(${x * ease_out}%) scale(${1 - (.6 * ease_out)})` : `translate(${x - (x * ease)}%) scale(${.6 + (.4 * ease)})`
            }
            if (opac_progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.transition_ended()
            }
        }
        requestAnimationFrame(animate)
    }


    rotate(direction) {
        SingleItemCarousel.dir = direction
        
        if (direction == 'right') {

            const current = this.current === this.element_arr.length - 1 ? 0 : this.current + 1
            // const has_been_moved = this.items[current].classList.contains('--move-left')
            const has_been_moved = this.items[current].style.zIndex == 10

            // Previous moved item gets moved back and item that just had opacity added now gets removed.
            if (has_been_moved) {
                console.log('has_been_moved:', has_been_moved)

                this.show_el({
                    opacity_el: this.items[this.current],
                    opacity: 1,
                    hide: true,
                    translateX_el: this.items[current],
                    x: -100,
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
                    x: 100,
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
                    x: 100,
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
                    x: -100,
                    remove: true
                })

                this.left_prev.unshift(this.items[this.current])
            }

            this.current = current
        }
        console.log('this.current:', this.current)
    }

    update_height() {
        const resizeObserve = new ResizeObserver(entries => {
            const height = entries[0].contentRect.height
            this.layout.style.height = height + 'px'
        })
        resizeObserve.observe(this.items[0])
    }

    transition_ended(item) {
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

    }
}
customElements.define('single-item-carousel', SingleItemCarousel);



