const carouselWrapper = document.querySelector('.carousel-wrapper');
const prevButton = document.querySelector('.prev-btn');
const nextButton = document.querySelector('.next-btn');
const slides = document.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;

let currentIndex = 1;
const intervalTime = 3000;// in ms, 1000ms = 1 sec
let autoSlide;

const firstClone = slides[0].cloneNode(true);
const lastClone = slides[totalSlides - 1].cloneNode(true);

carouselWrapper.appendChild(firstClone);
carouselWrapper.insertBefore(lastClone, slides[0]);

const allSlides = document.querySelectorAll('.carousel-slide');
const totalSlidesWithClones = allSlides.length;

carouselWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

function updateCarousel(instant = false) {
    const translateX = -currentIndex * 100;
    carouselWrapper.style.transition = instant ? 'none' : 'transform 0.5s ease-in-out';
    carouselWrapper.style.transform = `translateX(${translateX}%)`;
}

function nextSlide() {
    if (currentIndex >= totalSlides) {
        currentIndex++; 
        updateCarousel();
        setTimeout(() => {
            currentIndex = 1;
            updateCarousel(true);
        }, 500);
    } else {
        currentIndex++;
        updateCarousel();
    }
}

function prevSlide() {
    if (currentIndex <= 0) {
        currentIndex--;
        updateCarousel();
        setTimeout(() => {
            currentIndex = totalSlides - 1;
            updateCarousel(true);
        }, 500);
    } else {
        currentIndex--;
        updateCarousel();
    }
}

nextButton.addEventListener('click', () => {
    clearInterval(autoSlide);
    nextSlide();
    autoSlide = setInterval(nextSlide, intervalTime);
});

prevButton.addEventListener('click', () => {
    clearInterval(autoSlide);
    prevSlide();
    autoSlide = setInterval(nextSlide, intervalTime);
});

autoSlide = setInterval(nextSlide, intervalTime);
