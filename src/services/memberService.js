const Role = require('../enums/role');
const AppError = require('../common/AppError');
const toServiceError = require('../common/serviceError');
const AuthServices = require('./authService');
const { findUserByEmail, createUser } = require('../repository/userRepository');
const {
    findMembership,
    createMembership,
    getAllMembers,
    updateMembershipRole,
    deleteMembership
} = require('../repository/memberRepository');

class MemberServices {
    async getAllMembers(organizationId) {
        try {
            const result = await getAllMembers(organizationId);
            return { success: true, body: result };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async addMember(data, organizationId) {
        try {
            const email = data.email.toLowerCase().trim();
            let user = await findUserByEmail(email);

            if (!user) {
                if (!data.name || !data.password) {
                    throw new AppError(
                        400,
                        'name and password are required when creating a new user',
                        'VALIDATION_ERROR'
                    );
                }

                const authService = new AuthServices();
                user = await createUser({
                    name: data.name,
                    email,
                    passwordHash: await authService.hashPassword(data.password)
                });
            }

            const existingMembership = await findMembership(organizationId, user.id);
            if (existingMembership) {
                throw new AppError(409, 'User is already a member of this organization', 'MEMBER_ALREADY_EXISTS');
            }

            const membership = await createMembership({
                organizationId,
                userId: user.id,
                role: data.role || Role.MEMBER
            });

            return {
                success: true,
                body: {
                    id: membership.id,
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    role: membership.role
                }
            };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async updateMemberRole(userId, data, organizationId, currentUserId) {
        try {
            if (userId === currentUserId && data.role !== Role.ORG_ADMIN) {
                throw new AppError(400, 'You cannot remove your own admin role', 'CANNOT_DEMOTE_SELF');
            }

            const membership = await findMembership(organizationId, userId);
            if (!membership) {
                throw new AppError(404, 'Member not found', 'MEMBER_NOT_FOUND');
            }

            const result = await updateMembershipRole(membership, data.role);
            return { success: true, body: result };
        } catch (error) {
            return toServiceError(error);
        }
    }

    async deleteMember(userId, organizationId, currentUserId) {
        try {
            if (userId === currentUserId) {
                throw new AppError(400, 'You cannot remove yourself from the organization', 'CANNOT_REMOVE_SELF');
            }

            const membership = await findMembership(organizationId, userId);
            if (!membership) {
                throw new AppError(404, 'Member not found', 'MEMBER_NOT_FOUND');
            }

            await deleteMembership(membership);
            return { success: true, body: { success: true } };
        } catch (error) {
            return toServiceError(error);
        }
    }
}

module.exports = MemberServices;
