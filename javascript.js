const { anime } = window;

class Utils {
    static get1em(element) {
        return parseFloat(
            window.getComputedStyle(element)
                .getPropertyValue('font-size'),
        );
    }
}

class Counter {
    #root;
    #elements;
    #options;
    #isAnimating;

    constructor(options) {
        this.#root = options.root;
        this.#elements = {
            svg: this.#root.querySelector('.svgline'),
            path: this.#root.querySelector('.svgpath'),
            number: this.#root.querySelector('.number'),
        };
        this.#options = options;
        this.#isAnimating = false;
    }

    #updateSize() {
        const rect = this.#root.getBoundingClientRect();
        const { width, height } = rect;
        const em = Utils.get1em(this.#root);
        const strokeWidth = (this.#options.lineWidth || 0.3) * em;
        const radius = (this.#options.radius || 0) * em;
        const a = (this.#options.triangleSize || 0) * em;
        
        const viewBox = `
            ${-strokeWidth / 2}
            ${-strokeWidth / 2}
            ${rect.width + strokeWidth}
            ${rect.height + strokeWidth}`;
        
        const d = `
            M ${width / 2} ${a}
            L ${width / 2 + a} 0
            L ${width - radius} 0
            A ${radius} ${radius} 0 0 1 ${width} ${radius}
            L ${width} ${height / 2 - a}
            L ${width - a} ${height / 2}
            L ${width} ${height / 2 + a}
            L ${width} ${height - radius}
            A ${radius} ${radius} 0 0 1 ${width - radius} ${height}
            L ${width / 2 + a} ${height}
            L ${width / 2} ${height - a}
            L ${width / 2 - a} ${height}
            L ${radius} ${height}
            A ${radius} ${radius} 0 0 1 0 ${height - radius}
            L 0 ${height / 2 + a}
            L ${a} ${height / 2}
            L 0 ${height / 2 - a}
            L 0 ${radius}
            A ${radius} ${radius} 0 0 1 ${radius} 0
            L ${width / 2 - a} 0
            Z`;
        
        this.#elements.svg.setAttribute('viewBox', viewBox);
        this.#elements.path.setAttribute('stroke-width', strokeWidth);
        this.#elements.path.setAttribute('d', d);
    }

    animate(options) {
        if (this.#isAnimating) {
            return;
        }

        this.#updateSize();

        const { start, end } = options;
        const units = options.units || '';
        const duration = options.duration || 1000;
        const delay = options.delay || 0;
        const numberOfLaps = options.numberOfLaps || 3;
        const length = this.#elements.path.getTotalLength();
        const startDasharray = `${length} 0`;
        const endDasharray = `0 ${length}`;
        const startDashoffset = numberOfLaps * length;

        this.#elements.path.style.strokeDasharray = startDasharray;
        this.#elements.path.style.strokeDashoffset = startDashoffset;
        this.#elements.number.innerHTML = `${start}${units}`;

        anime({
            targets: this.#root,
            opacity: [0, 1],
            duration: 500,
            easing: 'easeInCubic',
            complete: () => {
                setTimeout(() => {
                    anime({
                        targets: this.#elements.path,
                        strokeDasharray: [startDasharray, endDasharray],
                        strokeDashoffset: [startDashoffset, 0],
                        duration,
                        easing: 'linear',
                        update: (anim) => {
                            if (anim.progress <= 0) {
                                return;
                            }

                            const progress = anim.progress / 100;
                            const number = Math.ceil(start + (end - start) * progress);

                            this.#elements.number.innerHTML = `${number}${units}`;
                        },
                        complete: () => {
                            anime({
                                targets: this.#root,
                                opacity: [1, 0],
                                duration: 300,
                                delay: 500,
                                easing: 'easeOutCubic',
                                complete: () => {
                                    this.#isAnimating = false;

                                    if (typeof options.callback === 'function') {
                                        options.callback();
                                    }
                                },
                            });
                        },
                    });
                }, delay);
            },
        });

        this.#isAnimating = true;
    }
}

function main() {
    const root = document.getElementById('counter');

    const counter = new Counter({
        root,
        lineWidth: 0.3,
        triangleSize: 0.5,
        radius: 0.3,
    });

    const animate = () => {
        counter.animate({
            start: 0,
            end: 100,
            units: '%',
            duration: 5000,
            delay: 500,
            numberOfLaps: 3,
            callback: () => {
                setTimeout(animate, 1000);
            },
        });
    };

    animate();
}

document.addEventListener('DOMContentLoaded', main);
