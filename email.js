// Mock Email Providers
class EmailProvider1 {
    async send(email) {
        // Simulate random failure
        if (Math.random() > 0.7) throw new Error("Provider1 failed");
        return { success: true, provider: "Provider1" };
    }
}

class EmailProvider2 {
    async send(email) {
        // Simulate random failure
        if (Math.random() > 0.7) throw new Error("Provider2 failed");
        return { success: true, provider: "Provider2" };
    }
}

// Helper function to delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class EmailService {
    constructor() {
        this.providers = [new EmailProvider1(), new EmailProvider2()];
        this.currentProviderIndex = 0;
        this.sentEmails = new Set();
        this.rateLimit = 5; // max 5 emails per minute
        this.sentCount = 0;
        this.retryLimit = 3;
        this.resetRateLimit();
    }

    resetRateLimit() {
        setInterval(() => {
            this.sentCount = 0;
        }, 60000); // Reset every minute
    }

    async sendEmail(email) {
        if (this.sentEmails.has(email.id)) {
            console.log("Email already sent, skipping.");
            return { status: "duplicate" };
        }

        if (this.sentCount >= this.rateLimit) {
            throw new Error("Rate limit exceeded, please try again later.");
        }

        let attempt = 0;
        let backoff = 1000; // Start with 1-second delay
        let success = false;
        let response = null;

        while (attempt < this.retryLimit && !success) {
            try {
                response = await this.providers[this.currentProviderIndex].send(email);
                success = response.success;
                console.log(`Email sent via ${response.provider}`);
            } catch (error) {
                console.log(`${error.message}, retrying...`);
                attempt++;
                if (attempt < this.retryLimit) {
                    await delay(backoff);
                    backoff *= 2; // Exponential backoff
                } else {
                    this.switchProvider();
                    attempt = 0; // reset attempts for next provider
                }
            }
        }

        if (success) {
            this.sentEmails.add(email.id);
            this.sentCount++;
            return { status: "sent", provider: response.provider };
        } else {
            return { status: "failed" };
        }
    }

    switchProvider() {
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        console.log(`Switched to ${this.providers[this.currentProviderIndex].constructor.name}`);
    }
}

// Example Usage
const emailService = new EmailService();

const email1 = { id: 1, to: "kaviyarasuramesh610@gmail.com", body: "Hello World!" };
const email2 = { id: 2, to: "pragatheeshwaran99@gmail.com", body: "Another email!" };

// Send emails
(async () => {
    console.log(await emailService.sendEmail(email1));
    console.log(await emailService.sendEmail(email2));
})();