import secrets

from django.db import migrations, models


def populate_join_tokens(apps, schema_editor):
    Participant = apps.get_model("quiz", "Participant")
    for p in Participant.objects.all():
        p.join_token = secrets.token_hex(20)
        p.save(update_fields=["join_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0004_livesession_current_question_closed"),
    ]

    operations = [
        # Step 1: add the column without unique constraint, allowing blank for existing rows
        migrations.AddField(
            model_name="participant",
            name="join_token",
            field=models.CharField(max_length=40, blank=True, default=""),
            preserve_default=False,
        ),
        # Step 2: fill existing rows with unique tokens
        migrations.RunPython(populate_join_tokens, migrations.RunPython.noop),
        # Step 3: now it is safe to add the unique constraint
        migrations.AlterField(
            model_name="participant",
            name="join_token",
            field=models.CharField(max_length=40, unique=True, blank=True),
        ),
    ]
