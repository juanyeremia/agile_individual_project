/*
1. On page load
- AJAX fetches quiz_questions.json from server
- Store quiz questions in a variable
- Wait for user to click "Start Quiz" button
*/

// Store questions and quiz state
let questions = [];
let hasStarted = false;

// Fetch quiz questions on page load
$(document).ready(function() {

  // AJAX loads questions
  $.ajax({
    url: './data/quiz_questions.json',
    method: 'GET',
    dataType: 'json',
    success:function(data) {
      // Store the loaded questions
      questions = data;
    },
    error: function() {
      $('#quiz-intro').html('<p>Error loading questions. Please try again.</p>');
    }
  });

  // Start Quiz button click handler
  $('#start-btn').on('click', function() {
    startQuiz();
  });

  // Submit button
  $('#submit-btn').on('click', function() {
    submitQuiz();
  });

  // Retry button
  $('#retry-btn').on('click', function(){
    hasStarted = false;
    window.onbeforeunload = null;

    $('#results-container').empty();
    $('#reward-container').empty();
    $('#history-container').empty();

    $('#quiz-results').hide();
    startQuiz();
  });

  // Clear history 
  $('#clear-history-btn').on('click', function() {
    try {                                             // Will attempt to clear history
      localStorage.removeItem('quizAttempts');
    } catch(e) {                                      // If failed for some reason
      console.warn('Could not clear history: ' + e);
    }
    $('#history-container').html('<p>History cleared.</p>');  // Produce output to HTML that says 'History cleared'
    $('#clear-history-btn').hide();         // Hide Clear History button after clearing
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

/*
5. Save attempt and Show Results
- Saves attempt to lcoalStorage
- Displays score, percentage and pass/fail message
*/

// Save quiz attempt to localStorage
function saveAttempt(score, total, percentage, passed) {
  // Building the attempt object
  const attempt = {
    score: score,
    total: total,
    percentage: percentage, 
    passed: passed,
    date: new Date().toLocaleString() // Save the current date and time
  };
  
  // Wrap in try/catch for private browsing where localStorage may be unavailable
  try {
      // Get existing attempts or start with empty array
      const existing = JSON.parse(localStorage.getItem('quizAttempts')) || [];

      // Add new attempt
      existing.push(attempt);

      // Save back to localStorage
      localStorage.setItem('quizAttempts', JSON.stringify(existing));
  } catch (e) {
      console.log('localStorage is not available: ' + e);
    return;
  }
}

// Show results on the page
function showResults(score, total, percentage, passed) {
  // Hide questions, show results
  $('#quiz-questions').hide();    // Element with id "quiz-questions" will be hidden
  $('#quiz-results').show();      // Element with id "quiz-results" will be shown

  // Build results HTML
  const resultHTML = `
    <div class="result-score">
      <p>Score: <strong>${score} / ${total}</strong></p>
      <p>Percentage: <strong>${percentage}%</strong></p>
      <p>Result: <strong class="${passed ? 'result-pass' : 'result-fail'}">
          ${passed ? 'PASS' : 'FAIL'}
      </strong></p>
      <p class="pass-threshold">Pass threshold: 70%</p>
    </div>
  `;

  $('#results-container').html(resultHTML); // Inject results into the page

  // If passed, fetch a joke
  if (passed) {
    fetchJoke();
  }

  // Show attempt history
  showHistory();
} 

// Fetch a random joke from the API
function fetchJoke() {
  $('#reward-container').html('<p>Loading your reward...</p>'); // Show loading message

  $.ajax({      // AJAX is an asyncronous method of fetching data from a server without refreshing the page (before async/await).
    // Describe where and how to fetch the joke
    url: 'https://official-joke-api.appspot.com/random_joke',
    method: 'GET',
    dataType: 'json',
    // If successful...
    success: function(data) {
      const jokeHTML = `
        <div class="reward-box">
          <p class="reward-label">You passed! Here is your reward joke:</p>
          <p class="joke-setup">${data.setup}</p>
          <p class="joke-punchline">${data.punchline}</p>
        </div>
      `;
      $('#reward-container').html(jokeHTML);    // Inject the joke into the page
    },
    error: function() {
      $('#reward-container').html('<p>Could not load reward. But you still passed!</p>');
    }
  });
}

// Show history
function showHistory() {
  try {
    const attempts = JSON.parse(localStorage.getItem('quizAttempts')) || []

    if(attempts.length == 0) {
      $('#history-container').html('<p>No previous attempts.</p>');
      return;
    }

    let historyHTML = '<h3>Attempt History</h3><table class="history-table"><thead><tr><th>Date</th><th>Score</th><th>Percentage</th><th>Result</th></tr></thead><tbody>';

    // Loop through attempts and build table rows
    attempts.forEach(function(attempt) {
       historyHTML += `
          <tr>
              <td>${attempt.date}</td>
              <td>${attempt.score} / ${attempt.total}</td>
              <td>${attempt.percentage}%</td>
              <td class="${attempt.passed ? 'result-pass' : 'result-fail'}">
                ${attempt.passed ? 'PASS' : 'FAIL'}
              </td>
          </tr>
      `;
    });

    historyHTML += '</tbody></table>';
    $('#history-container').html(historyHTML);
    $('#clear-history-btn').show();
    
  } catch(e) {
    $('#history-container').html('<p>Could not load attempt history.</p>');
  }
}

