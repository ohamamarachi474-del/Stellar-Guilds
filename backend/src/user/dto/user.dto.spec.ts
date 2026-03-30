import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto, UpdateUserDto } from './user.dto';

describe('CreateUserDto', () => {
  it('accepts a valid user creation payload', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'builder@example.com',
      username: 'stellarbuilder',
      password: 'StrongPassword123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      walletAddress: '0x1111111111111111111111111111111111111111',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('normalizes email casing and surrounding whitespace', () => {
    const dto = plainToInstance(CreateUserDto, {
      email: '  USER@Example.COM  ',
      username: 'stellarbuilder',
      password: 'StrongPassword123',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(dto.email).toBe('user@example.com');
  });

  it('rejects invalid email format', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'not-an-email',
      username: 'stellarbuilder',
      password: 'StrongPassword123',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('rejects usernames shorter than the minimum length', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'builder@example.com',
      username: 'ab',
      password: 'StrongPassword123',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('rejects passwords shorter than the minimum length', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'builder@example.com',
      username: 'stellarbuilder',
      password: 'short',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('rejects blank names after trimming', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'builder@example.com',
      username: 'stellarbuilder',
      password: 'StrongPassword123',
      firstName: '   ',
      lastName: 'Lovelace',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('rejects invalid wallet addresses', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'builder@example.com',
      username: 'stellarbuilder',
      password: 'StrongPassword123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      walletAddress: 'invalid-wallet',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('matches');
  });
});

describe('UpdateUserDto', () => {
  it('accepts a valid partial update payload', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      firstName: 'Ada',
      bio: 'Building validator-backed user payloads',
      profileUrl: 'https://example.com/profile/ada',
      githubHandle: 'adalovelace',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('trims string fields during update', () => {
    const dto = plainToInstance(UpdateUserDto, {
      firstName: '  Ada  ',
      location: '  Lagos  ',
    });

    expect(dto.firstName).toBe('Ada');
    expect(dto.location).toBe('Lagos');
  });

  it('rejects blank profile fields after trimming', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      bio: '   ',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('rejects invalid profile URLs', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      profileUrl: 'example.com/profile/ada',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isUrl');
  });
});
