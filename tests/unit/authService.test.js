const AuthServices = require('../../src/services/authService');

describe('authentication logic', () => {
    const service = new AuthServices();

    test('bcrypt hashes and verifies a password', async () => {
        const hash = await service.hashPassword('Password123!');
        expect(hash).not.toBe('Password123!');
        await expect(service.verifyPassword('Password123!', hash)).resolves.toBe(true);
        await expect(service.verifyPassword('WrongPassword', hash)).resolves.toBe(false);
    });

    test('refresh tokens are stored as SHA-256 hashes', () => {
        const hash = AuthServices.hashRefreshToken('sample-refresh-token');
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
        expect(hash).not.toContain('sample-refresh-token');
    });
});
