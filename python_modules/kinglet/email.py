"""
Kinglet Email Service - Amazon SES integration with async mock support

Provides email sending capabilities with:
- Amazon SES integration for production
- Async mock email sender for testing
- Template support
- HTML and plain text email support
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class EmailMessage:
    """Email message data structure"""

    to: list[str]
    subject: str
    body_text: str | None = None
    body_html: str | None = None
    from_address: str | None = None
    reply_to: list[str] = field(default_factory=list)
    cc: list[str] = field(default_factory=list)
    bcc: list[str] = field(default_factory=list)
    headers: dict[str, str] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class EmailSendResult:
    """Result of email send operation"""

    success: bool
    message_id: str | None = None
    error: str | None = None
    timestamp: datetime = field(default_factory=datetime.now)


class MockEmailSender:
    """
    Mock email sender for testing
    
    Captures sent emails in memory for test assertions.
    Supports async operations to match production SES interface.
    """

    def __init__(self):
        self.sent_emails: list[EmailMessage] = []
        self.should_fail = False
        self.fail_count = 0
        self._send_delay = 0.0  # Simulate network delay in tests

    async def send_email(self, message: EmailMessage) -> EmailSendResult:
        """
        Send an email (mock - stores in memory)
        
        Args:
            message: EmailMessage to send
            
        Returns:
            EmailSendResult with success status
        """
        # Simulate async operation
        if self._send_delay > 0:
            await asyncio.sleep(self._send_delay)

        # Simulate failure if configured
        if self.should_fail:
            self.fail_count += 1
            return EmailSendResult(
                success=False, error=f"Mock send failure #{self.fail_count}"
            )

        # Store email for test assertions
        self.sent_emails.append(message)

        # Generate mock message ID
        message_id = f"mock-{len(self.sent_emails)}-{datetime.now().timestamp()}"

        return EmailSendResult(success=True, message_id=message_id)

    async def send_bulk_email(
        self, messages: list[EmailMessage]
    ) -> list[EmailSendResult]:
        """
        Send multiple emails
        
        Args:
            messages: List of EmailMessage objects
            
        Returns:
            List of EmailSendResult objects
        """
        results = []
        for message in messages:
            result = await self.send_email(message)
            results.append(result)
        return results

    def clear(self):
        """Clear all sent emails (useful between tests)"""
        self.sent_emails.clear()
        self.fail_count = 0

    def get_sent_to(self, email_address: str) -> list[EmailMessage]:
        """Get all emails sent to a specific address"""
        return [email for email in self.sent_emails if email_address in email.to]

    def get_latest_email(self) -> EmailMessage | None:
        """Get the most recently sent email"""
        return self.sent_emails[-1] if self.sent_emails else None

    def set_send_delay(self, delay: float):
        """Set artificial delay for send operations (for testing async behavior)"""
        self._send_delay = delay


class SESEmailSender:
    """
    Amazon SES email sender for production use
    
    Note: Requires boto3 and AWS credentials configured.
    This is a placeholder implementation that would need boto3.
    """

    def __init__(self, region: str = "us-east-1", from_address: str | None = None):
        self.region = region
        self.default_from_address = from_address
        self._client = None

    def _get_client(self):
        """Lazy load SES client (requires boto3)"""
        if self._client is None:
            try:
                import boto3

                self._client = boto3.client("ses", region_name=self.region)
            except ImportError:
                raise ImportError(
                    "boto3 is required for SES email sending. "
                    "Install it with: pip install boto3"
                )
        return self._client

    async def send_email(self, message: EmailMessage) -> EmailSendResult:
        """
        Send an email via Amazon SES
        
        Args:
            message: EmailMessage to send
            
        Returns:
            EmailSendResult with success status and message ID
        """
        try:
            client = self._get_client()

            # Prepare email data
            from_addr = message.from_address or self.default_from_address
            if not from_addr:
                raise ValueError("from_address must be specified")

            destination = {"ToAddresses": message.to}
            if message.cc:
                destination["CcAddresses"] = message.cc
            if message.bcc:
                destination["BccAddresses"] = message.bcc

            email_message = {"Subject": {"Data": message.subject}}

            if message.body_html:
                email_message["Body"] = {"Html": {"Data": message.body_html}}
                if message.body_text:
                    email_message["Body"]["Text"] = {"Data": message.body_text}
            elif message.body_text:
                email_message["Body"] = {"Text": {"Data": message.body_text}}
            else:
                raise ValueError("Either body_text or body_html must be provided")

            # Send via SES (async wrapper around boto3)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.send_email(
                    Source=from_addr, Destination=destination, Message=email_message
                ),
            )

            return EmailSendResult(
                success=True, message_id=response.get("MessageId", "unknown")
            )

        except Exception as e:
            return EmailSendResult(success=False, error=str(e))

    async def send_bulk_email(
        self, messages: list[EmailMessage]
    ) -> list[EmailSendResult]:
        """Send multiple emails via SES"""
        results = []
        for message in messages:
            result = await self.send_email(message)
            results.append(result)
        return results


def get_email_sender(env=None, use_mock=None) -> MockEmailSender | SESEmailSender:
    """
    Factory function to get appropriate email sender
    
    Args:
        env: Environment object (Cloudflare Workers env)
        use_mock: Override to force mock (True) or SES (False). 
                 If None, determined from env.ENVIRONMENT
    
    Returns:
        MockEmailSender for development/testing, SESEmailSender for production
    """
    # Determine if we should use mock
    if use_mock is not None:
        should_use_mock = use_mock
    else:
        environment = getattr(env, "ENVIRONMENT", "development") if env else "development"
        should_use_mock = environment in ("development", "test", "testing")

    if should_use_mock:
        return MockEmailSender()
    else:
        # Get SES configuration from environment
        region = getattr(env, "AWS_REGION", "us-east-1") if env else "us-east-1"
        from_address = getattr(env, "EMAIL_FROM_ADDRESS", None) if env else None
        return SESEmailSender(region=region, from_address=from_address)
