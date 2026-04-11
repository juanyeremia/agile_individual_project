// Wait for page to load fully before accessing DOM elements
$(document).ready(function() {
  // References to textarea, button, and output div
  const input = $('#demo-input');
  const runBtn = $('#run-btn');
  const output = $('#demo-output');

  // Listen for button click to run the code
  runBtn.on('click', function() {

    // Get current text in textarea
    const userCode = input.val();

    // Write into the output div as actual HTML
    output.html(userCode);
  });
});
