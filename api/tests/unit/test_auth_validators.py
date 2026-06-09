import pytest

from domains.auth.validators import AuthValidators


class TestAuthValidators:
    @pytest.mark.parametrize(
        ("email", "expected_error"),
        [
            (None, "Email is required"),
            ("", "Email is required"),
            (123, "Email must be a string"),
            (["user@example.com"], "Email must be a string"),
            ("valid@example.com", None),
            ("VALID@Example.Com", None),
            ("a" * 249 + "@x.com", None),
            ("a" * 256 + "@x.com", "Email must be less than 255 characters"),
            ("notanemail", "Invalid email format"),
        ],
    )
    def test_validate_email(self, email, expected_error):
        is_valid, error = AuthValidators.validate_email(email)

        if expected_error is None:
            assert is_valid is True
            assert error is None
        else:
            assert is_valid is False
            assert error == expected_error

    @pytest.mark.parametrize(
        ("code", "expected_error"),
        [
            (None, "Code is required"),
            ("", "Code is required"),
            ("123456", None),
            ("  123456  ", None),
            ("12345a", "Code must be 6 digits"),
            ("short", "Invalid code or token format"),
            (123456, "Code must be a string"),
            (["000000"], "Code must be a string"),
            ("a" * 32, None),
            ("a!b" + "c" * 29, "Invalid code or token format"),
            ("a" * 65, "Invalid code or token format"),
            ("a" * 64, None),
        ],
    )
    def test_validate_code(self, code, expected_error):
        is_valid, error = AuthValidators.validate_code(code)

        if expected_error is None:
            assert is_valid is True
            assert error is None
        else:
            assert is_valid is False
            assert error == expected_error

    @pytest.mark.parametrize(("code",), [(123456,), (["000000"],)])
    def test_validate_code_rejects_non_strings(self, code):
        is_valid, error = AuthValidators.validate_code(code)
        assert is_valid is False
        assert error == "Code must be a string"
