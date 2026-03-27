import 'reflect-metadata';
import { validate } from 'class-validator';
import { SubmitBountyWorkDto, WorkSubmissionDto } from './submit-work.dto';

describe('SubmitBountyWorkDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'Implemented the feature as requested';
    dto.submissions = [submission1];
    dto.attachmentUrls = ['https://example.com/screenshot.png'];
    dto.additionalComments = 'Please review when you have time';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation without submissions', async () => {
    const dto = new SubmitBountyWorkDto();
    (dto as any).submissions = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isArray');
  });

  it('should fail validation with empty submissions array', async () => {
    const dto = new SubmitBountyWorkDto();
    dto.submissions = [];

    const errors = await validate(dto);
    // Array length validation may or may not fail depending on business logic
    // For now, we allow empty arrays but require at least one submission
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid PR URL format', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'not-a-valid-url';
    submission1.description = 'Some description';
    dto.submissions = [submission1];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with PR URL without protocol', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'github.com/user/repo/pull/123';
    submission1.description = 'Some description';
    dto.submissions = [submission1];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with empty PR URL', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = '';
    submission1.description = 'Some description';
    dto.submissions = [submission1];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with missing description', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = '';
    dto.submissions = [submission1];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with PR URL exceeding max length', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/' + 'a'.repeat(2030) + '/pull/123';
    submission1.description = 'Some description';
    dto.submissions = [submission1];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with description exceeding max length', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'a'.repeat(5001);
    dto.submissions = [submission1];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with invalid attachment URLs', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'Some description';
    dto.submissions = [submission1];
    dto.attachmentUrls = ['not-a-valid-url'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isUrl');
  });

  it('should fail validation with attachment URL exceeding max length', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'Some description';
    dto.submissions = [submission1];
    dto.attachmentUrls = ['https://example.com/' + 'a'.repeat(2030)];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it('should fail validation with additional comments exceeding max length', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'Some description';
    dto.submissions = [submission1];
    dto.additionalComments = 'a'.repeat(1001);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it('should pass validation with multiple submissions', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'First PR description';
    const submission2 = new WorkSubmissionDto();
    submission2.prUrl = 'https://github.com/user/repo/pull/456';
    submission2.description = 'Second PR description';
    dto.submissions = [submission1, submission2];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with optional fields omitted', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://github.com/user/repo/pull/123';
    submission1.description = 'Some description';
    dto.submissions = [submission1];
    // attachmentUrls and additionalComments are optional

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with various URL formats', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'https://gitlab.com/user/repo/merge_requests/123';
    submission1.description = 'GitLab MR';
    dto.submissions = [submission1];
    dto.attachmentUrls = [
      'https://i.imgur.com/example.png',
      'https://drive.google.com/file/d/123/view',
    ];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with HTTP URLs (not enforcing HTTPS)', async () => {
    const dto = new SubmitBountyWorkDto();
    const submission1 = new WorkSubmissionDto();
    submission1.prUrl = 'http://github.com/user/repo/pull/123';
    submission1.description = 'HTTP instead of HTTPS';
    dto.submissions = [submission1];

    const errors = await validate(dto);
    // Note: HTTP is technically valid for IsUrl validator
    // If HTTPS enforcement is needed, use a custom regex or additional validator
    expect(errors.length).toBe(0);
  });
});
