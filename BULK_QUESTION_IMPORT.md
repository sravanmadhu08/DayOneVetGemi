# Bulk Question Import

Bulk import is available at:

```http
POST /api/questions/bulk-import/
```

## Required Auth

The request must be authenticated as a staff user or a user whose profile has `is_admin=true`.

## JSON Array Example

```json
[
  {
    "text": "Question text",
    "species": "cat",
    "system": "nutrition",
    "explanation": "Explanation text",
    "exam_tip": "Exam tip text",
    "choices": [
      { "text": "Choice A", "is_correct": false },
      { "text": "Choice B", "is_correct": true }
    ]
  }
]
```

`species` may be a string or a list of strings. Strings are stored as a one-item list because the frontend expects `q.species.includes(...)`.

## Object Format And Dry Run

```json
{
  "dry_run": true,
  "skip_duplicates": true,
  "questions": [
    {
      "text": "Question text",
      "species": ["cat", "dog"],
      "system": "nutrition",
      "explanation": "Explanation text",
      "exam_tip": "Exam tip text",
      "choices": [
        { "text": "Choice A", "is_correct": false },
        { "text": "Choice B", "is_correct": true }
      ]
    }
  ]
}
```

`dry_run=true` validates and reports counts without saving. `skip_duplicates=true` skips rows whose `text` matches an existing `Question.question_text`.

## Response Example

```json
{
  "created_count": 22,
  "skipped_count": 0,
  "error_count": 0,
  "created_ids": [1, 2, 3],
  "skipped": [],
  "errors": []
}
```

If any row fails validation, no questions are imported and `errors` includes per-row validation details.
