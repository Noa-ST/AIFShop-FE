// ... existing code ...
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

public class EmailSender : IEmailSender {
    private readonly EmailOptions _opts;
    public EmailSender(EmailOptions opts) { _opts = opts; }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default) {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_opts.FromName, _opts.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = 60000; // 60s

        await client.ConnectAsync(_opts.Host, _opts.Port, SecureSocketOptions.StartTls, ct); // Port 587
        await client.AuthenticateAsync(_opts.Username, _opts.Password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
// ... existing code ...