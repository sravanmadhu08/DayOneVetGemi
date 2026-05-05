import json

from django.contrib import admin
from django.contrib import messages
from django.shortcuts import render
from django.urls import path

from .importers import import_questions, parse_bool
from .models import Question, QuizAttempt, CompletedPracticeQuestion

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'system', 'created_at')
    list_filter = ('system',)
    search_fields = ('question_text', 'explanation')
    change_list_template = "admin/quizzes/question/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "bulk-import/",
                self.admin_site.admin_view(self.bulk_import_view),
                name="quizzes_question_bulk_import",
            ),
        ]
        return custom_urls + urls

    def bulk_import_view(self, request):
        result = None
        if request.method == "POST":
            uploaded_file = request.FILES.get("file")
            if not uploaded_file:
                messages.error(request, "Choose a .txt or .json file to import.")
            else:
                try:
                    payload = json.loads(uploaded_file.read().decode("utf-8"))
                    rows = payload.get("questions") if isinstance(payload, dict) else payload
                    if not isinstance(rows, list):
                        messages.error(request, "Uploaded JSON must be an array or an object with a questions array.")
                    else:
                        result, response_status = import_questions(
                            rows,
                            user=request.user,
                            dry_run=parse_bool(request.POST.get("dry_run", False)),
                            skip_duplicates=parse_bool(request.POST.get("skip_duplicates", False)),
                        )
                        if response_status >= 400:
                            messages.error(request, f"Import failed with {result['error_count']} error(s).")
                        elif request.POST.get("dry_run"):
                            messages.info(request, "Dry run complete. No questions were created.")
                        else:
                            messages.success(request, f"Created {result['created_count']} question(s).")
                except UnicodeDecodeError:
                    messages.error(request, "Uploaded file must be UTF-8 text.")
                except json.JSONDecodeError as exc:
                    messages.error(request, f"Uploaded file must contain valid JSON. {exc.msg} at line {exc.lineno}, column {exc.colno}.")

        return render(
            request,
            "admin/quizzes/question/bulk_import.html",
            {
                **self.admin_site.each_context(request),
                "opts": self.model._meta,
                "title": "Bulk import quiz questions",
                "result": result,
            },
        )

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'total_questions', 'timestamp')
    list_filter = ('timestamp', 'user')
    search_fields = ('user__username', 'system', 'species')

@admin.register(CompletedPracticeQuestion)
class CompletedPracticeQuestionAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'was_correct', 'attempted_at')
    list_filter = ('was_correct', 'attempted_at')
    search_fields = ('user__username', 'question__question_text')
