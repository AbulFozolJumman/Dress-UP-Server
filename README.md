# Dress-Up-Server

## Live Link - [https://dress-up-server.vercel.app](https://dress-up-server.vercel.app)

## Installation:

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Rename `.env.example` to `.env`.
4. Run the server using `npm run dev`.

## Configuration:

- Environment Variables:
  - `PORT`: Port number the server listens on.
  - `MONGODB_URI`: URI for MongoDB database.
  - `JWT_SECRET`: Secret key for JWT token generation.
  - `EXPIRES_IN`: Token expiration time.

## Usage:

- API Endpoints:

/api/v1/Register (POST): For user Register
/api/v1/login (POST): For user Login
/api/v1/products (GET): Retrieves all products with filter, sort and limit system.
/api/v1/products/:id (GET): Retrieves a single product by its \_id.
/api/v1/products (POST): Creates a new product with the given data.
/api/v1/products/:id (PUT): Updates an existing product by its \_id.
/api/v1/products/:id (DELETE): Deletes a product by its \_id.

## Dependencies:

- `bcrypt`: Library for hashing passwords.
- `cors`: Express middleware for enabling CORS.
- `dotenv`: Loads environment variables from .env file.
- `express`: Web framework for Node.js.
- `jsonwebtoken`: Library for generating and verifying JWT tokens.
- `mongodb`: MongoDB driver for Node.js.
- `nodemon`: Utility for automatically restarting the server during development.
