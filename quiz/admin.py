from django.contrib import admin

from .models import AnswerSubmission, LiveSession, Participant, Question, Quiz


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ("question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "time_limit")


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "difficulty", "question_count")
    inlines = [QuestionInline]

    @admin.display(description="Questions")
    def question_count(self, obj):
        return obj.questions.count()


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("question_text", "quiz", "correct_answer", "time_limit")
    list_filter = ("quiz",)


class ParticipantInline(admin.TabularInline):
    model = Participant
    extra = 0
    fields = ("display_name", "score", "joined_at")
    readonly_fields = ("joined_at",)


@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    list_display = ("game_pin", "quiz", "status", "current_question_index", "created_at")
    list_filter = ("status",)
    readonly_fields = ("created_at",)
    inlines = [ParticipantInline]


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("display_name", "live_session", "score", "joined_at")
    list_filter = ("live_session",)
    readonly_fields = ("joined_at",)


@admin.register(AnswerSubmission)
class AnswerSubmissionAdmin(admin.ModelAdmin):
    list_display = ("participant", "question", "selected_option", "is_correct", "points_awarded", "submitted_at")
    list_filter = ("is_correct", "participant__live_session")
    readonly_fields = ("submitted_at",)
