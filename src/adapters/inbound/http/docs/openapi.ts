export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Mini Fintech API",
    version: "1.0.0",
    description: "API para processamento de transacoes financeiras com arquitetura hexagonal"
  },
  servers: [
    { url: "/api", description: "Base path local" }
  ],
  tags: [
    { name: "Users" },
    { name: "Cards" },
    { name: "Transactions" },
    { name: "Invoices" }
  ],
  components: {
    schemas: {
      BaseIdCreated: {
        type: "object",
        properties: {
          id: { type: "string" },
          createdAt: { type: "string", format: "date-time" }
        },
        required: ["id", "createdAt"]
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid input" }
            },
            required: ["code", "message"]
          }
        },
        required: ["error"]
      },
      CreateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Alice" },
          email: { type: "string", format: "email", example: "alice@mail.com" },
          password: { type: "string", minLength: 8, example: "12345678" }
        },
        required: ["name", "email", "password"]
      },
      UserResponse: {
        allOf: [
          { $ref: "#/components/schemas/BaseIdCreated" },
          {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" }
            },
            required: ["name", "email"]
          }
        ]
      },
      CreateCardRequest: {
        type: "object",
        properties: {
          userId: { type: "string", example: "user-id" },
          cardNumber: { type: "string", pattern: String.raw`^\d{16}$`, example: "1234123412341234" },
          limitCents: { type: "integer", minimum: 100, example: 500000 }
        },
        required: ["userId", "cardNumber", "limitCents"]
      },
      CardResponse: {
        allOf: [
          { $ref: "#/components/schemas/BaseIdCreated" },
          {
            type: "object",
            properties: {
              userId: { type: "string" },
              last4: { type: "string", example: "1234" },
              limitCents: { type: "integer" },
              availableLimitCents: { type: "integer" },
              status: { type: "string", enum: ["ACTIVE", "BLOCKED"] }
            },
            required: ["userId", "last4", "limitCents", "availableLimitCents", "status"]
          }
        ]
      },
      ProcessTransactionRequest: {
        type: "object",
        properties: {
          userId: { type: "string", example: "user-id" },
          cardId: { type: "string", example: "card-id" },
          amountCents: { type: "integer", minimum: 1, example: 10000 },
          description: { type: "string", example: "Compra mercado" }
        },
        required: ["userId", "cardId", "amountCents", "description"]
      },
      TransactionResponse: {
        allOf: [
          { $ref: "#/components/schemas/BaseIdCreated" },
          {
            type: "object",
            properties: {
              userId: { type: "string" },
              cardId: { type: "string" },
              amountCents: { type: "integer" },
              description: { type: "string" },
              status: { type: "string", enum: ["PENDING", "APPROVED", "DECLINED", "CANCELLED", "CHARGEBACK"] },
              referenceMonth: { type: "string", example: "2026-03" },
              cancelledAt: { type: "string", format: "date-time", nullable: true },
              chargebackAt: { type: "string", format: "date-time", nullable: true }
            },
            required: ["userId", "cardId", "amountCents", "description", "status", "referenceMonth"]
          }
        ]
      },
      InvoiceResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          cardId: { type: "string" },
          userId: { type: "string" },
          referenceMonth: { type: "string", example: "2026-03" },
          totalCents: { type: "integer" },
          transactionIds: { type: "array", items: { type: "string" } },
          generatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "cardId", "userId", "referenceMonth", "totalCents", "transactionIds", "generatedAt"]
      },
    },
    parameters: {
      transactionId: {
        name: "transactionId",
        in: "path",
        required: true,
        schema: { type: "string" }
      },
      cardId: {
        name: "cardId",
        in: "path",
        required: true,
        schema: { type: "string" }
      }
    },
    responses: {
      ErrorValidation: {
        description: "Erro de validacao",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
        }
      }
    }
  },
  paths: {
    "/users": {
      post: {
        tags: ["Users"],
        summary: "Criar usuario",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserRequest" } } }
        },
        responses: {
          "201": { description: "Usuario criado", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
          "400": { $ref: "#/components/responses/ErrorValidation" }
        }
      }
    },
    "/cards": {
      post: {
        tags: ["Cards"],
        summary: "Criar cartao",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCardRequest" } } }
        },
        responses: {
          "201": { description: "Cartao criado", content: { "application/json": { schema: { $ref: "#/components/schemas/CardResponse" } } } },
          "404": { $ref: "#/components/responses/ErrorValidation" }
        }
      }
    },
    "/transactions": {
      post: {
        tags: ["Transactions"],
        summary: "Processar transacao",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProcessTransactionRequest" } } }
        },
        responses: {
          "201": { description: "Transacao processada", content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionResponse" } } } }
        }
      }
    },
    "/transactions/{transactionId}/cancel": {
      post: {
        tags: ["Transactions"],
        summary: "Cancelar transacao",
        parameters: [{ $ref: "#/components/parameters/transactionId" }],
        responses: { "200": { description: "Transacao cancelada", content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionResponse" } } } } }
      }
    },
    "/transactions/{transactionId}/chargeback": {
      post: {
        tags: ["Transactions"],
        summary: "Simular chargeback",
        parameters: [{ $ref: "#/components/parameters/transactionId" }],
        responses: { "200": { description: "Chargeback aplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionResponse" } } } } }
      }
    },
    "/cards/{cardId}/invoice": {
      get: {
        tags: ["Invoices"],
        summary: "Gerar ou consultar fatura mensal",
        parameters: [
          { $ref: "#/components/parameters/cardId" },
          { name: "referenceMonth", in: "query", required: true, schema: { type: "string", example: "2026-03" } }
        ],
        responses: { "200": { description: "Fatura do mes", content: { "application/json": { schema: { $ref: "#/components/schemas/InvoiceResponse" } } } } }
      }
    }
  }
} as const;