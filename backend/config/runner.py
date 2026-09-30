from django.test.runner import DiscoverRunner


class KoozyTestRunner(DiscoverRunner):
    """
    Custom test runner for Koozy that defaults test discovery to 'quiz'
    when no test labels are explicitly provided, enabling `python backend/manage.py test`
    to work seamlessly from either the repository root or inside backend/.
    """

    def build_suite(self, test_labels=None, extra_tests=None, **kwargs):
        if not test_labels:
            test_labels = ["quiz"]
        return super().build_suite(
            test_labels=test_labels, extra_tests=extra_tests, **kwargs
        )
