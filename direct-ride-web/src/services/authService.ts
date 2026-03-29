type LoginResponse = {
  token: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: 'driver' | 'rider';
};

function createMockJwt(payload: JwtPayload): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${encode(header)}.${encode(payload)}.mock-signature`;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  if (email === 'driver@directride.com' && password === 'password123') {
    return {
      token: createMockJwt({
        sub: '1',
        email,
        role: 'driver',
      }),
    };
  }

  if (email === 'rider@directride.com' && password === 'password123') {
    return {
      token: createMockJwt({
        sub: '2',
        email,
        role: 'rider',
      }),
    };
  }

  throw new Error('Invalid email or password.');
}