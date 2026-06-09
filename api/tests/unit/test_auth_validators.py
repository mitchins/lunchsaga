import pytest

from domains.auth.validators import AuthValidators


class TestAuthValidators:
    @pytest.mark.parametrize(
        ("email", "expected_error"),
        [
            (123, "Email must be a string"),
            (["user@example.com"], "Email must be a string"),
        ],
    )
    def test_validate_email_rejects_non_strings(self, email, expected_error):
        is_valid, error = AuthValidators.validate_email(email)

        assert is_valid is False
        assert error == expected_error

    @pytest.mark.parametrize(
        ("code", "expected_error"),
        [
            (123456, "Code must be a string"),
            (["000000"], "Code must be a string"),
        ],
    )
    def test_validate_code_rejects_non_strings(self, code, expected_error):
        is_valid, error = AuthValidators.validate_code(code)

        assert is_valid is False
        assert error == expected_error
