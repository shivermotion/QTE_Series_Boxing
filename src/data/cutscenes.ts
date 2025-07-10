const cutscenes: { [level: number]: Array<{
  image: any,
  transition?: string,
  params?: object
}> } = {
  1: [
    { image: require('../../assets/level_select/image (3).jpg'), transition: 'fade', params: { duration: 1000 } },
    { image: require('../../assets/level_select/image (13).jpg'), transition: 'slideLeft', params: { duration: 800 } },
    { image: require('../../assets/level_select/knockout.png'), transition: 'zoomIn', params: { duration: 1200 } },
  ],
  2: [
    { image: require('../../assets/level_select/image (13).jpg'), transition: 'fade', params: { duration: 1000 } },
    { image: require('../../assets/level_select/knockout.png'), transition: 'slideLeft', params: { duration: 800 } },
    { image: require('../../assets/level_select/image (3).jpg'), transition: 'zoomIn', params: { duration: 1200 } },
  ],
  3: [
    { image: require('../../assets/level_select/knockout.png'), transition: 'fade', params: { duration: 1000 } },
  ],
  4: [
    { image: require('../../assets/level_select/image (3).jpg'), transition: 'slideLeft', params: { duration: 800 } },
    { image: require('../../assets/level_select/knockout.png'), transition: 'zoomIn', params: { duration: 1200 } },
  ],
};

export default cutscenes; 