const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'TaskFlow REST API',
            version: '1.0.0',
            description: 'Multi-tenant project and task management backend'
        },
        servers: [
    {
        url: 'https://taskflow-backend-assignment-production.up.railway.app',
        description: 'Production - Railway'
    },
    {
        url: 'http://localhost:3000',
        description: 'Local Docker'
    }
],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/api-docs/*.yaml']
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            docExpansion: 'none',
            displayRequestDuration: true
        },
        customSiteTitle: 'TaskFlow API Documentation'
    }));
};

module.exports = swaggerDocs;
