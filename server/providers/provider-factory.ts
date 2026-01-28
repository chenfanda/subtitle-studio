export interface SMSService {
    sendOTP(phone: string, code: string): Promise<boolean>;
}

export interface EmailService {
    sendOTP(email: string, code: string): Promise<boolean>;
}

export class MockSMSService implements SMSService {
    async sendOTP(phone: string, code: string): Promise<boolean> {
        console.log(`[Mock SMS] Sending code ${code} to ${phone}`);
        return true;
    }
}

export class MockEmailService implements EmailService {
    async sendOTP(email: string, code: string): Promise<boolean> {
        console.log(`[Mock Email] Sending code ${code} to ${email}`);
        return true;
    }
}

// factory logic
import { SERVER_CONFIG } from '../config/server-config';

export function getSMSService(): SMSService {
    const provider = process.env.AUTH_PROVIDER || 'mock';
    if (provider === 'mock') return new MockSMSService();
    // Aliyun/Tencent logic would go here
    return new MockSMSService();
}

export function getEmailService(): EmailService {
    const provider = process.env.AUTH_PROVIDER || 'mock';
    if (provider === 'mock') return new MockEmailService();
    return new MockEmailService();
}
