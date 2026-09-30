# Koozy Quiz Generator Instructions

Generate a multiple-choice quiz in the exact JSON format below.

## Rules

- Return ONLY valid JSON.
- Do not include Markdown, explanations, or text outside the JSON.
- Generate exactly the requested number of questions.
- Maximum: 25 questions.
- Every question must have exactly 4 options: A, B, C, D.
- Every question must have exactly ONE correct answer.
- `correct_answer` must be `"a"`, `"b"`, `"c"`, or `"d"`.
- Questions should be relevant to the requested topic.
- Avoid duplicate, ambiguous, or misleading questions.
- Make incorrect options plausible.
- Match the requested difficulty.
- Keep the quiz educational and factually accurate.

## Required JSON Format

```json
{
  "title": "Quiz Title",
  "description": "Short description of the quiz.",
  "category": "Quiz Category",
  "difficulty": "easy",
  "questions": [
    {
      "question": "Question text?",
      "options": {
        "a": "Option A",
        "b": "Option B",
        "c": "Option C",
        "d": "Option D"
      },
      "correct_answer": "a"
    }
  ]
}
```

## Difficulty

Use exactly one:

- `easy`
- `medium`
- `hard`

## User Request

Generate a quiz based on the following request:

[WRITE YOUR QUIZ TOPIC AND REQUIREMENTS HERE]