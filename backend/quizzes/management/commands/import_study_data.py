import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from flashcards.models import Flashcard
from quizzes.models import Question


QUESTION_REQUIRED_FIELDS = [
    "question_text",
    "options",
    "correct_answer_index",
    "explanation",
    "species",
    "system",
]

FLASHCARD_REQUIRED_FIELDS = [
    "front",
    "back",
    "deck",
]


class Command(BaseCommand):
    help = "Bulk import questions and flashcards from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to a JSON file shaped as {'questions': [...], 'flashcards': [...]}.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report counts without writing records.",
        )
        parser.add_argument(
            "--skip-duplicates",
            action="store_true",
            help="Skip records already present in the database or repeated in the import file.",
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        dry_run = options["dry_run"]
        skip_duplicates = options["skip_duplicates"]

        data = self.load_json(file_path)
        questions_data = data.get("questions", [])
        flashcards_data = data.get("flashcards", [])

        if not isinstance(questions_data, list):
            raise CommandError("'questions' must be a list.")
        if not isinstance(flashcards_data, list):
            raise CommandError("'flashcards' must be a list.")

        stats = {
            "questions_created": 0,
            "questions_skipped": 0,
            "questions_errors": 0,
            "flashcards_created": 0,
            "flashcards_skipped": 0,
            "flashcards_errors": 0,
        }

        question_errors = []
        flashcard_errors = []

        questions = self.build_questions(
            questions_data,
            skip_duplicates,
            stats,
            question_errors,
        )
        flashcards = self.build_flashcards(
            flashcards_data,
            skip_duplicates,
            stats,
            flashcard_errors,
        )

        for message in question_errors + flashcard_errors:
            self.stderr.write(message)

        if question_errors or flashcard_errors:
            self.print_stats(stats)
            raise CommandError("Import aborted because validation errors were found.")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run only. No records were written."))
            self.print_stats(stats)
            return

        with transaction.atomic():
            Question.objects.bulk_create(questions, batch_size=500)
            Flashcard.objects.bulk_create(flashcards, batch_size=500)

        self.print_stats(stats)

    def load_json(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as handle:
                data = json.load(handle)
        except FileNotFoundError:
            raise CommandError(f"File not found: {file_path}")
        except json.JSONDecodeError as exc:
            raise CommandError(f"Invalid JSON in {file_path}: {exc}")
        except OSError as exc:
            raise CommandError(f"Could not read {file_path}: {exc}")

        if not isinstance(data, dict):
            raise CommandError("Top-level JSON value must be an object.")

        return data

    def build_questions(self, rows, skip_duplicates, stats, errors):
        existing_keys = set()
        if skip_duplicates:
            existing_keys = set(
                Question.objects.values_list("question_text", "system")
            )

        seen_keys = set()
        questions = []

        for index, row in enumerate(rows, start=1):
            label = f"questions[{index}]"
            if not isinstance(row, dict):
                errors.append(f"{label}: expected an object.")
                stats["questions_errors"] += 1
                continue

            row_errors = self.validate_required(row, QUESTION_REQUIRED_FIELDS, label)
            row_errors.extend(self.validate_question(row, label))
            if row_errors:
                errors.extend(row_errors)
                stats["questions_errors"] += 1
                continue

            key = (row["question_text"], row["system"])
            if skip_duplicates and (key in existing_keys or key in seen_keys):
                stats["questions_skipped"] += 1
                continue

            seen_keys.add(key)
            questions.append(
                Question(
                    question_text=row["question_text"],
                    options=row["options"],
                    correct_answer_index=row["correct_answer_index"],
                    explanation=row["explanation"],
                    species=row["species"],
                    system=row["system"],
                    creator=None,
                )
            )
            stats["questions_created"] += 1

        return questions

    def build_flashcards(self, rows, skip_duplicates, stats, errors):
        existing_keys = set()
        if skip_duplicates:
            existing_keys = set(Flashcard.objects.values_list("front", "deck"))

        seen_keys = set()
        flashcards = []

        for index, row in enumerate(rows, start=1):
            label = f"flashcards[{index}]"
            if not isinstance(row, dict):
                errors.append(f"{label}: expected an object.")
                stats["flashcards_errors"] += 1
                continue

            row_errors = self.validate_required(row, FLASHCARD_REQUIRED_FIELDS, label)
            row_errors.extend(self.validate_flashcard(row, label))
            if row_errors:
                errors.extend(row_errors)
                stats["flashcards_errors"] += 1
                continue

            key = (row["front"], row["deck"])
            if skip_duplicates and (key in existing_keys or key in seen_keys):
                stats["flashcards_skipped"] += 1
                continue

            seen_keys.add(key)
            flashcards.append(
                Flashcard(
                    front=row["front"],
                    back=row["back"],
                    deck=row["deck"],
                    tags=row.get("tags", []),
                    creator=None,
                )
            )
            stats["flashcards_created"] += 1

        return flashcards

    def validate_required(self, row, required_fields, label):
        errors = []
        for field in required_fields:
            if field not in row:
                errors.append(f"{label}: missing required field '{field}'.")
            elif row[field] in ("", None):
                errors.append(f"{label}: field '{field}' cannot be empty.")
        return errors

    def validate_question(self, row, label):
        errors = []

        options = row.get("options")
        if "options" in row and not isinstance(options, list):
            errors.append(f"{label}: field 'options' must be a list.")
        elif isinstance(options, list) and len(options) == 0:
            errors.append(f"{label}: field 'options' must contain at least one option.")

        species = row.get("species")
        if "species" in row and not isinstance(species, list):
            errors.append(f"{label}: field 'species' must be a list.")
        elif isinstance(species, list) and len(species) == 0:
            errors.append(f"{label}: field 'species' must contain at least one species.")

        index = row.get("correct_answer_index")
        if "correct_answer_index" in row and not isinstance(index, int):
            errors.append(f"{label}: field 'correct_answer_index' must be an integer.")
        elif isinstance(options, list) and isinstance(index, int):
            if index < 0 or index >= len(options):
                errors.append(
                    f"{label}: field 'correct_answer_index' must point to an existing option."
                )

        return errors

    def validate_flashcard(self, row, label):
        errors = []
        tags = row.get("tags", [])
        if "tags" in row and not isinstance(tags, list):
            errors.append(f"{label}: field 'tags' must be a list when provided.")
        return errors

    def print_stats(self, stats):
        self.stdout.write(
            "Questions: "
            f"created={stats['questions_created']}, "
            f"skipped={stats['questions_skipped']}, "
            f"errors={stats['questions_errors']}"
        )
        self.stdout.write(
            "Flashcards: "
            f"created={stats['flashcards_created']}, "
            f"skipped={stats['flashcards_skipped']}, "
            f"errors={stats['flashcards_errors']}"
        )
