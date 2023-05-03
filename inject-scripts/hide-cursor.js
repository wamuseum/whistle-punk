// window.addEventListener('DOMContentLoaded', () => {

  // Create our stylesheet
  var hideCursor = document.createElement('style');
  hideCursor.innerHTML =
    'html, :any-link, input, button, div {' +
    'cursor: none !important;' +
    '}';

  var head = document.getElementsByTagName('head')[0];

  try {
    head.appendChild(hideCursor);
    console.log('script injected');
  } catch (err) {
    console.log('Error hiding cursor');
    console.log(err);
  }
// });