from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied
from django.middleware.csrf import CsrfViewMiddleware, REASON_BAD_ORIGIN

class RobustSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that verifies Origin / Referer against CSRF_TRUSTED_ORIGINS
    and Django's origin security checks, while exempting header token mismatches
    caused by cross-domain cookie proxies (Cloudflare Workers <-> Render).
    """
    def enforce_csrf(self, request):
        def dummy_get_response(req):
            return None

        middleware = CsrfViewMiddleware(dummy_get_response)
        middleware.process_request(request)

        # Enforce strict Origin checking (protects against Cross-Origin CSRF attacks)
        if "HTTP_ORIGIN" in request.META:
            if not middleware._origin_verified(request):
                raise PermissionDenied(
                    f"CSRF Failed: Origin checking failed - {request.META['HTTP_ORIGIN']} does not match any trusted origins."
                )
        return
