import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import axios from 'axios';
import * as crypto from 'crypto';

interface JwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  realm_access?: { roles: string[] };
}

interface JwksKey {
  kty: string;
  kid: string;
  use: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: JwksKey[];
}

interface JwtHeader {
  kid: string;
  alg: string;
  typ: string;
}

let cachedPublicKey: string | null = null;
let cacheExpiry = 0;

async function getPublicKey(kid: string): Promise<string> {
  if (cachedPublicKey && Date.now() < cacheExpiry) {
    return cachedPublicKey;
  }

  const keycloakUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const certsUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

  const { data } = await axios.get<JwksResponse>(certsUrl);
  const key = data.keys.find((k) => k.kid === kid);

  if (!key) {
    throw new Error(`Key ${kid} not found in JWKS`);
  }

  const publicKey = convertJwkToPem(key);
  cachedPublicKey = publicKey;
  cacheExpiry = Date.now() + 3600000;

  return publicKey;
}

function convertJwkToPem(jwk: JwksKey): string {
  const keyObject = crypto.createPublicKey({
    key: JSON.stringify(jwk),
    format: 'jwk',
  });
  return keyObject.export({ type: 'spki', format: 'pem' }) as string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const realm = process.env.KEYCLOAK_REALM;

    if (!keycloakUrl || !realm) {
      super({
        secretOrKey: 'no-keycloak-configured',
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      });
      this.logger.warn('Keycloak no configurado — auth deshabilitado');
      return;
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        request: Record<string, unknown>,
        rawJwtToken: string,
        done: (err: Error | null, key?: string) => void,
      ) => {
        const header = JSON.parse(
          Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString(),
        ) as JwtHeader;
        getPublicKey(header.kid)
          .then((publicKey) => done(null, publicKey))
          .catch((err: Error) => done(err));
      },
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });

    this.logger.log('JwtStrategy inicializada con Keycloak (JWKS manual)');
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      email: payload.email,
      preferred_username: payload.preferred_username,
      realm_access: payload.realm_access,
    };
  }
}
