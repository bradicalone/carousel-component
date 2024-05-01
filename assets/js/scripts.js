/**** Original Code that I kept updating from Shopify fixes to here */

window.onload = function () {
    carousel()
    carouselPopUp()
}

const Carousel = function (carousel) {
    // Cached / State
    const data = carousel.dataset
    const current_items = carousel.querySelectorAll('.c-carousel-item')
    const item_computedStyle = window.getComputedStyle(current_items[0])
    const item_parent = carousel.querySelector('.carousel-item-array')
    let countRequested = Number(data.itemCount || 4);
    let defaultItems = data.itemDefault;
    const current_items_length = current_items.length

    if (current_items_length < countRequested || defaultItems) countRequested = current_items_length


    /* If data attribute exist for override then desktop items will show inline and no handles for carousel */
    let overRide = data.override
    let buttonsToShow = data.carouselBtns

    let carousel_wrap = carousel.querySelector('.c-carousel-wrap')
    let shown = false
    let show_count = 0
    let carousel_transform = 0;
    let newItemsLength = 0
    let carousel_width = 0
    let item_width = current_items[0].getBoundingClientRect().width + parseInt(item_computedStyle.marginLeft) + parseInt(item_computedStyle.marginRight)
    let isMoving = false
    let isGestureMoving = false // Keeps Carousel from moving when image clicked for modal / popup
    let current_items_width = 0
    let initialPosition = null
    let difference = 0
    let direction = ''
    let new_wW = ''
    let max_animated_width = 0
    let inview = []

    /* Checks if current items add up to greater than parent container */
    const itemsGreaterThanContainer = () => (current_items[0]?.offsetWidth * current_items_length > carousel.offsetWidth)

    if (defaultItems) carousel.querySelector('.c-carousel-wrap').style.overflowX = 'hidden'

    if (current_items_length < 4 || !itemsGreaterThanContainer()) {
        overRide = true

        if (!current_items_length) throw 'Not enough carousel items to display'
    }


    // Utility Functions
    const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < data.scroll;
    /*  
        Checks if data-scroll is set less than the window width 
        and data.scroll is added as a data attribute if isMobile device is true
    */
    const scroll = () => window.innerWidth < data.scroll && (isMobile()) ? true : false
    const item_offset = () => scroll() ? 30 : 0 // Offset each item in pixels

    const showButtons = () => {
        carousel.querySelectorAll('.c-left-btn, .c-right-btn')
            .forEach(btn => scroll() || overRide ? btn.style.display = 'none' : btn.style.display = 'block')
    }
    // if (overRide) return;

    const addRemoveEventListeners = () => {
        this.resizeChanged = true

        if (isMobile() && !data.scroll) {
            carousel.querySelector('.c-carousel-wrap').addEventListener('touchstart', gestureStart, false)
            carousel.querySelector('.c-carousel-wrap').addEventListener('touchmove', gestureMove, false)
            carousel.querySelector('.c-carousel-wrap').addEventListener('touchend', gestureEnd, false)

            carousel.querySelector('.c-left-btn').removeEventListener('click', rotate)
            carousel.querySelector('.c-right-btn').removeEventListener('click', rotate)
        } else {

            carousel.querySelector('.c-left-btn').addEventListener('click', rotate)
            carousel.querySelector('.c-right-btn').addEventListener('click', rotate)
            console.log('rotate:', rotate)

            carousel.querySelector('.c-carousel-wrap').removeEventListener('touchstart', gestureStart, false)
            carousel.querySelector('.c-carousel-wrap').removeEventListener('touchmove', gestureMove, false)
            carousel.querySelector('.c-carousel-wrap').removeEventListener('touchend', gestureEnd, false)
        }
    }

    let updatingDynamically = false
    const resizeObserve = new ResizeObserver(entries => {

        console.log('updatingDynamically:', updatingDynamically)
        // if(updatingDynamically) return;
        loadCarousels()
        // updatingDynamically = false
    })
    resizeObserve.observe(carousel)

    function observeCarouselInview(inView) {
        if (inView && !shown) {
            shown = true

            let i = inview.length
            while (i--) {
                const index = i
                setTimeout(() => {
                    inview[index].style.transform = null
                    inview[index].style.opacity = null
                }, i * 125)
            }
        }
    }
    const observer = new IntersectionObserver(entries => {
        // !shown && observeCarouselInview(entries[0].isIntersecting)
    })
    observer.observe(carousel)



    /* scroll without transfrom */
    function touchScroll(items, scroll_start) {

        item_parent.style.overflow = 'auto'
        const firstElement = items[0]
        const lastElement = items[items.length - 1]
        // console.log('lastElement:', lastElement)
        const frontAndBack = [firstElement, lastElement]

        frontAndBack.forEach(item => {
            const ob = new IntersectionObserver(obCallback, {
                threshold: 1,
            });
            ob.observe(item);
        })

        /* IF OBSERVER ABOVE FOR SHOW ELEMENTS WHEN IN VIEW IS REMOVED
         * WE CAN REMOVE THE LOGIC FOR elementMoved BELOW
         */
        let elementMoved = false
        function obCallback(payload) {
            const entry = payload[0]

            if (entry.intersectionRatio === 1) {
                if (lastElement == entry.target) {
                    item_parent.scroll({ left: scroll_start, behavior: 'instant' })
                }

                if (firstElement == entry.target) {
                    elementMoved && item_parent.scrollTo(current_items_width, 0)
                }

            } else {
                /* Stopes from running elements on Y scroll */
                if (entry.intersectionRect.y === entry.boundingClientRect.y) {
                    elementMoved = true
                }
            }
        }
    }

    const checkCarouselEnd = function () {
        item_parent.style.transition = null
        const carousel_width = carousel.querySelector('.c-carousel-wrap').getBoundingClientRect().width
        isMoving = false
        // Keeps Carousel from moving when image clicked for modal / popup
        isGestureMoving = false
        // Makes sure carousel_transform variable is always a positive number to begin with
        const currentTransform = carousel_transform < 0 ? carousel_transform * -1 : carousel_transform

        /* Items reached max distance right */
        if (max_animated_width - currentTransform < carousel_width) {
            carousel_transform = carousel_transform + current_items_width
            item_parent.style.transform = 'translate3d(' + carousel_transform + 'px, 0, 0)'
        }
        /* Items reached max distance left */
        else if (currentTransform < carousel_width) {
            carousel_transform = -(currentTransform + current_items_width)
            item_parent.style.transform = 'translate3d(' + carousel_transform + 'px, 0, 0)'
        }
    }

    /* Recursion returning just enough count to make carousel items even for current show_count */
    const evenCount = (items, show) => {
        console.log('items, show:', items, show)
        const checking = (start) => {
            if ((items + show + start) % show == 0) {
                return start
            }
            start++
            return checking(start)
        };
        /* Ending items plus any difference with show_items and ending items */
        return checking(show) + (items % show)
    }

    function updateContainerValues(item_width) {
        item_parent.style.gridTemplateColumns = 'repeat(' + newItemsLength + ',' + item_width + 'px)'
        if (scroll()) {
            item_parent.style.transform = null
            item_parent.style.overflow = 'auto'
        } else {
            item_parent.style.overflow = null
            item_parent.style.transform = 'translate3d(' + carousel_transform + 'px, 0, 0)'
        }
    }

    // Only if break points for window width change or page load addElement runs
    function addElement() {
        const cloneStart = current_items_length - show_count
        console.log('cloneStart:', cloneStart)

        const cloneEnding = evenCount(current_items_length, show_count)

        newItemsLength = 0
        // Clone elements add before and after current items
        for (let i = 0; i < current_items_length; i++) {
            const el = current_items[i]

            // Adds additional items to the beginning
            if (i >= cloneStart) {
                const cloned = el.cloneNode(true)
                cloned.className += " cloned"
                item_parent.insertBefore(cloned, current_items[0])
                newItemsLength++
            }
            // Add additional items to the end
            if (i < cloneEnding) {
                const cloned = el.cloneNode(true)
                cloned.className += " cloned"
                item_parent.appendChild(cloned)
                newItemsLength++
            }
            newItemsLength++
            /* Only images in view get tranformed into view on scroll */
            if (i < show_count && !shown && !scroll) {
                el.style.transform = 'translateY(75px)'
                el.style.opacity = 0
                inview.push(el)
            }
        }
        addRemoveEventListeners()


        if (scroll()) {
            const carousel_items = carousel.querySelectorAll('.c-carousel-item')
            const scroll_end_start = (item_width * cloneEnding) - item_offset() * show_count

            // Shows elements in order starting at first image on page load 
            const onloadStart = item_width * show_count
            item_parent.scroll(onloadStart, 0)
            touchScroll(carousel_items, scroll_end_start)
        }
    }
    function removeCloned() {
        // item_width = carousel_width / show_count - item_offset()
        const cloned = carousel.querySelectorAll('.cloned')
        const cloned_count = cloned.length
        for (let i = 0; i < cloned_count; i++) item_parent.removeChild(cloned[i])
        addElement()
    }
    function checkShowCount(count) {

        if (count * 2 <= current_items_length) return count
        if ((count - 1) * 2 <= current_items_length) return count - 1
        if ((count - 2) * 2 <= current_items_length) return count - 2
        if ((count - 3) * 2 <= current_items_length) return count - 3
        if ((count - 4) * 2 <= current_items_length) return count - 4
        return count
    }
    function loadCarousels() {
        carousel_wrap = carousel.querySelector('.c-carousel-wrap')
        carousel_width = carousel_wrap.getBoundingClientRect().width

        const wW = window.innerWidth
        // if(defaultItems) { // Added  1-6-2023

        //     show_count = Math.floor(carousel_width / item_width)
        //     console.log('show_count:', show_count)
        //     carousel_width = show_count * item_width
        //     updatingDynamically = true
        //     carousel_wrap.style.width = carousel_width + 'px'

        //     console.log(carousel_width / item_width, item_width, carousel_width )

        //     removeCloned()
        //     carousel_transform = -(item_width * show_count) 
        //     current_items_width = item_width * current_items_length
        //     max_animated_width = item_width * newItemsLength - carousel_width
        //     showButtons()
        //     updateContainerValues(item_width)
        //     return 
        // }
        function updateDefaultItems() {
            const count = Math.floor(carousel.getBoundingClientRect().width / item_width)
            console.log('count:', count)

            carousel_width = count * item_width
            // updatingDynamically = true
            carousel_wrap.style.width = carousel_width + 'px'
            return count
        }
        if (!itemsGreaterThanContainer()) return;
        console.log('itemsGreaterThanContainer ', itemsGreaterThanContainer(), 'overRide: ', overRide, 'defaultItems: ', defaultItems)

        switch (true) {
            // case defaultItems:
            //     show_count = updateDefaultItems()
            //     break;
            case wW > 1201 && new_wW != 'xl':
                console.log('1201:', 1201)
                // show_count = countRequested
                show_count = checkShowCount(countRequested)
                new_wW = 'xl'
                break;
            case wW > 992 && wW <= 1200 && new_wW != 'lg':
                console.log('992:', 992)
                show_count = checkShowCount(countRequested - 1)
                new_wW = 'lg'
                break;
            case wW > 768 && wW <= 991 && new_wW != 'md':
                console.log('991:', 991)
                show_count = checkShowCount(countRequested - 1)
                console.log('show_count:', show_count)
                new_wW = 'md'
                break;
            case wW <= 768 && wW > 576 && new_wW != 'sm':
                console.log('768:', 768)
                show_count = 3
                new_wW = 'sm'
                break;
            case wW <= 576 && new_wW != 'xs':
                console.log('576:', 576)
                show_count = 2
                new_wW = 'xs'
        }
        if (!defaultItems) item_width = carousel_width / show_count - item_offset()

        if (defaultItems) show_count = updateDefaultItems()
        removeCloned()
        carousel_transform = -(item_width * show_count)
        current_items_width = item_width * current_items_length
        max_animated_width = item_width * newItemsLength - carousel_width

        showButtons()

        /* This updates the values always on screen size change */
        updateContainerValues(item_width)
    }

    function rotate(ev, touchX) {
        if (isMoving) return

        const wW = window.innerWidth
        const target = ev.target.className
        const carousel_width = carousel.querySelector('.c-carousel-wrap').getBoundingClientRect().width


        item_parent.style.transition = wW < 768 ? 'transform .4s  cubic-bezier(0.33, 1, 0.68, 1)' : 'transform .55s cubic-bezier(0.33, 1, 0.68, 1)'

        if (target === 'c-left-btn' || direction === 'left') {
            const x = touchX ? (carousel_transform -= touchX) : carousel_transform += carousel_width
            item_parent.style.transform = 'translate3d(' + x + 'px, 0, 0)'

        } else {
            const x = touchX ? (carousel_transform += touchX) : carousel_transform -= carousel_width
            item_parent.style.transform = 'translate3d(' + x + 'px, 0, 0)'
        }

        isMoving = true
        item_parent.addEventListener('transitionend', checkCarouselEnd)
    }
    let initialCarouselTransform = 0
    function gestureStart(e) {
        initialPosition = e.changedTouches[0].pageX;
        // On every first touch updates container transform X
        initialCarouselTransform = Number(carousel.querySelector('.carousel-item-array').style.transform.replace(/(translate3d)+\(([-\d.]+)px(.*)/gi, '$2')) * -1
    }
    function gestureMove(e) {
        if (isMoving) return
        let pageX = e.changedTouches[0].pageX
        let previous = pageX - initialPosition

        // Updates which direction to rotate
        direction = previous > difference ? 'right' : 'left'
        difference = pageX - initialPosition

        carousel_transform = - initialCarouselTransform + difference
        item_parent.style.transform = 'translateX(' + carousel_transform + 'px)'
        isGestureMoving = true // Keeps Carousel from moving when image clicked for modal / popup
    }
    function gestureEnd(e) {
        // Keeps Carousel from moving when image clicked for modal / popup
        if (!isGestureMoving) return
        const carousel_wrap_width = carousel.querySelector('.c-carousel-wrap').getBoundingClientRect().width

        if (direction === 'left') {
            const touchX = carousel_wrap_width + difference
            rotate(e, touchX)
        } else {
            const touchX = carousel_wrap_width + -difference
            rotate(e, touchX)
        }
    }
}


function carousel() {

    /* Carousels to Load */
    const carousels = document.querySelectorAll('.c-carousel')
    /* Loops through all the carousels on the page */
    carousels.forEach(carouselElem => {

        try {
            new Carousel(carouselElem)
        } catch (e) {
            console.log('Error with carousel.. ', e)
        }
    })
} // *** End of Carousel script ***



// // *** USED ONLY FOR POP UP / MODAL ***
// popup_content = {
//     // ** data-id in the html file 
//     agarikon:
//         'Called ‘the elixir of long life’ by the Greek physician Dioscorides in 65 A.D., Agarikon has proven anti-viral, anti-microbial,' +
//         'and anti-inflammatory properties that attack the host bacteria of numerous diseases and conditions.  This mushroom can grow for up ' +
//         'to 100 years and is revered for its exceptional defense against invading pathogens.',
//     // ** data-id in the html file 
//     antrodia:
//         'Known as the ‘Fungus of Fortune’ in Taiwan, Antrodia is used to support liver and heart health.  It also contains a variety of ' +
//         'immune-boosting components to fortify your body’s natural defense system.  Antrodia is a common therapeutic ingredient in traditional' +
//         ' Chinese medicine and has been used to treat a variety of conditions including stomach issues, hypertension, inflammation, and diabetes.',
//     // ** data-id in the html file 
//     anshwagandha:
//         'A staple of Ayurvedic medicine for thousands of years, Ashwagandha is a powerful adaptogen that reduces stress, supports heart health, ' +
//         ' and maintains balance in the body.  It’s native to the Indian sub-continent and is considered to be a grounding herb that promotes longevity, ' +
//         'vitality, and happiness.',
//     // ** data-id in the html file 
//     chaga:
//         'Used for centuries to support longevity, immunity, and overall health, Chaga reduces inflammation, prevents disease, and helps regulate blood ' +
//         'sugar and cholesterol.  Chaga’s fruiting bodies are loaded with polysaccharides which have proven to support immune function and overall health.',
//     // ** data-id in the html file 
//     chamomile:
//         'An ancient medicinal herb, Chamomile is a potent anti-inflammatory and mild sedative that relieves stress, promotes calmness, and supports healthy ' +
//         'digestive function.  Egyptians considered Chamomile to be a sacred plant, believing it was a gift from the God of the Sun.',
//     // ** data-id in the html file 
//     cordyceps:
//         'A rare mushroom native to the high mountains of China and Tibet, Cordyceps is a powerhouse for energy production, immune function, and organ health.' +
//         'It’s used extensively in ancient Chinese medicine.',
//     // ** data-id in the html file 
//     ginkobiloba:
//         'The Gingko tree is one of the oldest surviving tree species in the world, dating back more than 200 million years.  Gingko Biloba improves cognitive function' +
//         'and cardiovascular health, while flushing toxins from the body.  It’s rich with antioxidants and has been used traditionally to treat blood disorders, enhance' +
//         'circulation, and improve memory.',
//     // ** data-id in the html file 
//     greenteaextract:
//         'Green tea has been used medicinally in Japan and China for thousands of years.  High in antioxidants, vitamins, and beneficial compounds, Green Tea Extract' +
//         'increases your energy levels while supporting overall health, mental alertness, and immune function.',
//     // ** data-id in the html file 
//     guarana:
//         'The Guarana vine is home to the Amazon Rainforest, where indigenous cultures have long taken advantage of its stimulating properties. It is now a staple' +
//         'of energy supplements that reduces mental fatigue, provides sustained natural energy, and also contains many potent antioxidants for immune support.',
//     kingtrumpets:
//         'Native to the Mediterranean regions of Europe, Africa, and the Middle East, King Trumpets are loaded with antioxidants and are an excellent source' +
//         'of magnesium, zinc, and vitamin B6.  They contain an important amino acid called ergothioneine which works to cleanse vulnerable areas of the body' +
//         'like the liver and kidneys, making King Trumpets a fantastic mushroom for your immune system and total body health.',
//     lemonbalm:
//         'A mild sedative with mood-balancing properties, Lemon Balm is an excellent lemon-scented herb for people who struggle to wind down and relax at the' +
//         'end of the day.  It also has a strong anti-inflammatory effect and has shown promise in reducing blood sugar levels in people with diabetes.',
//     lionsmane:
//         'One of the most renowned medicinal mushrooms, Lion’s Mane is a potent cognitive enhancer that contains a plethora of beneficial compounds to' +
//         'improve working memory, mental clarity and acuity, and overall brain health.  Studies have also shown Lion’s Mane to be effective at protecting' +
//         'against dementia, reducing symptoms of anxiety and depression, and helping repair nerve damage.',
//     mitake:
//         'One of the most renowned medicinal mushrooms, Lion’s Mane is a potent cognitive enhancer that contains a plethora of beneficial compounds to' +
//         'improve working memory, mental clarity and acuity, and overall brain health.  Studies have also shown Lion’s Mane to be effective at protecting' +
//         'against dementia, reducing symptoms of anxiety and depression, and helping repair nerve damage.',
//     panaxginseng:
//         'According to ancient Chinese medicine, Panax Ginseng is known for strengthening Qi (vital life force), organ support, and increasing knowledge.  It’s a' +
//         'common supplement in herbal medicine today, used notably to increase energy levels, boost libido, lower blood sugar, and balance mood.  To this day it' +
//         'remains the most popular herbal remedy in East Asia.',
//     passionflower:
//         'A perennial vine native to North America, Passion Flower has been used historically to treat anxiety, stress, and insomnia.  Its unusual blossoms have a' +
//         'long history of use as a traditional medicine in Native American cultures, which was later adopted by European settlers.',
//     reishi:
//         'Known as the Queen of Mushrooms or Mushroom of Immortality, Reishi is a powerful adaptogen with a rich antioxidant profile.  It’s history dates back at' +
//         'least 2,000 years, where Chinese healers used it to treat a wide range of health conditions.  Reishi is known to enhance immune function and is a potent' +
//         'stress-reliever, flooding the body and mind with tranquility.',
//     shitake:
//         'With a history dating back over 100 million years, Shiitake mushrooms have long been a staple of Asian cuisines.  Shiitake is anti-inflammatory and packed' +
//         'with nutrients to strengthen your immune system, support heart health, and control blood sugar levels.  It’s also unique to the world of fungi because it' +
//         'contains all eight essential amino acids.',
//     turkeytail:
//         'Turkey Tail has a long, valued history and is one of the most researched functional mushrooms for its immune-boosting properties, anti-cancer potential,' +
//         'and support for a healthy gut microbiome. It contains high concentrations of protein-bound polysaccharides, which work to activate and inhibit specific' +
//         'immune cells and decrease inflammation throughout the body',
//     turmeric:
//         'Native to South Asia, Turmeric is a potent anti-inflammatory, anti-bacterial, and antioxidant that’s one of the most important herbs in Ayurvedic medicine.' +
//         'Its active ingredient, curcumin, has shown to aid in the management of oxidative and inflammatory conditions, metabolic conditions, arthritis, and anxiety.',
//     valerianroot:
//         'Valerian has a long history dating back to ancient Greece, where doctors Hippocrates and Dioscorides often prescribed it as a sleep aid.  Today it’s widely' +
//         'recognized as a powerful medicinal herb that’s commonly used to promote relaxation, reduce anxiety, treat digestive disorders, and improve overall sleep quality.'
// }


// function carouselPopUp() {
//     const carousel_items = document.getElementsByClassName('c-carousel-item')
//     const modal = document.getElementsByClassName('i-ingredient-modal')[0]
//     const title = document.getElementsByClassName('i-title')[0]
//     const about = document.getElementsByClassName('i-about')[0]
//     const close = document.querySelector('.i-close')
//     const imgParent = document.querySelector('.i-img')

//     let i = carousel_items.length

//     while (i--) {
//         carousel_items[i].addEventListener('click', function (e) {
//             const imgSRC = e.target.querySelector('.c-carousel-img img').getAttribute('src')


//             const target = e.target.dataset.id
//             console.log('target:', target)

//             const ingredient = target.replace(/-/ig, '')
//             const aboutTEXT = popup_content[ingredient]


//             const img = new Image()
//             img.src = imgSRC
//             img.alt = 'Ingredient ' + target
//             imgParent.appendChild(img)

//             const titleContent = target.split('-').join(' ').toUpperCase()

//             console.log(title)
//             title.textContent = titleContent
//             about.textContent = aboutTEXT

//             modal.style.visibility = "visible"
//         })
//     }

//     close.addEventListener('click', function () {
//         modal.style.visibility = "hidden"
//         const addedIMG = imgParent.querySelector('img')
//         imgParent.removeChild(addedIMG)
//     })
// }

/**** Good Code From our original Shopify store working */
// window.addEventListener('DOMContentLoaded', (event) => {
//     carousel()
// })


// const Carousel = function (carousel) {
//     const data = carousel.dataset
//     const current_items = Array.from(carousel.querySelectorAll('.c-carousel-item'))

//     const item_computedStyle = window.getComputedStyle(current_items[0])
//     const current_items_length = current_items.length
//     const item_parent = carousel.querySelector('.carousel-item-array')

//     /* If data attribute exist for override then desktop items will show inline and no handles for carousel */
//     let overRide = data.override
//     let buttonsToShow = data.carouselBtns
//     let countRequested = Number(data.itemCount || 4);

//     /* If you want to use just the given items in the carousel */
//     let defaultItems = data.itemDefault;

//     // Cached / State
//     let carousel_wrap = carousel.querySelector('.c-carousel-wrap')
//     let shown = false
//     let show_count = 0
//     let carousel_transform = 0;
//     let newItemsLength = 0
//     let carousel_width = 0
//     let item_width = current_items[0].getBoundingClientRect().width + parseInt(item_computedStyle.marginLeft) + parseInt(item_computedStyle.marginRight)
//     let isMoving = false
//     let isGestureMoving = false // Keeps Carousel from moving when image clicked for modal / popup is in use
//     let current_items_width = 0
//     let initialPosition = null
//     let difference = 0
//     let direction = ''
//     let new_wW = ''
//     let max_animated_width = 0
//     let inview = []

//     /* Checks if current items add up to greater than parent container */
//     const itemsGreaterThanContainer = () => (current_items[0]?.offsetWidth * current_items_length > carousel.offsetWidth)
//     console.log('itemsGreaterThanContainer:', itemsGreaterThanContainer())

//     /**  Only running this due to collection page swatches, ugly hack **/
//     if (defaultItems) carousel.querySelector('.c-carousel-wrap').style.overflowX = 'hidden'

//     if (current_items_length < 4 || !itemsGreaterThanContainer()) {
//         overRide = true
//         if (!current_items_length) throw 'Not enough carousel items to display'
//     }


//     if(overRide) return;

//     // Utility Functions
//     const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < data.scroll;

//     /*  
//         Checks if data-scroll is set less than the window width 
//         and data.scroll is added as a data attribute if isMobile device is true
//     */
//     const scroll = () => window.innerWidth < data.scroll && (isMobile()) ? true : false
//     const item_offset = () => scroll() ? 30 : 0 // Offset each item in pixels

//     const showButtons = () => {
//         const btns = carousel.querySelectorAll('.c-left-btn, .c-right-btn')
//         if (buttonsToShow) {
//             if (buttonsToShow === 'right') return btns[1].style.display = 'block'
//             if (buttonsToShow === 'left') return btns[0].style.display = 'block'
//         }

//         btns.forEach(btn => scroll() || overRide ? btn.style.display = 'none' : btn.style.display = 'block')
//     }

//     const addRemoveEventListeners = () => {
//         const leftBtn = carousel.querySelector('.c-left-btn')

//         const rightBtn = carousel.querySelector('.c-right-btn')

//         if (isMobile() && !data.scroll) {
//             carousel.querySelector('.c-carousel-wrap').addEventListener('touchstart', gestureStart, false)
//             carousel.querySelector('.c-carousel-wrap').addEventListener('touchmove', gestureMove, false)
//             carousel.querySelector('.c-carousel-wrap').addEventListener('touchend', gestureEnd, false)

//             carousel.querySelector('.c-left-btn').removeEventListener('click', rotate)
//             carousel.querySelector('.c-right-btn').removeEventListener('click', rotate)
 
//         } else {
//             leftBtn && leftBtn.addEventListener('click', rotate)
//             rightBtn && rightBtn.addEventListener('click', rotate)

//             carousel.querySelector('.c-carousel-wrap').removeEventListener('touchstart', gestureStart, false)
//             carousel.querySelector('.c-carousel-wrap').removeEventListener('touchmove', gestureMove, false)
//             carousel.querySelector('.c-carousel-wrap').removeEventListener('touchend', gestureEnd, false)
//         }
//     }
//     addRemoveEventListeners() 
//     /* Carousel Resize Event */
//     const resizeObserve = new ResizeObserver(entries => {
//         loadCarousels()
//     })
//     resizeObserve.observe(defaultItems ? carousel : item_parent)
    

//     function observeCarouselInview(inView) {
//         if (inView && !shown) {
//             shown = true

//             let i = inview.length
//             while (i--) {
//                 const index = i
//                 setTimeout(() => {
//                     inview[index].style.transform = null
//                     inview[index].style.opacity = null
//                 }, i * 125)
//             }
//         }
//     }
//     const observer = new IntersectionObserver(entries => {
//         !shown && observeCarouselInview(entries[0].isIntersecting)
//     })
//     observer.observe(carousel)


//     /* scroll without transfrom */
//     function touchScroll(items, scroll_start) {
//         item_parent.style.overflowX = 'scroll'
//         item_parent.style.overscrollBehavior = 'auto'
//         const firstElement = items[0]
//         const lastElement = items[items.length - 1]
//         const frontAndBack = [firstElement, lastElement]

//         frontAndBack.forEach(item => {
//             const ob = new IntersectionObserver(obCallback, {
//                 threshold: 1,
//             });
//             ob.observe(item);
//         })

//         /* IF OBSERVER ABOVE FOR SHOW ELEMENTS WHEN IN VIEW IS REMOVED
//          * WE CAN REMOVE THE LOGIC FOR elementMoved BELOW
//          */
//         let elementMoved = false
//         function obCallback(payload) {

//             const entry = payload[0]
//             if (entry.intersectionRatio === 1) {
//                 if (lastElement == entry.target) {
//                     item_parent.scroll(scroll_start, 0)
//                 }

//                 if (firstElement == entry.target) {
//                     elementMoved && item_parent.scrollTo(current_items_width, 0)
//                 }

//             } else {
//                 /* Stopes from running elements on Y scroll */
//                 if (entry.intersectionRect.y === entry.boundingClientRect.y) {
//                     elementMoved = true
//                 }
//             }
//         }
//     }

//     const checkCarouselEnd = function () {
//         item_parent.style.transition = null
//         const carousel_width = carousel.querySelector('.c-carousel-wrap').getBoundingClientRect().width
//         isMoving = false
//         // Keeps Carousel from moving when image clicked for modal / popup
//         isGestureMoving = false
//         // Makes sure carousel_transform variable is always a positive number to begin with
//         const currentTransform = carousel_transform < 0 ? carousel_transform * -1 : carousel_transform

//         /* Items reached max distance right */
//         if (max_animated_width - currentTransform < carousel_width) {
//             carousel_transform = carousel_transform + current_items_width
//             item_parent.style.transform = 'translate3d(' + carousel_transform + 'px, 0, 0)'
//         }
//         /* Items reached max distance left */
//         else if (currentTransform < carousel_width) {
//             carousel_transform = -(currentTransform + current_items_width)
//             item_parent.style.transform = 'translate3d(' + carousel_transform + 'px, 0, 0)'
//         }
//     }



//     function updateContainerValues(item_width) {
//         // Just add items with no transform or spread
//         item_parent.style.gridTemplateColumns = 'repeat(' + newItemsLength + ',' + item_width + 'px)'
//         if (scroll()) {
//             item_parent.style.transform = null
//             item_parent.style.overflow = 'auto'
//         } else {
//             item_parent.style.overflow = null
//             item_parent.style.transform = 'translate3d(' + carousel_transform + 'px, 0, 0)'
//         }
//     }

//     /* Recursion returning just enough count to make carousel items even for current show_count */
//     const evenCount = (items, show) => {
//         const checking = (start) => {
//             if ((items + show + start) % show == 0) {
//                 return start
//             }
//             start++
//             return checking(start)
//         };
//         /* Ending items plus any difference with show_items and ending items */
//         return checking(show) + (items % show)
//     }

//     // Only if break points for window width change or page load addElement runs
//     function addElement() {
//         const cloneStart = current_items_length - show_count
//         const cloneEnding = evenCount(current_items_length, show_count)

//         newItemsLength = 0
//         // Clone elements add before and after current items
//         for (let i = 0; i < current_items_length; i++) {
//             const el = current_items[i]

//             // Adds additional items to the beginning
//             if (i >= cloneStart) {
//                 const cloned = el.cloneNode(true)
//                 cloned.className += " cloned"
//                 item_parent.insertBefore(cloned, current_items[0])
//                 newItemsLength++
//             }
//             // Add additional items to the end
//             if (i < cloneEnding) {
//                 const cloned = el.cloneNode(true)
//                 cloned.className += " cloned"
//                 item_parent.appendChild(cloned)
//                 newItemsLength++
//             }
//             newItemsLength++
//             /* Only images in view get tranformed into view on scroll */
//             if (i < show_count && !shown && !scroll) {
//                 el.style.transform = 'translateY(75px)'
//                 el.style.opacity = 0
//                 inview.push(el)
//             }
//         }

//         setTimeout(addRemoveEventListeners, 500)

//         // temp fix infinite scroll mobile, "scroll()" to "!scroll()"
//         if (scroll()) {
//             const carousel_items = carousel.querySelectorAll('.c-carousel-item')
//             const scroll_end_start = (item_width * cloneEnding) - item_offset() * show_count

//             item_parent.scroll(0, 0)
//             touchScroll(carousel_items, scroll_end_start)
//         }
//     }

//     function removeCloned() {
//         const cloned = carousel.querySelectorAll('.cloned')
//         const cloned_count = cloned.length
//         for (let i = 0; i < cloned_count; i++) item_parent.removeChild(cloned[i])
//         addElement()
//     }

//     /* Decides how many items go in the carousel */
//     function checkShowCount(count) {
//         if (count * 2 <= current_items_length) return count
//         if ((count - 1) * 2 <= current_items_length) return count - 1
//         if ((count - 2) * 2 <= current_items_length) return count - 2
//         if ((count - 3) * 2 <= current_items_length) return count - 3
//         return count
//     }
    
//     function hideButtons(){
//         const btn = carousel.querySelectorAll('.c-left-btn, .c-right-btn')
//         btn[0] && (btn[0].style.display = 'none')
//         btn[1] && (btn[1].style.display = 'none')
//     }
    

//     function loadCarousels() {
//         carousel_wrap = carousel.querySelector('.c-carousel-wrap')
//         carousel_width = carousel_wrap.getBoundingClientRect().width

//         const wW = window.innerWidth
//         const mobileCount = Number(data.mobileCount)

//         function updateDefaultItems() {
//             const count = Math.floor(carousel.getBoundingClientRect().width / item_width)
    
//             carousel_width = count * item_width
//             carousel_wrap.style.width = carousel_width + 'px'
//             return count
//         }

//         // Screen size changes and not enough items to meet the size of the carousel 
//         if (defaultItems && !itemsGreaterThanContainer()) {
//             updateDefaultItems()
//             return hideButtons();
//         }

//         switch (true) {
//             case wW > 1201 && new_wW != 'xl':
//                 show_count = checkShowCount(countRequested)
//                 new_wW = 'xl'
//                 break;
//             case wW > 992 && wW <= 1200 && new_wW != 'lg':
//                 show_count = checkShowCount(countRequested - 1)
//                 new_wW = 'lg'
//                 break;
//             case wW > 768 && wW <= 991 && new_wW != 'md':
//                 show_count = checkShowCount(countRequested - 1)
//                 new_wW = 'md'
//                 break;
//             case wW <= 768 && wW > 576 && new_wW != 'sm':
//                 mobileCount ? show_count = mobileCount + 1 : show_count = 3
//                 new_wW = 'sm'
//                 break;
//             case wW <= 576 && new_wW != 'xs':
//                 mobileCount ? show_count = mobileCount : show_count = 2
//                 new_wW = 'xs'
//         }

//          // To use the amount of items that fits 
//         if (defaultItems) show_count = updateDefaultItems()

//         if (!defaultItems) item_width = carousel_width / show_count - item_offset()
//         removeCloned()

//         carousel_transform = -(item_width * show_count)
//         current_items_width = item_width * current_items_length
//         max_animated_width = item_width * newItemsLength - carousel_width

//         showButtons()

//         /* This updates the values always on screen size change */
//         updateContainerValues(item_width)
//     }

//     function rotate(ev, touchX) {
//         if (isMoving) return

//         const wW = window.innerWidth
//         const target = ev.target.className
//         const carousel_width = carousel.querySelector('.c-carousel-wrap').getBoundingClientRect().width


//         item_parent.style.transition = wW < 768 ? 'transform .4s  cubic-bezier(0.33, 1, 0.68, 1)' : 'transform .55s cubic-bezier(0.33, 1, 0.68, 1)'

//         if (target === 'c-left-btn' || direction === 'left') {
//             const x = touchX ? (carousel_transform -= touchX) : carousel_transform += carousel_width
//             item_parent.style.transform = 'translate3d(' + x + 'px, 0, 0)'

//         } else {
//             const x = touchX ? (carousel_transform += touchX) : carousel_transform -= carousel_width
//             item_parent.style.transform = 'translate3d(' + x + 'px, 0, 0)'
//         }

//         isMoving = true
//         item_parent.addEventListener('transitionend', checkCarouselEnd)
//     }
//     let initialCarouselTransform = 0
//     function gestureStart(e) {
//         initialPosition = e.changedTouches[0].pageX;
//         // On every first touch updates container transform X
//         initialCarouselTransform = Number(carousel.querySelector('.carousel-item-array').style.transform.replace(/(translate3d)+\(([-\d.]+)px(.*)/gi, '$2')) * -1
//     }
//     function gestureMove(e) {
//         if (isMoving) return
//         let pageX = e.changedTouches[0].pageX
//         let previous = pageX - initialPosition

//         // Updates which direction to rotate
//         direction = previous > difference ? 'right' : 'left'
//         difference = pageX - initialPosition

//         carousel_transform = - initialCarouselTransform + difference
//         item_parent.style.transform = 'translateX(' + carousel_transform + 'px)'
//         isGestureMoving = true // Keeps Carousel from moving when image clicked for modal / popup
//     }
//     function gestureEnd(e) {
//         // Keeps Carousel from moving when image clicked for modal / popup
//         if (!isGestureMoving) return
//         const carousel_wrap_width = carousel.querySelector('.c-carousel-wrap').getBoundingClientRect().width

//         if (direction === 'left') {
//             const touchX = carousel_wrap_width + difference
//             rotate(e, touchX)
//         } else {
//             const touchX = carousel_wrap_width + -difference
//             rotate(e, touchX)
//         }
//     }
// }


// function carousel() {
//     /* Carousels to Load */
//     const carousels = document.querySelectorAll('.c-carousel')

//     /* Loops through all the carousels on the page */
//     carousels.forEach(carouselElem => {
//         try {
//             let carousel = new Carousel(carouselElem)
//         } catch (e) {
//             console.log('Error with carousel.. ', e)
//         }
//     })
// } // *** End of Carousel script ***



// function observeSwatches() {
//     const collectionInner = document.querySelector('.CollectionInner__Products')
//     const config = { attributes: true, childList: true, subtree: true };
//     let swatchesUpdated = false
//     // Callback function to execute when mutations are observed
//     const callback = (mutationList, observer) => {
//         if (swatchesUpdated) return;
//         for (const mutation of mutationList) {
//             if (mutation.type === 'childList') {
//                 if (mutation.target.className === 'CollectionInner__Products') {
//                     swatchesUpdated = true;
//                 }
//             }
//         }
//         if (swatchesUpdated === true) {
//             // carousel()
//             collectionSWatches()
//             swatchesUpdated = false
//         }
//     };

//     // Create an observer instance linked to the callback function
//     const observer = new MutationObserver(callback);

//     // Start observing the target node for configured mutations
//     observer.observe(collectionInner, config);
// }
// // observeSwatches()
