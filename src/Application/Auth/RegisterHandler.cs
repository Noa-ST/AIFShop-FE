// ... existing code ...
public async Task<IActionResult> Register(RegisterRequest req) {
    var user = await _auth.CreateUserAsync(req);

    // Tạm vô hiệu hóa xác nhận email nếu được bật qua env
    var disable = Environment.GetEnvironmentVariable("DISABLE_EMAIL_CONFIRMATION");
    if (string.Equals(disable, "true", StringComparison.OrdinalIgnoreCase)) {
        return Created("", new { success = true, message = "Đã tạo tài khoản. Xác nhận email đang tạm vô hiệu hóa." });
    }

    var token = await _auth.GenerateEmailConfirmTokenAsync(user);
    _jobs.Enqueue(() => _emailSender.SendAsync(user.Email, "Confirm your email", BuildHtml(token)));
    return Created("", new { success = true, message = "Account created. Check your email." });
}
// ... existing code ...