const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RiMaps API Documentation',
            version: '1.0.0',
            description: 'A unified Maps API that aggregates data from various mapping services',
            contact: {
                name: 'API Support',
                email: 'support@rimaps.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://api.rimaps.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error'
                        },
                        message: {
                            type: 'string',
                            example: 'Validation failed'
                        },
                        code: {
                            type: 'integer',
                            example: 400
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'lat'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Latitude must be between -90 and 90'
                                    },
                                    value: {
                                        type: 'string',
                                        example: '100'
                                    }
                                }
                            }
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                GeocodeResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                address: {
                                    type: 'string',
                                    example: '1600 Amphitheatre Parkway, Mountain View, CA'
                                },
                                location: {
                                    type: 'object',
                                    properties: {
                                        lat: {
                                            type: 'number',
                                            example: 37.4224764
                                        },
                                        lng: {
                                            type: 'number',
                                            example: -122.0842499
                                        }
                                    }
                                },
                                formattedAddress: {
                                    type: 'string',
                                    example: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA'
                                }
                            }
                        },
                        provider: {
                            type: 'string',
                            example: 'google'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                DirectionsResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                distance: {
                                    type: 'object',
                                    properties: {
                                        text: {
                                            type: 'string',
                                            example: '5.2 km'
                                        },
                                        value: {
                                            type: 'number',
                                            example: 5200
                                        }
                                    }
                                },
                                duration: {
                                    type: 'object',
                                    properties: {
                                        text: {
                                            type: 'string',
                                            example: '15 mins'
                                        },
                                        value: {
                                            type: 'number',
                                            example: 900
                                        }
                                    }
                                },
                                steps: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            instruction: {
                                                type: 'string',
                                                example: 'Turn right onto Main St'
                                            },
                                            distance: {
                                                type: 'object',
                                                properties: {
                                                    text: {
                                                        type: 'string',
                                                        example: '100 m'
                                                    },
                                                    value: {
                                                        type: 'number',
                                                        example: 100
                                                    }
                                                }
                                            },
                                            duration: {
                                                type: 'object',
                                                properties: {
                                                    text: {
                                                        type: 'string',
                                                        example: '1 min'
                                                    },
                                                    value: {
                                                        type: 'number',
                                                        example: 60
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        provider: {
                            type: 'string',
                            example: 'google'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        },
        security: [
            {
                ApiKeyAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js'] // Path to the API routes
};

module.exports = swaggerJsdoc(options); 