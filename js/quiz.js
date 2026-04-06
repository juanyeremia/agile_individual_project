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

/*
3. While answering
- Activate 
*/

// Watch for first answer selection to activate 'beforeunload' warning
$(document).on('change', 'input[type=radio]', function() {          // use $(document) to capture any clicked radio button instead of ataching an event listener to each radio button
  if (!hasStarted) {
    hasStarted = true;
    // Activate the browser warning if user tries to leave mid-quiz
    window.addEventListener('beforeunload', function(e) {
      e.preventDefault();
    });
  }
});

/*
4. When submit button is clicked
- Check all questions are answered
- Calculat score
- Clear beforeunload warning
- Save score to localStorage
- Show restults
- Fetch joke from API if passed
*/

$('#submit-btn').on('click', function() {
  submitQuiz();
});

function submitQuiz() {
  // Check all questions are answered
  let unanswered = [];

  questions.forEach(function(q, index) {
    const selected = $('input[name="question-' + index + '"]:checked');
    if (selected.length === 0) {
      unanswered.push(index);
    }
  });

  // If any unanswered, highlight and stop
  if (unanswered.length > 0) {
    // Remove previous highlights
    $('.question-card').removeClass('unanswered');

    // Highlight unanswered questions
    unanswered.forEach(function(index) {
      $('#question-' + index).addClass('unanswered');   // For each index in unanswered, add class 'unanswered' into it 
    });

    alert('Please answer all questions before submitting!');
    return; // Stop submission if not all answered
  }

  // All questions answered, calculate score
  let score = 0;

  questions.forEach(function(q, index) {
    const selected = parseInt($('input[name="question-' + index + '"]:checked').val());
    if (selected === q.answer) {
      score++;
    }
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 70; // Pass if 70% or above

  // Clear beforeunload warning
  window.onbeforeunload = null;
  hasStarted = false;

  // Save score to localStorage
  saveAttempt(score, total, percentage, passed);

  // Show results
  showResults(score, total, percentage, passed);
}