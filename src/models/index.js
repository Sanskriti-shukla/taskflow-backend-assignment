const User = require('./user');
const Organization = require('./organization');
const OrgMember = require('./orgMember');
const Project = require('./project');
const Task = require('./task');
const TaskAssignment = require('./taskAssignment');
const Comment = require('./comment');
const RefreshToken = require('./refreshToken');

Organization.hasMany(OrgMember, { foreignKey: 'organizationId', as: 'members' });
OrgMember.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

User.hasMany(OrgMember, { foreignKey: 'userId', as: 'memberships' });
OrgMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Organization.hasMany(Project, { foreignKey: 'organizationId', as: 'projects' });
Project.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Task.hasMany(TaskAssignment, { foreignKey: 'taskId', as: 'assignments' });
TaskAssignment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(TaskAssignment, { foreignKey: 'userId', as: 'assignments' });
TaskAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Organization.hasMany(RefreshToken, { foreignKey: 'organizationId', as: 'refreshTokens' });
RefreshToken.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

module.exports = {
    User,
    Organization,
    OrgMember,
    Project,
    Task,
    TaskAssignment,
    Comment,
    RefreshToken
};
