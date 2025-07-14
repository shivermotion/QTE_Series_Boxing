// Import your cutscene images
const cutsceneImage1 = require('../../assets/main_menu/boxing_ring.jpg');
const cutsceneImage2 = require('../../assets/level_select/image (3).jpg');
const cutsceneImage3 = require('../../assets/level_select/image (13).jpg');
const cutsceneImage4 = require('../../assets/level_select/knockout.png');

// Import your speech bubble images (you'll need to add these to your assets)
const speechBubbleImage = require('../../assets/speech_bubbles/speech_bubble.png');

export const cutscenes = {
  level1: {
    title: "The Beginning",
    story: "Your journey begins in the gritty streets of downtown. A mysterious figure approaches...",
    difficulty: "Easy",
    image: cutsceneImage1,
    cutscene: [
      {
        image: cutsceneImage1,
        transition: 'fade',
        speechBubbles: [
          {
            id: 'bubble1',
            image: speechBubbleImage,
            text: "This is a test speech bubble! Whats up Nexrage?",
            position: { x: 25, y: 30 }, // 25% from left, 30% from top
            size: { width: 350, height: 180 }, // Increased from 250x120
            textStyle: {
              fontSize: 18,
              color: '#000',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          },
          {
            id: 'bubble2',
            image: speechBubbleImage,
            text: "Fraz is a handsome man",
            position: { x: 75, y: 60 }, // 75% from left, 60% from top
            size: { width: 300, height: 150 }, // Increased from 200x100
            textStyle: {
              fontSize: 16,
              color: '#333',
              fontWeight: 'normal',
              textAlign: 'center',
            },
          },
        ],
      },
      {
        image: cutsceneImage2,
        transition: 'slideLeft',
        speechBubbles: [
          {
            id: 'bubble3',
            image: speechBubbleImage,
            text: "I found a manga text font and used it for this",
            position: { x: 50, y: 40 }, // Center of screen
            size: { width: 320, height: 160 }, // Increased from 220x110
            textStyle: {
              fontSize: 20,
              color: '#000',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          },
        ],
      },
      {
        image: cutsceneImage3,
        transition: 'zoomIn',
        // No speech bubbles for this image
      },
    ],
  },
  level2: {
    title: "The Challenge",
    story: "The stakes are higher now. Your opponent is no pushover...",
    difficulty: "Medium",
    image: cutsceneImage2,
    cutscene: [
      {
        image: cutsceneImage2,
        transition: 'fade',
        speechBubbles: [
          {
            id: 'bubble4',
            image: speechBubbleImage,
            text: "You think you can handle this?",
            position: { x: 20, y: 25 },
            size: { width: 380, height: 180 }, // Increased from 280x130
            textStyle: {
              fontSize: 19,
              color: '#000',
              fontWeight: 'bold',
              textAlign: 'left',
            },
          },
        ],
      },
    ],
  },
  // Add more levels as needed...
}; 