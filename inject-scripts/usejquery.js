$(function() {
  console.log('injected script (useJquery.js) has jquery version: ',$.fn.jquery);
  console.log('changing styles from injected javascript');
  $('#test2').css('background-color', 'aqua');
});