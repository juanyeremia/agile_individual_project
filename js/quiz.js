/*
1. On page load
- AJAZ fetches quiz_questions.json from server
- Store quiz questions in a variable
- Wait for user to click "Start Quiz" button
*/

// Store questions and quiz state
let questions = [];
let hasStarted = false;

// Fetch quiz questions on page load
$(document).ready(function() {
  $.ajax({
    url: './data/quiz_questions.json',
    method: 'GET',
    dataType: 'json',
    success:function(data) {
      // Store the loaded questions
      questions = data;
      console.log('Questions loaded: ' + questions.length);
    },
    error: function() {
      $('#quiz-intro').html('<p>Error loading questions. Please try again.</p>');
    }
  });

  // Start Quiz button click handler
  $('#start-btn').on('click', function() {
    startQuiz();
  });
});

/*
2. When Start Quiz button is clicked
- Shuffle questions into random order
- Hide intro section
- Show the questions sections
- Loop through each question and build HTML for each one (a question card with 4 radio buttons for options)
- Inject all the HTML into #questions-container
*/

// Provide HTML character escaping so they display as texts
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
}

function startQuiz() {
  // Randomize questions 
  questions.sort(() => Math.random() - 0.5);

  // Hide intro and show questions
  $('#quiz-intro').hide();
  $('#quiz-questions').show();

  // Render questions
  renderQuestions()
}

function renderQuestions() {
  // Clear any existing content
  $('#questions-container').empty();

  // Loop through questions and build HTML
  questions.forEach(function(q, index) {
    let optionsHTML = '';
    
    // Build options
    q.options.forEach(function(option, optIndex) {
      // Load quesition
      optionsHTML += `
        <div class="quiz-option">
          <input
            type="radio"
            name="question-${index}"
            id="q${index}-opt${optIndex}"
            value="${optIndex}">
          <label for="q${index}-opt${optIndex}">${escapeHTML(option)}</label>
        </div>
      `;
    });

    // Build the full question card
        const questionHTML = `
            <div class="question-card" id="question-${index}">
                <p class="question-text">
                    <span class="question-number">Q${index + 1}.</span> ${q.question}
                </p>
                <div class="options-container">
                    ${optionsHTML}
                </div>
            </div>
        `;

        $('#questions-container').append(questionHTML); // Injects the questions into the Quiz page where id = "questions-container"
    });
}