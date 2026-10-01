from django import forms

from .models import LiveSession, Participant, Question, Quiz


class QuizForm(forms.ModelForm):
    class Meta:
        model = Quiz
        fields = ("title", "description", "category", "difficulty")
        widgets = {
            "title": forms.TextInput(attrs={"placeholder": "e.g. Python Basics"}),
            "description": forms.Textarea(
                attrs={"placeholder": "What will participants learn?", "rows": 4}
            ),
            "category": forms.TextInput(attrs={"placeholder": "e.g. Programming"}),
            "difficulty": forms.Select(
                choices=(
                    ("easy", "Easy"),
                    ("medium", "Medium"),
                    ("hard", "Hard"),
                )
            ),
        }


class QuestionForm(forms.ModelForm):
    correct_answer = forms.ChoiceField(
        choices=(
            ("a", "Option A"),
            ("b", "Option B"),
            ("c", "Option C"),
            ("d", "Option D"),
        ),
        widget=forms.RadioSelect,
        required=True,
        error_messages={"required": "Please select the correct answer (A, B, C, or D)."},
    )

    class Meta:
        model = Question
        fields = (
            "question_text",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer",
        )
        widgets = {
            "question_text": forms.Textarea(
                attrs={"placeholder": "Write your question", "rows": 3}
            ),
            "option_a": forms.TextInput(attrs={"placeholder": "Option A"}),
            "option_b": forms.TextInput(attrs={"placeholder": "Option B"}),
            "option_c": forms.TextInput(attrs={"placeholder": "Option C"}),
            "option_d": forms.TextInput(attrs={"placeholder": "Option D"}),
        }

    def clean_correct_answer(self):
        val = self.cleaned_data.get("correct_answer", "").strip().lower()
        if val not in ("a", "b", "c", "d"):
            raise forms.ValidationError("Correct answer must be one of: Option A, Option B, Option C, or Option D.")
        return val

    def clean_question_text(self):
        text = self.cleaned_data.get("question_text", "").strip()
        if not text:
            raise forms.ValidationError("Question text cannot be blank.")
        return text

    def clean_option_a(self):
        opt = self.cleaned_data.get("option_a", "").strip()
        if not opt:
            raise forms.ValidationError("Option A cannot be blank.")
        return opt

    def clean_option_b(self):
        opt = self.cleaned_data.get("option_b", "").strip()
        if not opt:
            raise forms.ValidationError("Option B cannot be blank.")
        return opt

    def clean_option_c(self):
        opt = self.cleaned_data.get("option_c", "").strip()
        if not opt:
            raise forms.ValidationError("Option C cannot be blank.")
        return opt

    def clean_option_d(self):
        opt = self.cleaned_data.get("option_d", "").strip()
        if not opt:
            raise forms.ValidationError("Option D cannot be blank.")
        return opt


class GamePinForm(forms.Form):
    game_pin = forms.CharField(
        label="Game PIN",
        max_length=5,
        min_length=5,
        widget=forms.TextInput(
            attrs={"placeholder": "ABCDE", "autocomplete": "off", "spellcheck": "false"}
        ),
    )

    def clean_game_pin(self):
        return self.cleaned_data["game_pin"].strip().upper()


class ParticipantJoinForm(forms.ModelForm):
    class Meta:
        model = Participant
        fields = ("display_name",)
        widgets = {
            "display_name": forms.TextInput(
                attrs={"placeholder": "Choose a display name", "autocomplete": "nickname"}
            )
        }

    def __init__(self, *args, live_session, **kwargs):
        super().__init__(*args, **kwargs)
        self.live_session = live_session

    def clean_display_name(self):
        display_name = self.cleaned_data["display_name"].strip()
        if self.live_session.status != LiveSession.Status.WAITING:
            raise forms.ValidationError("This session is no longer accepting participants.")
        if not display_name:
            raise forms.ValidationError("Please choose a display name.")
        if Participant.objects.filter(
            live_session=self.live_session, display_name__iexact=display_name
        ).exists():
            raise forms.ValidationError("Name already in use")
        return display_name
