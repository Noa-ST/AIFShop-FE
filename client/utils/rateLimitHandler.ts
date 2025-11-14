class RateLimitHandler {
  private cooldownEndTime: number = 0;
  private isCooldownActive: boolean = false;

  handleRateLimitError(retryAfter: number): void {
    this.cooldownEndTime = Date.now() + retryAfter * 1000;
    this.isCooldownActive = true;
    
    // Auto-enable after cooldown
    setTimeout(() => {
      this.isCooldownActive = false;
    }, retryAfter * 1000);
  }

  canMakeRequest(): boolean {
    return !this.isCooldownActive || Date.now() >= this.cooldownEndTime;
  }

  getRemainingCooldown(): number {
    if (!this.isCooldownActive) return 0;
    const remaining = Math.ceil((this.cooldownEndTime - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  reset(): void {
    this.cooldownEndTime = 0;
    this.isCooldownActive = false;
  }
}

export const rateLimitHandler = new RateLimitHandler();
