import smtplib
from email.message import EmailMessage
import os
import logging
from dotenv import load_dotenv

# Load env variables from backend/.env securely
load_dotenv(override=True)

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp_code: str) -> bool:
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    msg = EmailMessage()
    msg.set_content(f"Hello,\n\nYour Nyaya-Sathi password reset code is: {otp_code}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.\n\nThank you,\nNyaya-Sathi Team")
    msg['Subject'] = "Nyaya-Sathi Password Reset Code"
    msg['From'] = smtp_username if smtp_username else "noreply@nyaysathi.com"
    msg['To'] = to_email

    try:
        if not smtp_username or not smtp_password:
            logger.error("Missing SMTP credentials in .env file! Cannot send email.")
            return False
            
        # Secure SMTP connection (Host: smtp.gmail.com, Port: 587, Secure: False, but uses STARTTLS)
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
        server.set_debuglevel(0) # Set to 1 if you need more verbose console output
        server.starttls()
        
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
        
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(f"SMTP Auth Failed (Check Gmail App Password): {auth_err}")
        print(f"\n[CRITICAL] Gmail Authentication Failed: {auth_err}\nEnsure you use an App Password, not your regular Gmail password.")
        return False
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}")
        print(f"\n[CRITICAL] SMTP Connection Error: {e}")
        return False
