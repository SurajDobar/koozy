import secrets

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class HostProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="host_profile",
    )
    google_id = models.CharField(max_length=255, blank=True, db_index=True)
    avatar_url = models.URLField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} Profile"


class Quiz(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20)
    time_limit = models.PositiveIntegerField(default=300)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quizzes",
        null=True,
        blank=True,
    )

    def has_valid_questions(self):
        questions = list(self.questions.all())
        return len(questions) > 0 and all(q.is_valid() for q in questions)

    def __str__(self):
        return self.title


class Question(models.Model):
    CORRECT_ANSWER_CHOICES = (
        ("a", "Option A"),
        ("b", "Option B"),
        ("c", "Option C"),
        ("d", "Option D"),
    )

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name="questions"
    )
    question_text = models.TextField()

    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)

    correct_answer = models.CharField(max_length=1, choices=CORRECT_ANSWER_CHOICES)

    # Individual question time limit (optional/legacy fallback)
    time_limit = models.PositiveSmallIntegerField(default=20)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "id")

    def is_valid(self):
        """Check whether question text, all four options, and a valid correct_answer exist."""
        if not (self.question_text and self.question_text.strip()):
            return False
        if not (self.option_a and self.option_a.strip()):
            return False
        if not (self.option_b and self.option_b.strip()):
            return False
        if not (self.option_c and self.option_c.strip()):
            return False
        if not (self.option_d and self.option_d.strip()):
            return False
        if not (self.correct_answer and str(self.correct_answer).strip().lower() in ("a", "b", "c", "d")):
            return False
        return True

    def save(self, *args, **kwargs):
        if self.correct_answer:
            self.correct_answer = str(self.correct_answer).strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.question_text


class LiveSession(models.Model):
    class Status(models.TextChoices):
        WAITING = "WAITING", "Waiting"
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"

    PIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="live_sessions")
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_sessions",
        null=True,
        blank=True,
    )
    game_pin = models.CharField(max_length=5, validators=[MinLengthValidator(5)])
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.WAITING)
    created_at = models.DateTimeField(auto_now_add=True)

    # Live quiz state & timer for the entire quiz
    current_question_index = models.IntegerField(default=-1)
    question_started_at = models.DateTimeField(null=True, blank=True)
    quiz_started_at = models.DateTimeField(null=True, blank=True)
    total_time_limit = models.PositiveIntegerField(default=300)
    ended_at = models.DateTimeField(null=True, blank=True)
    current_question_closed = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("game_pin",),
                condition=Q(status__in=["WAITING", "ACTIVE"]),
                name="unique_live_game_pin",
            )
        ]
        ordering = ("-created_at",)

    @classmethod
    def generate_game_pin(cls):
        for _ in range(100):
            game_pin = "".join(secrets.choice(cls.PIN_ALPHABET) for _ in range(5))
            if not cls.objects.filter(
                game_pin=game_pin, status__in=[cls.Status.WAITING, cls.Status.ACTIVE]
            ).exists():
                return game_pin
        raise RuntimeError("Unable to generate a unique Game PIN.")

    def can_start(self):
        """A session can only start if its quiz has valid questions."""
        return self.quiz.has_valid_questions()

    def save(self, *args, **kwargs):
        if not self.game_pin:
            self.game_pin = self.generate_game_pin()
        if not self.total_time_limit and self.quiz_id:
            self.total_time_limit = getattr(self.quiz, "time_limit", 300) or 300
        super().save(*args, **kwargs)

    def current_question(self):
        """Return current Question object or None."""
        if self.current_question_index < 0:
            return None
        questions = list(self.quiz.questions.all())
        if self.current_question_index < len(questions):
            return questions[self.current_question_index]
        return None

    def seconds_elapsed(self):
        """Seconds elapsed since question/quiz started."""
        start_time = self.question_started_at or self.quiz_started_at
        if start_time is None:
            return 0
        delta = timezone.now() - start_time
        return max(0.0, delta.total_seconds())

    def seconds_remaining(self):
        """Seconds remaining for the active timer."""
        if self.status == self.Status.COMPLETED:
            return 0
        start_time = self.question_started_at or self.quiz_started_at
        if start_time is None:
            return self.total_time_limit
        rem = self.total_time_limit - self.seconds_elapsed()
        return max(0, round(rem))

    def is_answer_phase_open(self):
        if self.status != self.Status.ACTIVE:
            return False
        if self.current_question_closed:
            return False
        q = self.current_question()
        if q is not None and self.question_started_at is not None:
            return self.seconds_elapsed() < q.time_limit
        return self.seconds_remaining() > 0

    def is_quiz_open(self):
        return self.status == self.Status.ACTIVE and self.seconds_remaining() > 0

    def __str__(self):
        return f"{self.quiz} ({self.game_pin})"


class Participant(models.Model):
    live_session = models.ForeignKey(
        LiveSession, on_delete=models.CASCADE, related_name="participants"
    )
    display_name = models.CharField(max_length=40)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    join_token = models.CharField(max_length=40, unique=True, blank=True)
    is_kicked = models.BooleanField(default=False)
    is_admitted = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("live_session", "display_name"),
                name="unique_participant_name_per_session",
            )
        ]
        ordering = ("joined_at",)

    def save(self, *args, **kwargs):
        if not self.join_token:
            for _ in range(10):
                token = secrets.token_hex(20)
                if not Participant.objects.filter(join_token=token).exists():
                    self.join_token = token
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return self.display_name


class AnswerSubmission(models.Model):
    """Records a participant's answer for a single question in a live session."""

    participant = models.ForeignKey(
        Participant, on_delete=models.CASCADE, related_name="submissions"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="submissions"
    )
    selected_option = models.CharField(max_length=1)  # 'a', 'b', 'c', or 'd'
    is_correct = models.BooleanField(default=False)
    points_awarded = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("participant", "question"),
                name="unique_answer_per_participant_per_question",
            )
        ]
        ordering = ("submitted_at",)

    def __str__(self):
        return f"{self.participant} — Q{self.question_id} → {self.selected_option}"


class AIGenerationUsage(models.Model):
    """Tracks daily AI quiz generation attempts per authenticated host."""
    MAX_DAILY_ATTEMPTS = 8

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_generation_usages",
    )
    date = models.DateField(default=timezone.localdate)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("user", "date"),
                name="unique_user_daily_ai_generation_usage",
            )
        ]
        ordering = ("-date",)

    def __str__(self):
        return f"{self.user} - {self.date}: {self.count}/{self.MAX_DAILY_ATTEMPTS}"
