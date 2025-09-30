export const config = {
  port: process.env.PORT || 3000,
  jwt: process.env.JWT_SECRET || "change-me",
  clientOrigin: process.env.CLIENT_ORIGIN || "*"
};
