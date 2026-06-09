"""
Auth Validators

Input validation for authentication endpoints.
"""

import re


class AuthValidators:
    """Validation utilities for auth endpoints"""

    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    OTP_CODE_REGEX = re.compile(r"^\d{6}$")
    TOKEN_REGEX = re.compile(r"^[A-Za-z0-9_-]+$")

    @classmethod
    def validate_email(cls, email: str | None) -> tuple[bool, str | None]:
        """
        Validate email format.
        Returns (is_valid, error_message).
        """
        if not email:
            return False, "Email is required"

        if not isinstance(email, str):
            return False, "Email must be a string"

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

        if not isinstance(code, str):
            return False, "Code must be a string"

        code = code.strip()

        if len(code) == 6:
            if not cls.OTP_CODE_REGEX.match(code):
                return False, "Code must be 6 digits"
            return True, None

        if len(code) < 32 or len(code) > 64:
            return False, "Invalid code or token format"

        if not cls.TOKEN_REGEX.match(code):
            return False, "Invalid code or token format"

        return True, None

    @classmethod
    def normalize_email(cls, email: str) -> str:
        """Normalize email to lowercase and stripped"""
        return email.strip().lower()
