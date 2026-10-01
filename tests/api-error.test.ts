import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/lib/errors/api-error';

describe('ApiError Class', () => {
  it('correctly sets error message and status code', () => {
    const error = new ApiError('Not Found', 404);
    assert.strictEqual(error.message, 'Not Found');
    assert.strictEqual(error.statusCode, 404);
    assert.strictEqual(error.isNetworkError, false);
    assert.strictEqual(error.name, 'ApiError');
  });

  it('correctly builds from response object', () => {
    const error = ApiError.fromResponse(400, {
      message: 'Validation failed',
      errors: { phone: ['Phone is invalid'] },
    });
    assert.strictEqual(error.message, 'Validation failed');
    assert.strictEqual(error.statusCode, 400);
    assert.deepStrictEqual(error.errors, { phone: ['Phone is invalid'] });
  });

  it('correctly builds network error', () => {
    const error = ApiError.network(new Error('Connection failed'));
    assert.strictEqual(error.message, 'Connection failed');
    assert.strictEqual(error.statusCode, 0);
    assert.strictEqual(error.isNetworkError, true);
  });
});
