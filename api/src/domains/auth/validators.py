"""
Auth Validators

Input validation for authentication endpoints.
"""

import re


class AuthValidators:
    """Validation utilities for auth endpoints"""

    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

    @classmethod
    def validate_email(cls, email: str | None) -> tuple[bool, str | None]:
        """
        Validate email format.
        Returns (is_valid, error_message).
        """
        if not email:
            return False, "Email is required"

        email = email.strip().lower()

        if len(email) > 255:
            return False, "Email must be less than 255 characters"

        if not cls.EMAIL_REGEX.match(email):
            return False, "Invalid email format"

        return True, None

    @classmethod
    def validate_code(cls, code: str | None) -> tuple[bool, str | None]:
        """
        Validate OTP code format.
        Returns (is_valid, error_message).
        """
        if not code:
            return False, "Code is required"

        code = code.strip()

        # Support both 6-digit codes and longer tokens
        if len(code) == 6:
            if not code.isdigit():
                return False, "Code must be 6 digits"
        elif len(code) < 32:
            return False, "Invalid code or token format"

        return True, None

    @classmethod
    def normalize_email(cls, email: str) -> str:
        """Normalize email to lowercase and stripped"""
        return email.strip().lower()
