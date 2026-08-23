const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
const Role = require('../enums/role');
const AppError = require('../common/AppError');
const toServiceError = require('../common/serviceError');
const {
    findUserByEmail,
    createUser
} = require('../repository/userRepository');
const {
    findOrganizationBySlug,
    createOrganization
} = require('../repository/organizationRepository');
const {
    findMembership,
    createMembership
} = require('../repository/memberRepository');
const {
    createRefreshToken,
    findRefreshTokenById,
    findRefreshTokenByHash,
    revokeRefreshToken,
    revokeAllRefreshTokens
} = require('../repository/refreshTokenRepository');

class AuthServices {
    static hashRefreshToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    async hashPassword(password) {
        const cost = Math.max(Number(process.env.BCRYPT_COST || 12), 12);
        return await bcrypt.hash(password, cost);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    createAccessToken(userId, organizationId, role) {
        return jwt.sign(
            {
                sub: userId,
                organizationId,
                role,
                type: 'access'
            },
            process.env.SECRET_KEY,
            { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
        );
    }

    async createRefreshToken(userId, organizationId) {
        const tokenId = crypto.randomUUID();
        const ttl = process.env.REFRESH_TOKEN_TTL || '7d';
        const token = jwt.sign(
            {
                sub: userId,
                organizationId,
                jti: tokenId,
                type: 'refresh'
            },
            process.env.REFRESH_SECRET_KEY,
            { expiresIn: ttl }
        );

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await createRefreshToken({
            id: tokenId,
            userId,
            organizationId,
            tokenHash: AuthServices.hashRefreshToken(token),
            expiresAt,
            revokedAt: null
        });

        return token;
    }

    async createTokenPair(userId, organizationId, role) {
        return {
            accessToken: this.createAccessToken(userId, organizationId, role),
            refreshToken: await this.createRefreshToken(userId, organizationId),
            tokenType: 'Bearer',
            accessTokenExpiresIn: '15m',
            refreshTokenExpiresIn: '7d'
        };
    }

    async register(data) {
        try {
            const email = data.email.toLowerCase().trim();
            const slug = data.organizationSlug.toLowerCase().trim();

            if (await findUserByEmail(email)) {
                throw new AppError(409, 'Email already registered', 'EMAIL_ALREADY_EXISTS');
            }

            if (await findOrganizationBySlug(slug)) {
                throw new AppError(409, 'Organization slug already exists', 'ORG_SLUG_ALREADY_EXISTS');
            }

            const result = await db.transaction(async (transaction) => {
                const organization = await createOrganization({
                    name: data.organizationName,
                    slug
                }, { transaction });

                const user = await createUser({
                    name: data.name,
                    email,
                    passwordHash: await this.hashPassword(data.password)
                }, { transaction });

                const membership = await createMembership({
                    organizationId: organization.id,
                    userId: user.id,
                    role: Role.ORG_ADMIN
                }, { transaction });

                return { organization, user, membership };
            });

            const tokens = await this.createTokenPair(
                result.user.id,
                result.organization.id,
                result.membership.role
            );

            return {
                success: true,
                body: {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email
                    },
                    organization: {
                        id: result.organization.id,
                        name: result.organization.name,
                        slug: result.organization.slug
                    },
                    role: result.membership.role,
                    tokens
                }
            };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async login(data) {
        try {
            const email = data.email.toLowerCase().trim();
            const slug = data.organizationSlug.toLowerCase().trim();

            const user = await findUserByEmail(email);
            if (!user || !(await this.verifyPassword(data.password, user.passwordHash))) {
                throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
            }

            const organization = await findOrganizationBySlug(slug);
            if (!organization) {
                throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
            }

            const membership = await findMembership(organization.id, user.id);
            if (!membership) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            const tokens = await this.createTokenPair(user.id, organization.id, membership.role);

            return {
                success: true,
                body: {
                    user: { id: user.id, name: user.name, email: user.email },
                    organization: {
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug
                    },
                    role: membership.role,
                    tokens
                }
            };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async refresh(data) {
        try {
            let payload;
            try {
                payload = jwt.verify(data.refreshToken, process.env.REFRESH_SECRET_KEY);
            } catch (error) {
                throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
            }

            if (payload.type !== 'refresh' || !payload.jti) {
                throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
            }

            const storedToken = await findRefreshTokenById(payload.jti);
            const presentedHash = AuthServices.hashRefreshToken(data.refreshToken);

            if (
                !storedToken ||
                storedToken.tokenHash !== presentedHash ||
                storedToken.revokedAt ||
                storedToken.expiresAt <= new Date()
            ) {
                throw new AppError(401, 'Refresh token revoked or expired', 'REFRESH_TOKEN_REVOKED');
            }

            const membership = await findMembership(payload.organizationId, payload.sub);
            if (!membership) {
                throw new AppError(403, 'Forbidden', 'FORBIDDEN');
            }

            // Bonus: refresh-token rotation. Old refresh token is revoked before a new one is issued.
            await revokeRefreshToken(storedToken);
            const tokens = await this.createTokenPair(payload.sub, payload.organizationId, membership.role);

            return { success: true, body: tokens };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async logout(data) {
        try {
            const tokenHash = AuthServices.hashRefreshToken(data.refreshToken);
            const storedToken = await findRefreshTokenByHash(tokenHash);

            if (storedToken && !storedToken.revokedAt) {
                await revokeRefreshToken(storedToken);
            }

            return { success: true, body: { success: true } };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async logoutAll(userId, organizationId) {
        try {
            await revokeAllRefreshTokens(userId, organizationId);
            return { success: true, body: { success: true } };
        } catch (error) {
            return toServiceError(error);
        }
    }
}

module.exports = AuthServices;
