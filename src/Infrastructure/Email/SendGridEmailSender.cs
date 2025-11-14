// ... existing code ...
using SendGrid;
using SendGrid.Helpers.Mail;

public class SendGridEmailSender : IEmailSender {
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public SendGridEmailSender(IConfiguration cfg) {
        _apiKey = cfg["SENDGRID_API_KEY"]!;
        _fromEmail = cfg["FROM_EMAIL"]!;
        _fromName = cfg["FROM_NAME"] ?? "AIFShop";
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default) {
        var client = new SendGridClient(_apiKey);
        var from = new EmailAddress(_fromEmail, _fromName);
        var toAddr = new EmailAddress(to);
        var msg = MailHelper.CreateSingleEmail(from, toAddr, subject, plaintextContent: null, htmlContent: htmlBody);
        var resp = await client.SendEmailAsync(msg, ct);

        if (!resp.IsSuccessStatusCode) {
            var body = await resp.Body.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"SendGrid failed: {resp.StatusCode} - {body}");
        }
    }
}
// ... existing code ...