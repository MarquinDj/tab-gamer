import email from "infra/email";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { ForbiddenError, NotFoundError } from "infra/errors";
import user from "models/user.js";
import authorization from "./authorization";

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Fintab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no FinTab

${webserver.origin}/cadastro/ativar/${activationToken.id}
Atenciosamente,
Equipe FinTab`,
  });
}

async function searchValidTokenById(token) {
  const tokenObject = await runSelectQuery(token);
  return tokenObject;

  async function runSelectQuery(token) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND
        NOW() < expires_at
        AND
        used_at IS NULL
      LIMIT 1;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runSelectQuery(activationTokenId);
  return usedActivationToken;

  async function runSelectQuery(activationTokenId) {
    const results = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *;`,
      values: [activationTokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActive = await user.findOneById(userId);

  if (!authorization.can(userToActive, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Contate o suporte caso você acredito que isto seja um erro.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  searchValidTokenById,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILISECONDS,
};

export default activation;
