import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedImageReference, safeImageReference } from '@/lib/storage/image-reference';

test('production image references reject inline payloads and unsafe schemes', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  assert.equal(isAllowedImageReference('data:image/png;base64,abc'), false);
  assert.equal(isAllowedImageReference('javascript:alert(1)'), false);
  assert.equal(isAllowedImageReference('http://example.com/photo.jpg'), false);
  assert.equal(isAllowedImageReference('https://example.com/photo.jpg'), true);
  assert.equal(safeImageReference('data:image/png;base64,abc'), undefined);
  (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
});
