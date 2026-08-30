"""
Google OAuth 2.0 implementation with State CSRF protection & PKCE for Koozy.
"""

import base64
import hashlib
import logging
import os
import secrets
import urllib.parse
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse

from .models import HostProfile

logger = logging.getLogger(__name__)
User = get_user_model()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _generate_code_challenge(code_verifier: str) -> str:
    """Generate SHA256 code challenge for PKCE."""
    digest = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def get_redirect_uri(request) -> str:
    """Resolve the OAuth redirect URI."""
    configured_uri = getattr(settings, "GOOGLE_REDIRECT_URI", "").strip()
    if configured_uri:
        return configured_uri
    return request.build_absolute_uri(reverse("auth_google_callback"))


def build_google_authorization_url(request) -> str:
    """
    Generate Google OAuth 2.0 Authorization URL with state and PKCE challenge.
    Stores state and code_verifier in request.session.
    """
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured in environment/settings.")

    state = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = _generate_code_challenge(code_verifier)

    request.session["oauth_state"] = state
    request.session["oauth_code_verifier"] = code_verifier

    redirect_uri = get_redirect_uri(request)

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
        "access_type": "online",
    }
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_and_get_userinfo(request, code: str, state: str) -> dict:
    """
    Validate state, exchange authorization code for tokens, and fetch Google userinfo.
    """
    expected_state = request.session.get("oauth_state")
    code_verifier = request.session.get("oauth_code_verifier")

    if not expected_state or not secrets.compare_digest(str(expected_state), str(state)):
        raise PermissionError("Invalid OAuth state token. Possible CSRF attempt.")

    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "").strip()
    client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "").strip()
    redirect_uri = get_redirect_uri(request)

    if not client_id or not client_secret:
        raise ValueError("Google OAuth client ID/Secret not configured.")

    token_data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
        "code_verifier": code_verifier,
    }

    token_response = requests.post(GOOGLE_TOKEN_URL, data=token_data, timeout=10)
    if token_response.status_code != 200:
        logger.error("Token exchange failed: %s %s", token_response.status_code, token_response.text)
        raise RuntimeError(f"Failed to exchange OAuth code with Google: {token_response.text}")

    token_json = token_response.json()
    access_token = token_json.get("access_token")
    if not access_token:
        raise RuntimeError("No access_token returned by Google.")

    userinfo_resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if userinfo_resp.status_code != 200:
        logger.error("Failed to fetch user info: %s %s", userinfo_resp.status_code, userinfo_resp.text)
        raise RuntimeError("Failed to fetch Google profile userinfo.")

    return userinfo_resp.json()


def get_or_create_google_host_user(userinfo: dict) -> User:
    """
    Resolve or create persistent Django User and HostProfile from verified Google user info.
    One Google identity = one persistent Django User.
    """
    sub = str(userinfo.get("sub") or "").strip()
    email = str(userinfo.get("email") or "").strip().lower()
    name = (
        userinfo.get("name")
        or userinfo.get("given_name")
        or (email.split("@")[0] if email else "Host")
    ).strip()
    picture = str(userinfo.get("picture") or "").strip()

    if not email:
        raise ValueError("Google profile did not provide a verified email address.")

    with transaction.atomic():
        # 1. Match by Google sub (ID) in HostProfile
        profile = None
        if sub:
            profile = HostProfile.objects.select_related("user").filter(google_id=sub).first()

        if profile:
            user = profile.user
            # Keep name, email, and avatar up to date
            updated_user = False
            if name and user.first_name != name:
                user.first_name = name
                updated_user = True
            if email and user.email != email:
                user.email = email
                updated_user = True
            if updated_user:
                user.save(update_fields=["first_name", "email"])

            if picture and profile.avatar_url != picture:
                profile.avatar_url = picture
                profile.save(update_fields=["avatar_url"])
            return user

        # 2. Match by email or username
        user = User.objects.filter(email=email).first() or User.objects.filter(username=email).first()
        if not user:
            # Create new persistent User
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=name,
            )
        else:
            if name and not user.first_name:
                user.first_name = name
                user.save(update_fields=["first_name"])

        # Create or update HostProfile
        HostProfile.objects.update_or_create(
            user=user,
            defaults={
                "google_id": sub,
                "avatar_url": picture,
            },
        )
        return user
