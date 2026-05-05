from django.db import transaction

from .models import Question
from .serializers import BulkQuestionImportSerializer


def parse_bool(value):
    if isinstance(value, bool):
        return value
    return str(value).lower() in ("1", "true", "yes", "on")


def import_questions(rows, *, user, dry_run=False, skip_duplicates=False):
    errors = []
    question_kwargs = []
    for index, row in enumerate(rows):
        serializer = BulkQuestionImportSerializer(data=row)
        if serializer.is_valid():
            question_kwargs.append(serializer.to_question_kwargs())
        else:
            errors.append({"index": index, "errors": serializer.errors})

    if errors:
        return {
            "created_count": 0,
            "skipped_count": 0,
            "error_count": len(errors),
            "created_ids": [],
            "skipped": [],
            "errors": errors,
        }, 400

    skipped = []
    existing_texts = set()
    if skip_duplicates and question_kwargs:
        existing_texts = set(Question.objects.filter(
            question_text__in=[item["question_text"] for item in question_kwargs]
        ).values_list("question_text", flat=True))

    to_create = []
    for index, item in enumerate(question_kwargs):
        if skip_duplicates and item["question_text"] in existing_texts:
            skipped.append({
                "index": index,
                "text": item["question_text"],
                "reason": "duplicate question_text",
            })
            continue
        to_create.append(Question(creator=user, **item))

    if dry_run:
        return {
            "created_count": len(to_create),
            "skipped_count": len(skipped),
            "error_count": 0,
            "created_ids": [],
            "skipped": skipped,
            "errors": [],
        }, 200

    with transaction.atomic():
        created = Question.objects.bulk_create(to_create)

    return {
        "created_count": len(created),
        "skipped_count": len(skipped),
        "error_count": 0,
        "created_ids": [question.id for question in created],
        "skipped": skipped,
        "errors": [],
    }, 201
