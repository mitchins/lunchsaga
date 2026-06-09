"""
Unit tests for Kinglet's current email interfaces (ses/testing).

Kinglet 1.8.3 removed `kinglet.email` and moved email helpers to:
- `kinglet.ses` for send API
- `kinglet.testing` for MockEmailSender and related test helpers
"""

import asyncio

import pytest
from kinglet.ses import EmailResult
from kinglet.testing import MockEmailSender


class MockEnv:
    """Minimal env object for send_email compatibility."""

    ENVIRONMENT = "test"
    AWS_REGION = "us-east-1"


class TestMockEmailSender:
    """Test `kinglet.testing.MockEmailSender` behavior."""

    @pytest.mark.asyncio
    async def test_send_email_success_records_message(self):
        sender = MockEmailSender()

        result = await sender.send_email(
            MockEnv(),
            from_email="noreply@app.com",
            to=["user@example.com"],
            subject="Hello",
            body_text="text",
            body_html="<p>html</p>",
        )

        assert result == EmailResult(success=True, message_id=result.message_id, error=None)
        assert result.message_id is not None
        assert result.error is None
        assert sender.count == 1
        assert sender.sent_emails[0].to == ["user@example.com"]
        assert sender.sent_emails[0].subject == "Hello"

    @pytest.mark.asyncio
    async def test_send_email_with_failure_by_recipient(self):
        sender = MockEmailSender()
        sender.set_failure_for("bad@example.com", "Invalid email address")

        result = await sender.send_email(
            MockEnv(),
            from_email="noreply@app.com",
            to=["bad@example.com"],
            subject="Fail Test",
            body_text="should fail",
        )

        assert result == EmailResult(
            success=False, message_id=None, error="Invalid email address"
        )
        assert sender.failure_count == 1
        assert sender.success_count == 0

    @pytest.mark.asyncio
    async def test_send_default_failure_mode(self):
        sender = MockEmailSender()
        sender.set_default_failure("service down")

        result = await sender.send_email(
            MockEnv(),
            from_email="noreply@app.com",
            to=["user@example.com"],
            subject="Default fail",
            body_text="this fails",
        )

        assert result == EmailResult(success=False, message_id=None, error="service down")
        assert sender.count == 1
        assert sender.failure_count == 1

    @pytest.mark.asyncio
    async def test_send_bulk_via_concurrency(self):
        sender = MockEmailSender()

        messages = [
            dict(
                from_email="noreply@app.com",
                to=[f"user{i}@example.com"],
                subject=f"Item {i}",
                body_text=f"message {i}",
            )
            for i in range(4)
        ]

        results = await asyncio.gather(
            *[
                sender.send_email(
                    MockEnv(),
                    **message,
                )
                for message in messages
            ]
        )

        assert len(results) == 4
        assert all(result.success for result in results)
        assert sender.count == 4
        assert sender.get_by_subject("Item 1")[0].to == ["user1@example.com"]

    @pytest.mark.asyncio
    async def test_filtering_and_clear(self):
        sender = MockEmailSender()
        await sender.send_email(
            MockEnv(),
            from_email="noreply@app.com",
            to=["alice@example.com"],
            subject="X",
            body_text="A",
        )
        await sender.send_email(
            MockEnv(),
            from_email="noreply@app.com",
            to=["bob@example.com", "alice@example.com"],
            subject="Y",
            body_text="B",
        )

        assert len(sender.get_sent_to("alice@example.com")) == 2
        assert len(sender.get_by_subject("X")) == 1
        sender.clear()
        assert sender.count == 0
