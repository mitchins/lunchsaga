"""
Auth Service

Business logic for authentication including magic link generation and verification.
"""

import secrets
from datetime import datetime, timedelta, timezone

import jwt

from kinglet.email import EmailMessage, get_email_sender
from models import MagicLink, User


class AuthService:
    """Authentication service for magic link flow"""

    # JWT Configuration
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRY_DAYS = 30

    @staticmethod
    def _get_jwt_secret(env) -> str:
        """Get JWT secret from environment"""
        secret = getattr(env, "JWT_SECRET", None)
        if not secret:
            # Fallback for development only
            if getattr(env, "ENVIRONMENT", "development") == "development":
                return "dev-secret-do-not-use-in-production"
            raise ValueError("JWT_SECRET must be set in production")
        return secret

    @staticmethod
    def _generate_code() -> str:
        """Generate a 6-digit OTP code"""
        return str(secrets.randbelow(900000) + 100000)  # 100000-999999

    @staticmethod
    def _generate_token() -> str:
        """Generate a secure token for magic link"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def _create_magic_link_email(email: str, code: str, env) -> EmailMessage:
        """Create magic link email message with templates"""
        body_text = f"Your login code is: {code}\n\nThis code will expire in 15 minutes."
        
        body_html = f"""
        <html>
            <body>
                <h2>Your LunchSaga Login Code</h2>
                <p>Your login code is: <strong>{code}</strong></p>
                <p>This code will expire in 15 minutes.</p>
            </body>
        </html>
        """
        
        return EmailMessage(
            to=[email],
            subject="Your LunchSaga Login Code",
            body_text=body_text,
            body_html=body_html,
            from_address=getattr(env, "EMAIL_FROM_ADDRESS", "noreply@lunchsaga.app"),
        )

    @classmethod
    async def send_magic_link(cls, db, email: str, env) -> dict:
        """
        Generate and store magic link + OTP code.
        Sends email via SES in production or mock in development.
        """
        # Check for dev OTP bypass
        dev_otp = getattr(env, "DEV_OTP_CODE", None)
        code = dev_otp if dev_otp else cls._generate_code()

        token = cls._generate_token()
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)

        # Store magic link
        await MagicLink.objects.create(
            db,
            email=email,
            code=code,
            token=token,
            expires_at=expires,
        )

        # Send email with magic link code
        email_sender = get_email_sender(env)
        email_message = cls._create_magic_link_email(email, code, env)
        await email_sender.send_email(email_message)

        # In development, also log for convenience
        environment = getattr(env, "ENVIRONMENT", "development")
        if environment == "development":
            print(f"[DEV] Magic link for {email}: code={code}, token={token}")

        return {"sent": True, "email": email}

    @classmethod
    async def verify(cls, db, email: str, code_or_token: str, env) -> dict | None:
        """
        Verify code or token, return JWT if valid.
        """
        now = datetime.now(timezone.utc)

        # Try to find by token first
        link = await MagicLink.objects.filter(
            db, token=code_or_token, used=False
        ).first()

        # If not found by token, try by code for this email
        if not link:
            link = await MagicLink.objects.filter(
                db, email=email, code=code_or_token, used=False
            ).first()

        if not link:
            return None

        # Check expiration - handle timezone-naive datetimes from DB
        expires_at = link.expires_at
        if expires_at.tzinfo is None:
            # Assume UTC if no timezone info
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return None

        # Mark as used
        await MagicLink.objects.filter(db, id=link.id).update(used=True)

        # Get or create user
        user = await User.objects.filter(db, email=email).first()
        if not user:
            # Create new user with email prefix as default name
            name = email.split("@")[0]
            user = await User.objects.create(db, email=email, name=name)

        # Generate JWT
        jwt_secret = cls._get_jwt_secret(env)
        payload = {
            "user_id": str(user.id),
            "email": user.email,
            "exp": datetime.now(timezone.utc)
            + timedelta(days=cls.JWT_EXPIRY_DAYS),
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(payload, jwt_secret, algorithm=cls.JWT_ALGORITHM)

        return {
            "token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
            },
        }

    @classmethod
    async def get_current_user(cls, db, request, env) -> dict | None:
        """
        Get current user from JWT token in Authorization header.
        """
        auth_header = request.header("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:]  # Remove "Bearer " prefix

        try:
            jwt_secret = cls._get_jwt_secret(env)
            payload = jwt.decode(token, jwt_secret, algorithms=[cls.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

        user_id = payload.get("user_id")
        if not user_id:
            return None

        user = await User.objects.filter(db, id=user_id).first()
        if not user:
            return None

        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
        }

    @classmethod
    async def update_user(cls, db, user_id: str, updates: dict) -> dict | None:
        """Update user profile"""
        allowed_fields = {"name", "avatar"}
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}

        if not filtered_updates:
            return None

        await User.objects.filter(db, id=user_id).update(**filtered_updates)
        user = await User.objects.filter(db, id=user_id).first()

        if not user:
            return None

        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
        }
